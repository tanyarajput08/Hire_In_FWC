const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

// Helper to dynamically obtain Gemini model
const getGeminiModel = () => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      return genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash"
      });
    } catch (e) {
      console.error("Failed to initialize Gemini model:", e);
    }
  }
  return null;
};

// Helper function to extract JSON from response
const extractJSON = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
};

// OpenAI Direct Fetch Fallback Helper
const callOpenAI = async (prompt, systemPrompt = "You write concise JSON-only recruiter screening summaries.") => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing");
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  const data = await response.json();
  const text = data.choices[0].message.content;
  return extractJSON(text);
};

// Local Rules-based Fallback Parser Definitions
const SKILL_ALIASES = {
  "Python": ["python", "py"],
  "SQL": ["sql", "mysql", "sqlite", "ms sql", "mssql", "sql server", "postgresql", "postgres"],
  "React": ["react", "react.js", "reactjs", "react js"],
  "Node.js": ["node.js", "nodejs", "node js", "node", "express", "express.js"],
  "JavaScript": ["javascript", "java script", "js", "ecmascript"],
  "TypeScript": ["typescript", "type script", "ts"],
  "MongoDB": ["mongodb", "mongo db", "mongoose"],
  "PostgreSQL": ["postgresql", "postgres", "pg"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
  "Docker": ["docker", "containerization", "containers"],
  "FastAPI": ["fastapi", "fast api"],
  "Machine Learning": ["machine learning", "machine-learning", "ml", "scikit-learn", "sklearn"],
  "Deep Learning": ["deep learning", "deep-learning", "dl"],
  "PyTorch": ["pytorch", "torch"],
  "TensorFlow": ["tensorflow", "tf", "keras"],
  "LLM": ["llm", "llms", "large language model", "large language models"],
  "NLP": ["nlp", "natural language processing"],
  "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
  "LangChain": ["langchain", "lang chain"],
  "OpenAI": ["openai", "gpt", "chatgpt"],
  "Gemini": ["gemini", "google gemini"],
  "Hugging Face": ["hugging face", "huggingface", "transformers"],
  "Pandas": ["pandas"],
  "NumPy": ["numpy", "num py"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  "Java": ["java"],
  "C++": ["c++", "cpp"],
  "C": [" c ", " c\n", " c,"],
  "HTML": ["html", "html5", "html/css"],
  "CSS": ["css", "css3", "tailwind", "html/css"],
  "Git": ["git", "github", "gitlab"],
  "REST API": [
    "rest api",
    "rest apis",
    "restful api",
    "restful apis",
    "rest api development",
    "restful",
    "api development",
    "rest"
  ],
  "GraphQL": ["graphql", "graph ql"],
  "Flask": ["flask"],
  "Django": ["django"],
  "Linux": ["linux", "ubuntu"],
  "Kubernetes": ["kubernetes", "k8s", "kubernates"],
  "Azure": ["azure", "microsoft azure"],
  "GCP": ["gcp", "google cloud"],
  "Power BI": ["power bi", "powerbi", "power-bi"],
  "Tableau": ["tableau"],
  "Spring Boot": ["spring boot", "springboot"],
  "Algorithms": ["algorithms", "algoritms", "data structures and algorithms"],
  "Data Structures": ["data structure", "data structures", "data-structure"],
  "Competitive Programming": ["competitive programming"],
  "Data Visualization": ["data visualization", "data-viz", "matplotlib", "seaborn"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  "Vue": ["vue", "vue.js", "vuejs"],
  "UI/UX": ["ui/ux", "ui ux", "user experience", "user interface"]
};

const normalizeText = (text) => {
  return (text || "").toLowerCase().replace(/[^a-z0-9+#./\s-]/g, " ");
};

const expandAliasVariants = (alias) => {
  const variants = new Set([alias.toLowerCase()]);
  const trimmed = alias.toLowerCase().trim();
  if (trimmed.endsWith("s") && trimmed.length > 3) {
    variants.add(trimmed.slice(0, -1));
  } else {
    variants.add(trimmed + "s");
  }
  return Array.from(variants);
};

const hasSkill = (text, aliases) => {
  const normalized = ` ${normalizeText(text)} `;
  for (const alias of aliases) {
    for (const variant of expandAliasVariants(alias)) {
      const escaped = variant.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?<![a-z0-9+#./-])${escaped}(?![a-z0-9+#./-])`, 'g');
      if (regex.test(normalized)) {
        return true;
      }
    }
  }
  return false;
};

const extractSkills = (text) => {
  const found = [];
  for (const [skill, aliases] of Object.entries(SKILL_ALIASES)) {
    if (hasSkill(text, aliases)) {
      found.push(skill);
    }
  }
  return found;
};

const compareSkills = (resumeText, jobDescription) => {
  const resumeSet = new Set(extractSkills(resumeText));
  const jdSkills = extractSkills(jobDescription);
  const matched = jdSkills.filter(skill => resumeSet.has(skill));
  const missing = jdSkills.filter(skill => !resumeSet.has(skill));
  return { matched, missing };
};

const calculateLocalScore = (resumeText, jobDescription) => {
  const { matched, missing } = compareSkills(resumeText, jobDescription);
  const total = matched.length + missing.length;
  const score = total > 0 ? (matched.length / total) * 100 : 50;
  return {
    score: Math.round(score * 100) / 100,
    matched_skills: matched,
    missing_skills: missing
  };
};

const localFallbackSummary = (resumeText, score, matchedSkills, missingSkills) => {
  const matched = matchedSkills.length > 0 ? matchedSkills.slice(0, 5).join(", ") : "no required skills were confidently matched";
  const missing = missingSkills.length > 0 ? missingSkills.slice(0, 5).join(", ") : "no required skills are missing from the parsed evidence";
  
  let evidence = "";
  const sentences = (resumeText || "").replace(/\n/g, " ").split(/[.!?]/);
  for (const skill of matchedSkills) {
    const sLower = skill.toLowerCase();
    const match = sentences.find(s => s.toLowerCase().includes(sLower));
    if (match) {
      evidence = match.trim().slice(0, 220);
      break;
    }
  }

  const recommendation = score >= 80 ? "Proceed to technical interview" 
                       : score >= 60 ? "Keep as backup and request more evidence"
                       : "Reject or reconsider for a different role";

  return {
    strengths: `Matched required skills: ${matched}.${evidence ? " Evidence: " + evidence + "." : ""}`,
    weaknesses: `Unmatched requirements from the job description: ${missing}.`,
    recommended_role: "Closest matching role from the job description",
    interview_recommendation: recommendation
  };
};

const analyzeResume = async (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) {
    throw new Error("Resume text and job description are required");
  }

  // 1. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        Analyze the following resume against the job description.
        Provide a JSON response with the following keys:
        - score: a number from 0 to 100
        - matched_skills: an array of strings representing skills from the JD found in the resume
        - missing_skills: an array of strings representing skills from the JD NOT found in the resume
        - summary: a nested JSON object with keys:
          - strengths: a string detailing the candidate's top strengths
          - weaknesses: a string detailing their weaknesses or gaps
          - recommended_role: a string indicating the closest matching role
          - interview_recommendation: a string advising whether to proceed, keep as backup, or reject
          - experience_years: a number representing their estimated years of relevant experience
          - score_breakdown: a nested object with keys: "skills" (number 0-100), "experience" (number 0-100), "education" (number 0-100)
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}
        
        Return ONLY valid JSON, no other text.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini analyzeResume failed, trying OpenAI fallback:", error.message);
    }
  }

  // 2. Try OpenAI Fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Analyze the following resume against the job description.
        Provide a JSON response with the following keys:
        - score: a number from 0 to 100
        - matched_skills: an array of strings
        - missing_skills: an array of strings
        - summary: a nested JSON object with keys:
          - strengths: a string detailing the candidate's top strengths
          - weaknesses: a string detailing their weaknesses or gaps
          - recommended_role: a string indicating the closest matching role
          - interview_recommendation: a string advising whether to proceed, keep as backup, or reject
          - experience_years: a number
          - score_breakdown: a nested object with keys: "skills" (number 0-100), "experience" (number 0-100), "education" (number 0-100)
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}
        
        Return ONLY valid JSON, no other text.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI analyzeResume failed, trying rules-based fallback:", error.message);
    }
  }

  // 3. Rules-based Fallback
  console.info("[AI Service] Using local rules-based fallback for resume analysis");
  const localResult = calculateLocalScore(resumeText, jobDescription);
  const summaryObj = localFallbackSummary(resumeText, localResult.score, localResult.matched_skills, localResult.missing_skills);
  summaryObj.experience_years = 1;
  summaryObj.score_breakdown = {
    skills: localResult.score,
    experience: 50,
    education: 70
  };
  return {
    score: localResult.score,
    matched_skills: localResult.matched_skills,
    missing_skills: localResult.missing_skills,
    summary: summaryObj
  };
};

