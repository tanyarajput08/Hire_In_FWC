import os
import shutil
import json
import urllib.error
import urllib.request
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from resume_matcher import calculate_match_score, compare_skills, calculate_detailed_scores
from resume_parser import extract_text, extract_skills
from models import model as rag_model
from structured_parser import parse_sections, extract_experience_years
from sklearn.metrics.pairwise import cosine_similarity

def load_local_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue

            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_local_env()

app = FastAPI(title="Resume Screener AI Engine")

DEFAULT_WINDOWS_FFMPEG_BIN = r"C:\ffmpeg-8.1.1-essentials_build\bin"
if os.path.exists(os.path.join(DEFAULT_WINDOWS_FFMPEG_BIN, "ffmpeg.exe")):
    os.environ["PATH"] = DEFAULT_WINDOWS_FFMPEG_BIN + os.pathsep + os.environ.get("PATH", "")

class SkillRequest(BaseModel):
    resume_text: str

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/extract-skills")
def get_skills(data: SkillRequest):
    try:
        skills = extract_skills(data.resume_text)
        return {"skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PDFRequest(BaseModel):
    pdf_path: str
    job_description: str

class InterviewTranscriptRequest(BaseModel):
    transcript: str
    job_description: str

class InterviewVideoRequest(BaseModel):
    video_path: str
    job_description: str

class CandidateContext(BaseModel):
    candidate_id: int | str
    name: str
    role: str | None = None
    score: float | None = None
    status: str | None = None
    resume_text: str
    skills: list[str] = []

class RecruiterAssistantRequest(BaseModel):
    question: str
    candidates: list[CandidateContext]

class CandidateSummaryRequest(BaseModel):
    resume_text: str
    job_description: str
    score: float
    matched_skills: list[str] = []
    missing_skills: list[str] = []

FILLER_WORDS = ["um", "uh", "like", "basically", "actually", "kind of", "sort of"]

def generate_interview_feedback(transcript: str, job_description: str, technical_relevance: float, communication: float, confidence: float):
    prompt = f"""
Return only valid JSON with these keys:
summary, tech_terms, suggestions.

Transcript:
{transcript[:5000]}

Job Description:
{job_description[:3000]}

Scores:
- Technical Relevance Score: {technical_relevance}%
- Communication Score: {communication}%
- Confidence Score: {confidence}%

Generate:
1. summary: A brief 2-3 sentence summary of what the candidate discussed in the interview.
2. tech_terms: A list of relevant technology terms, languages, databases, libraries, or concepts mentioned in their interview audio.
3. suggestions: A brief constructive advice for improvement based on their communication, confidence, and technical scores.
"""
    try:
        res = call_gemini(prompt) or call_openai(prompt)
        if res and isinstance(res, dict):
            summary = res.get("summary", "The candidate discussed their background and technical concepts.")
            tech_terms = res.get("tech_terms", [])
            suggestions = res.get("suggestions", "Focus on technical depth and structured communication.")
            
            tech_str = ", ".join(tech_terms) if tech_terms else "None identified"
            return f"""Summary: {summary}

Key Technologies Mentioned: {tech_str}

Improvement Advice: {suggestions}"""
    except Exception as error:
        print(f"LLM interview feedback generation failed: {error}")

    # Fallback keyword extraction
    words = [w.strip(".,!?;:()").lower() for w in transcript.split()]
    tech_candidates = ["react", "node", "python", "sql", "postgresql", "javascript", "docker", "aws", "git", "api", "express", "flask", "java", "c++", "html", "css", "mongodb"]
    found_tech = list(set([w for w in tech_candidates if w in words]))
    tech_str = ", ".join(found_tech) if found_tech else "None identified"
    
    return f"""Summary: The candidate spoke for {len(words)} words, focusing on technical skills and general background.

Key Technologies Mentioned: {tech_str}

Improvement Advice: Focus on reducing filler words and matching job requirements more closely."""

def score_interview_transcript(transcript: str, job_description: str):
    cleaned = transcript.strip()
    words = [word.strip(".,!?;:").lower() for word in cleaned.split() if word.strip()]
    word_count = len(words)
    unique_words = len(set(words))
    filler_count = sum(words.count(filler) for filler in FILLER_WORDS if " " not in filler)

    lower_transcript = cleaned.lower()
    filler_count += sum(lower_transcript.count(filler) for filler in FILLER_WORDS if " " in filler)

    technical_relevance = calculate_match_score(cleaned, job_description)
    vocabulary_ratio = unique_words / max(word_count, 1)
    length_score = min(word_count / 160, 1) * 100
    filler_penalty = min(filler_count * 4, 35)

    communication = round(max(0, (length_score * 0.45) + (vocabulary_ratio * 100 * 0.55) - filler_penalty), 2)
    confidence = round(max(0, min(100, (length_score * 0.55) + (communication * 0.45) - min(filler_count * 2, 20))), 2)
    overall = round((technical_relevance * 0.45) + (communication * 0.35) + (confidence * 0.20), 2)

    feedback = generate_interview_feedback(
        cleaned,
        job_description,
        technical_relevance,
        communication,
        confidence
    )

    return {
        "transcript": cleaned,
        "communication_score": communication,
        "technical_relevance_score": technical_relevance,
        "confidence_score": confidence,
        "overall_score": overall,
        "filler_count": filler_count,
        "word_count": word_count,
        "feedback": feedback
    }

def build_candidate_document(candidate: CandidateContext):
    parts = [
        f"Name: {candidate.name}",
        f"Role: {candidate.role or 'Unknown'}",
        f"Score: {candidate.score if candidate.score is not None else 'Not screened'}",
        f"Status: {candidate.status or 'Unknown'}",
        f"Skills: {', '.join(candidate.skills) if candidate.skills else 'Not extracted'}",
        f"Resume: {candidate.resume_text}"
    ]
    return "\n".join(parts)

def answer_recruiter_question(question: str, candidates: list[CandidateContext]):
    if not candidates:
        return {
            "answer": "No candidate context is available yet. Upload or screen resumes first.",
            "matches": []
        }

    documents = [build_candidate_document(candidate) for candidate in candidates]
    query_embedding = rag_model.encode([question])
    document_embeddings = rag_model.encode(documents)
    similarities = cosine_similarity(query_embedding, document_embeddings)[0]

    ranked = sorted(
        zip(candidates, documents, similarities),
        key=lambda item: item[2],
        reverse=True
    )[:5]

    matches = []
    for candidate, document, similarity in ranked:
        matches.append({
            "candidate_id": candidate.candidate_id,
            "name": candidate.name,
            "role": candidate.role,
            "score": candidate.score,
            "status": candidate.status,
            "skills": candidate.skills,
            "similarity": round(float(similarity) * 100, 2),
            "evidence": document[:700]
        })

    top_names = ", ".join(match["name"] for match in matches[:3])
    answer = (
        f"Best matching candidates: {top_names}. "
        "I ranked them by semantic similarity between your question and their resume/profile context. "
        "Open the matched candidate rows to inspect resume evidence, skill coverage, and screening scores."
    )

    question_lower = question.lower()
    if "docker" in question_lower:
        docker_matches = [
            match for match in matches
            if any(skill.lower() == "docker" for skill in match["skills"])
            or "docker" in match["evidence"].lower()
        ]
        if docker_matches:
            names = ", ".join(match["name"] for match in docker_matches)
            answer = f"Candidates with Docker evidence: {names}. Review the evidence snippets for exact context."
        else:
            answer = "I did not find clear Docker evidence in the available candidate context."

    if "backend" in question_lower:
        backend_matches = [
            match for match in matches
            if any(skill.lower() in ["python", "fastapi", "node.js", "express", "sql", "postgresql", "mongodb"] for skill in match["skills"])
            or any(term in match["evidence"].lower() for term in ["backend", "api", "fastapi", "express", "postgresql"])
        ]
        if backend_matches:
            names = ", ".join(match["name"] for match in backend_matches[:3])
            answer = f"Best suited for a backend role: {names}. They show stronger backend/API/database alignment in the retrieved context."

    return {
        "answer": answer,
        "matches": matches
    }

def post_json(url: str, headers: dict, payload: dict):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **headers
        },
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))