const analyzePDF = async (pdfPath, jobDescription) => {
  try {
    if (!pdfPath || !jobDescription) {
      throw new Error("PDF path and job description are required");
    }

    const parsed = await extractPDFText(pdfPath);
    const resumeText = parsed.text;

    return await analyzeResume(resumeText, jobDescription);
  } catch (error) {
    console.error("Error analyzing PDF:", error.message);
    throw new Error(`PDF analysis failed: ${error.message}`);
  }
};

const analyzeInterviewTranscript = async (transcript, jobDescription) => {
  if (!transcript || !jobDescription) {
    throw new Error("Interview transcript and job description are required");
  }

  // 1. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        Analyze this interview transcript:
        ${transcript}
        
        For job: ${jobDescription}
        
        Provide JSON with: overall_score (0-100), communication_score (0-100), technical_relevance_score (0-100), confidence_score (0-100), feedback (text summary and recommendations)
        Return ONLY valid JSON.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini analyzeInterviewTranscript failed, trying OpenAI:", error.message);
    }
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Analyze this interview transcript:
        ${transcript}
        
        For job: ${jobDescription}
        
        Provide JSON with: overall_score (0-100), communication_score (0-100), technical_relevance_score (0-100), confidence_score (0-100), feedback (text summary and recommendations)
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI analyzeInterviewTranscript failed, trying rules-based fallback:", error.message);
    }
  }

  // 3. Fallback
  const localResult = calculateLocalScore(transcript, jobDescription);
  const summaryObj = localFallbackSummary(transcript, localResult.score, localResult.matched_skills, localResult.missing_skills);
  return {
    overall_score: localResult.score,
    communication_score: 75,
    technical_relevance_score: localResult.score,
    confidence_score: 80,
    feedback: summaryObj.strengths + " " + summaryObj.weaknesses
  };
};