def extract_json_object(text: str):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in LLM response")

    return json.loads(text[start:end + 1])

def call_gemini(prompt: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    data = post_json(url, {}, payload)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return extract_json_object(text)

def call_openai(prompt: str):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    payload = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": "You write concise JSON-only recruiter screening summaries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2
    }

    data = post_json(
        "https://api.openai.com/v1/responses",
        {"Authorization": f"Bearer {api_key}"},
        payload
    )

    text = data.get("output_text")
    if not text:
        text = data["output"][0]["content"][0]["text"]

    return extract_json_object(text)

def first_resume_evidence(resume_text: str, skills: list[str]):
    if not resume_text or not skills:
        return ""

    sentences = [
        sentence.strip()
        for sentence in resume_text.replace("\n", " ").split(".")
        if sentence.strip()
    ]

    for skill in skills:
        skill_lower = skill.lower()
        for sentence in sentences:
            if skill_lower in sentence.lower():
                return sentence[:220]

    return ""

def fallback_candidate_summary(resume_text, score, matched_skills, missing_skills):
    matched = ", ".join(matched_skills[:5]) if matched_skills else "no required skills were confidently matched"
    missing = ", ".join(missing_skills[:5]) if missing_skills else "no required skills are missing from the parsed evidence"
    evidence = first_resume_evidence(resume_text, matched_skills)
    recommendation = (
        "Proceed to technical interview"
        if score >= 80
        else "Keep as backup and request more evidence"
        if score >= 60
        else "Reject or reconsider for a different role"
    )

    return {
        "strengths": f"Matched required skills: {matched}." + (f" Evidence: {evidence}." if evidence else ""),
        "weaknesses": f"Unmatched requirements from the job description: {missing}.",
        "recommended_role": "Closest matching role from the job description",
        "interview_recommendation": recommendation
    }