const analyzeInterviewVideo = async (videoPath, jobDescription) => {
  if (!videoPath || !jobDescription) {
    throw new Error("Video path and job description are required");
  }

  // 1. Try Python AI Engine first (for faster-whisper transcription and analysis)
  try {
    const path = require("path");
    const fileBuffer = fs.readFileSync(videoPath);
    const fileBlob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append("file", fileBlob, path.basename(videoPath));
    formData.append("job_description", jobDescription);

    const response = await fetch(`${AI_ENGINE_URL}/analyze-interview-video`, {
      method: "POST",
      body: formData
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.overall_score !== undefined) {
        return {
          overall_score: data.overall_score,
          communication_score: data.communication_score,
          technical_relevance_score: data.technical_relevance_score,
          confidence_score: data.confidence_score,
          feedback: data.feedback,
          transcript: data.transcript
        };
      }
    }
  } catch (error) {
    console.warn("[AI Service] Python AI engine check failed, proceeding to Gemini/OpenAI:", error.message);
  }

  // 2. Try Gemini with native video multimodal input
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file does not exist at: ${videoPath}`);
      }
      const fileBuffer = fs.readFileSync(videoPath);
      
      const prompt = `
        You are an expert technical interviewer. Analyze the attached video/audio interview file.
        Compare the candidate's answers and technical depth against this Job Description:
        "${jobDescription}"
        
        Tasks:
        1. Transcribe the spoken words in the video as accurately as possible.
        2. Analyze the candidate's communication skills, confidence, and technical relevance to the job.
        3. Score each area (overall_score, communication_score, technical_relevance_score, confidence_score) on a scale of 0-100.
        4. Provide detailed constructive feedback.
        
        Provide your response in JSON format with the following keys:
        - overall_score (number)
        - communication_score (number)
        - technical_relevance_score (number)
        - confidence_score (number)
        - feedback (string containing summary, key tech mentioned, and improvement advice)
        - transcript (string containing the full transcription of the video)
        
        Return ONLY valid JSON.
      `;

      let contents = [];
      if (fileBuffer.length <= 25 * 1024 * 1024) {
        contents.push({
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: "video/mp4"
          }
        });
      }
      contents.push({ text: prompt });

      const result = await modelInstance.generateContent(contents);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini analyzeInterviewVideo failed, trying OpenAI:", error.message);
    }
  }

  // 3. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Analyze interview video details. Video path: ${videoPath}.
        For job: ${jobDescription}
        
        Provide JSON with: overall_score (0-100), communication_score (0-100), technical_relevance_score (0-100), confidence_score (0-100), feedback (text summary and recommendations), transcript (text summary)
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI analyzeInterviewVideo failed, trying rules-based fallback:", error.message);
    }
  }

  // 4. Fallback
  return {
    overall_score: 65,
    communication_score: 70,
    technical_relevance_score: 60,
    confidence_score: 65,
    feedback: "Video interview uploaded successfully. (Local fallback analysis: manual review recommended)",
    transcript: "Video interview uploaded (Transcription not available on server)."
  };
};

const askRecruiterAssistant = async (question, candidates) => {
  if (!question) {
    throw new Error("Question is required");
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Candidates array is required and must not be empty");
  }

  // 1. Try Python AI Engine first for RAG embedding search
  try {
    const response = await fetch(`${AI_ENGINE_URL}/recruiter-assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        candidates
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.answer !== undefined) {
        return data;
      }
    }
  } catch (error) {
    console.warn("[AI Service] Python recruiter assistant check failed, trying Gemini/OpenAI:", error.message);
  }

  // 2. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        You are an expert recruiting assistant. Answer the following question:
        "${question}"
        
        Based on these candidates' profiles and resumes:
        ${JSON.stringify(candidates, null, 2)}
        
        Analyze the candidates and rank them by relevance to the question.
        Provide a JSON response with the following keys:
        - answer: A concise, professional response answering the question, highlighting the best candidates.
        - matches: An array of candidate objects, sorted by similarity to the question, where each candidate has:
          - candidate_id: The ID of the candidate (from the input candidate_id or id).
          - name: The candidate's name.
          - role: The candidate's role.
          - score: The candidate's screening score (if available).
          - status: The candidate's application status.
          - skills: An array of the candidate's key skills.
          - similarity: A number (0 to 100) representing how well this candidate matches the recruiter's question.
          - evidence: A 1-2 sentence quote or summary from the candidate's resume/profile showing proof of their match.
          
        Return ONLY valid JSON.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini askRecruiterAssistant failed, trying OpenAI:", error.message);
    }
  }

  // 3. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        You are an expert recruiting assistant. Answer the following question:
        "${question}"
        
        Based on these candidates' profiles and resumes:
        ${JSON.stringify(candidates, null, 2)}
        
        Analyze the candidates and rank them by relevance to the question.
        Provide a JSON response with the following keys:
        - answer: A concise, professional response answering the question, highlighting the best candidates.
        - matches: An array of candidate objects, sorted by similarity to the question, where each candidate has:
          - candidate_id: The ID of the candidate.
          - name: The candidate's name.
          - role: The candidate's role.
          - score: The candidate's screening score.
          - status: The candidate's application status.
          - skills: An array of the candidate's key skills.
          - similarity: A number (0 to 100) representing how well this candidate matches the recruiter's question.
          - evidence: A 1-2 sentence quote or summary from the candidate's resume/profile showing proof of their match.
          
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI askRecruiterAssistant failed, trying rules-based fallback:", error.message);
    }
  }

  // 4. Fallback
  const matches = candidates.slice(0, 3).map(c => ({
    candidate_id: c.candidate_id || c.id,
    name: c.name,
    role: c.role || "Applicant",
    score: c.score || 0,
    status: c.status || "APPLIED",
    skills: c.skills || [],
    similarity: 70,
    evidence: "Local search fallback context: Candidate has skills aligning with the query."
  }));
  return {
    answer: `Recruiting assistant fallback. Candidates reviewed: ${candidates.map(c => c.name).join(", ")}. Please configure valid API keys to enable full AI semantic responses.`,
    matches
  };
};

const explainScore = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  if (!resumeText || !jobDescription || score === null || score === undefined) {
    throw new Error("Resume text, job description, and score are required");
  }

  // 1. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        Explain why this resume got a score of ${score}/100 for this job.
        
        Resume: ${resumeText}
        Job: ${jobDescription}
        Matched Skills: ${matchedSkills.join(", ")}
        Missing Skills: ${missingSkills.join(", ")}
        
        Provide JSON with: reasoning (detailed text explanation of why the candidate got this score), recommendations (array of 3-4 specific and actionable recommendations for how this candidate could improve their score)
        Return ONLY valid JSON.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini explainScore failed, trying OpenAI:", error.message);
    }
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Explain why this resume got a score of ${score}/100 for this job.
        
        Resume: ${resumeText}
        Job: ${jobDescription}
        Matched Skills: ${matchedSkills.join(", ")}
        Missing Skills: ${missingSkills.join(", ")}
        
        Provide JSON with: reasoning (detailed text explanation), recommendations (array of strings)
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI explainScore failed, trying rules-based fallback:", error.message);
    }
  }

  // 3. Fallback
  const recs = missingSkills.slice(0, 3).map(skill => `Develop competency or detail projects involving ${skill}.`);
  if (recs.length === 0) {
    recs.push("Highlight specific quantitative achievements in your resume.", "Ensure your resume layout highlights core architectural design patterns.");
  }
  return {
    reasoning: `The candidate received a score of ${score}/100. They matched ${matchedSkills.length} skills (${matchedSkills.slice(0, 4).join(", ")}) but lacked ${missingSkills.length} key skills required by the job.`,
    recommendations: recs
  };
};