def generate_candidate_summary(resume_text, job_description, score, matched_skills, missing_skills):
    prompt = f"""
Return only valid JSON with these keys:
strengths, weaknesses, recommended_role, interview_recommendation.

Resume:
{resume_text[:5000]}

Job Description:
{job_description[:3000]}

Score: {score}
Matched Skills: {matched_skills}
Missing Skills: {missing_skills}

Write like a recruiter. Be specific, concise, and honest.
"""

    try:
        summary = call_gemini(prompt) or call_openai(prompt)
        if summary:
            return {
                "strengths": summary.get("strengths", ""),
                "weaknesses": summary.get("weaknesses", ""),
                "recommended_role": summary.get("recommended_role", ""),
                "interview_recommendation": summary.get("interview_recommendation", "")
            }
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"LLM summary fallback used: {error}")

    return fallback_candidate_summary(resume_text, score, matched_skills, missing_skills)

@app.post("/match")
def match_resume(data: MatchRequest):
    try:
        sections = parse_sections(data.resume_text)
        exp_years = extract_experience_years(sections["experience"], data.resume_text)
        detail = calculate_detailed_scores(data.resume_text, data.job_description, exp_years)
        summary = generate_candidate_summary(
            data.resume_text,
            data.job_description,
            detail["score"],
            detail["matched_skills"],
            detail["missing_skills"]
        )
        if isinstance(summary, dict):
            summary["experience_years"] = exp_years
            summary["score_breakdown"] = detail["score_breakdown"]
        return {
            "score": detail["score"],
            "matched_skills": detail["matched_skills"],
            "missing_skills": detail["missing_skills"],
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/screen-pdf")
def screen_pdf(data: PDFRequest):
    try:
        resume_text = extract_text(data.pdf_path)
        sections = parse_sections(resume_text)
        exp_years = extract_experience_years(sections["experience"], resume_text)
        detail = calculate_detailed_scores(resume_text, data.job_description, exp_years)
        summary = generate_candidate_summary(
            resume_text,
            data.job_description,
            detail["score"],
            detail["matched_skills"],
            detail["missing_skills"]
        )
        if isinstance(summary, dict):
            summary["experience_years"] = exp_years
            summary["score_breakdown"] = detail["score_breakdown"]
        return {
            "score": detail["score"],
            "matched_skills": detail["matched_skills"],
            "missing_skills": detail["missing_skills"],
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-interview")
def analyze_interview(data: InterviewTranscriptRequest):
    try:
        if not data.transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript is required.")

        return score_interview_transcript(data.transcript, data.job_description)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-interview-video")
def analyze_interview_video(data: InterviewVideoRequest):
    try:
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="Video transcription requires faster-whisper. Install it and ffmpeg, or send a transcript to /analyze-interview."
            )

        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(data.video_path)
        transcript = " ".join(segment.text.strip() for segment in segments)

        return score_interview_transcript(transcript, data.job_description)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recruiter-assistant")
def recruiter_assistant(data: RecruiterAssistantRequest):
    try:
        if not data.question.strip():
            raise HTTPException(status_code=400, detail="Question is required.")

        return answer_recruiter_question(data.question, data.candidates)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/candidate-summary")
def candidate_summary(data: CandidateSummaryRequest):
    try:
        return generate_candidate_summary(
            data.resume_text,
            data.job_description,
            data.score,
            data.matched_skills,
            data.missing_skills
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = extract_text(temp_file_path)
        skills = extract_skills(text)
        
        return {
            "text": text,
            "skills": skills
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

class ExplainScoreRequest(BaseModel):
    resume_text: str
    job_description: str
    score: float
    matched_skills: list[str] = []
    missing_skills: list[str] = []

class CandidateCompareContext(BaseModel):
    name: str
    score: float
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    resume_text: str

class CompareCandidatesRequest(BaseModel):
    candidate_a: CandidateCompareContext
    candidate_b: CandidateCompareContext
    job_description: str

@app.post("/explain-score")
def explain_score(data: ExplainScoreRequest):
    prompt = f"""
Return only valid JSON with these keys:
reasoning, recommendations.

Job Description:
{data.job_description[:3000]}

Candidate Details:
- Match Score: {data.score}/100
- Matched Skills: {data.matched_skills}
- Missing Skills: {data.missing_skills}
- Resume Content: {data.resume_text[:4000]}

Generate:
1. reasoning: A detailed explanation of why the candidate got this score. Explain the depth of their experience with the matched skills vs the relevance of the missing skills. Explain why they scored what they did and how they compare to the standard JD.
2. recommendations: A list of 3-4 specific and actionable recommendations for how this candidate could improve their score (e.g., certifications, projects, or resume details to add).
"""
    try:
        explanation = call_gemini(prompt) or call_openai(prompt)
        if explanation:
            return {
                "reasoning": explanation.get("reasoning", ""),
                "recommendations": explanation.get("recommendations", [])
            }
    except Exception as error:
        print(f"LLM score explanation failed: {error}")

    # Fallback explanation
    reasoning = f"The candidate received a score of {data.score}/100. They matched {len(data.matched_skills)} skills ({', '.join(data.matched_skills[:4])}) but lacked {len(data.missing_skills)} key skills required by the job."
    recommendations = [f"Develop competency or detail projects involving {skill}." for skill in data.missing_skills[:3]]
    if not recommendations:
        recommendations = ["Highlight specific quantitative achievements (e.g. 'boosted performance by 20%') in your resume.", "Ensure your resume layout highlights core architectural design patterns."]
    return {
        "reasoning": reasoning,
        "recommendations": recommendations
    }

@app.post("/compare-candidates")
def compare_candidates(data: CompareCandidatesRequest):
    prompt = f"""
Return only valid JSON with these keys:
comparison_summary, key_differences, verdict.

Job Description:
{data.job_description[:3000]}

Candidate A: {data.candidate_a.name}
- Score: {data.candidate_a.score}/100
- Matched Skills: {data.candidate_a.matched_skills}
- Missing Skills: {data.candidate_a.missing_skills}
- Resume excerpt: {data.candidate_a.resume_text[:2000]}

Candidate B: {data.candidate_b.name}
- Score: {data.candidate_b.score}/100
- Matched Skills: {data.candidate_b.matched_skills}
- Missing Skills: {data.candidate_b.missing_skills}
- Resume excerpt: {data.candidate_b.resume_text[:2000]}

Generate a professional comparison explaining:
1. comparison_summary: A 2-3 sentence overview of how they compare.
2. key_differences: A list of 3 key differences in their experience, skills, or resume depth that explains why one scored higher or why they are positioned differently.
3. verdict: A final recommendation on which candidate is a stronger fit for this specific job and why.
"""
    try:
        comparison = call_gemini(prompt) or call_openai(prompt)
        if comparison:
            return {
                "comparison_summary": comparison.get("comparison_summary", ""),
                "key_differences": comparison.get("key_differences", []),
                "verdict": comparison.get("verdict", "")
            }
    except Exception as error:
        print(f"LLM comparison failed: {error}")

    # Fallback comparison
    diff = abs(data.candidate_a.score - data.candidate_b.score)
    better = data.candidate_a.name if data.candidate_a.score >= data.candidate_b.score else data.candidate_b.name
    comparison_summary = f"Comparing {data.candidate_a.name} (Score: {data.candidate_a.score}%) and {data.candidate_b.name} (Score: {data.candidate_b.score}%). {better} shows a higher alignment with the target role."
    key_differences = [
        f"Candidate score difference of {diff}%.",
        f"{data.candidate_a.name} matched: {', '.join(data.candidate_a.matched_skills[:4]) or 'none'}",
        f"{data.candidate_b.name} matched: {', '.join(data.candidate_b.matched_skills[:4]) or 'none'}"
    ]
    verdict = f"Recommend {better} due to stronger alignment with the job description requirements."
    return {
        "comparison_summary": comparison_summary,
        "key_differences": key_differences,
        "verdict": verdict
    }

class TextExtractionRequest(BaseModel):
    pdf_path: str

@app.post("/extract-text-path")
def extract_text_path(data: TextExtractionRequest):
    try:
        text = extract_text(data.pdf_path)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