const compareCandidates = async ({
  candidateA,
  candidateB,
  jobDescription
}) => {
  if (!candidateA || !candidateB || !jobDescription) {
    throw new Error("Both candidates and job description are required");
  }

  // 1. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        Compare these two candidates for the job:
        
        Candidate A: ${JSON.stringify(candidateA)}
        Candidate B: ${JSON.stringify(candidateB)}
        Job: ${jobDescription}
        
        Provide JSON with: comparison_summary (2-3 sentence overview of how they compare), key_differences (array of 3 key differences), verdict (final recommendation on which candidate is a stronger fit and why)
        Return ONLY valid JSON.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini compareCandidates failed, trying OpenAI:", error.message);
    }
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Compare these two candidates for the job:
        
        Candidate A: ${JSON.stringify(candidateA)}
        Candidate B: ${JSON.stringify(candidateB)}
        Job: ${jobDescription}
        
        Provide JSON with: comparison_summary (2-3 sentence overview), key_differences (array of strings), verdict (text verdict recommendation)
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI compareCandidates failed, trying rules-based fallback:", error.message);
    }
  }

  // 3. Fallback
  const diff = Math.abs(candidateA.score - candidateB.score);
  const better = candidateA.score >= candidateB.score ? candidateA.name : candidateB.name;
  return {
    comparison_summary: `Comparing ${candidateA.name} (Score: ${candidateA.score}%) and ${candidateB.name} (Score: ${candidateB.score}%). ${better} shows a higher alignment with the target role.`,
    key_differences: [
      `Candidate score difference of ${diff}%.`,
      `${candidateA.name} matched: ${candidateA.matched_skills.slice(0, 4).join(", ") || "none"}`,
      `${candidateB.name} matched: ${candidateB.matched_skills.slice(0, 4).join(", ") || "none"}`
    ],
    verdict: `Recommend ${better} due to stronger alignment with the job description requirements.`
  };
};

const generateCandidateSummary = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  if (!resumeText || !jobDescription || score === null || score === undefined) {
    throw new Error("Resume text, job description, and score are required");
  }

  // 1. Try Gemini
  const modelInstance = getGeminiModel();
  if (modelInstance) {
    try {
      const prompt = `
        Generate a professional summary for this candidate:
        
        Resume: ${resumeText}
        Job: ${jobDescription}
        Score: ${score}
        Matched Skills: ${matchedSkills.join(", ")}
        Missing Skills: ${missingSkills.join(", ")}
        
        Provide JSON with: summary (text), recommendation (text), next_steps (array)
        Return ONLY valid JSON.
      `;
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.warn("[AI Service] Gemini generateCandidateSummary failed, trying OpenAI:", error.message);
    }
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
        Generate a professional summary for this candidate:
        
        Resume: ${resumeText}
        Job: ${jobDescription}
        Score: ${score}
        Matched Skills: ${matchedSkills.join(", ")}
        Missing Skills: ${missingSkills.join(", ")}
        
        Provide JSON with: summary (text), recommendation (text), next_steps (array)
        Return ONLY valid JSON.
      `;
      return await callOpenAI(prompt);
    } catch (error) {
      console.warn("[AI Service] OpenAI generateCandidateSummary failed, trying rules-based fallback:", error.message);
    }
  }

  // 3. Fallback
  const summaryObj = localFallbackSummary(resumeText, score, matchedSkills, missingSkills);
  return {
    summary: summaryObj.strengths + " " + summaryObj.weaknesses,
    recommendation: summaryObj.interview_recommendation,
    next_steps: ["Conduct technical interview", "Validate matched skills"]
  };
};

const extractPDFText = async (pdfPath) => {
  try {
    if (!pdfPath) {
      throw new Error("PDF path is required");
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return { text: data.text || "" };
  } catch (error) {
    console.error("Error extracting PDF text:", error.message);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

module.exports = {
  analyzeResume,
  analyzePDF,
  analyzeInterviewTranscript,
  analyzeInterviewVideo,
  askRecruiterAssistant,
  generateCandidateSummary,
  explainScore,
  compareCandidates,
  extractPDFText
};
