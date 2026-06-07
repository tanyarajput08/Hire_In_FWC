import re
from sklearn.metrics.pairwise import cosine_similarity
from models import get_model
from resume_parser import extract_skills, extract_explicit_skills

_jd_cache = {}

def get_jd_embedding(job_description: str):
    if job_description not in _jd_cache:
        _jd_cache[job_description] = get_model().encode([job_description])
    return _jd_cache[job_description]

def parse_required_skills(job_description: str):
    explicit = []
    for match in re.findall(r"required skills:\s*([^\n]+)", job_description, flags=re.IGNORECASE):
        explicit.extend(
            skill.strip()
            for skill in match.split(",")
            if skill.strip()
        )
    return extract_explicit_skills(explicit)

def build_job_skill_set(job_description: str):
    jd_skills = extract_skills(job_description)
    explicit_skills = parse_required_skills(job_description)
    return list(dict.fromkeys([*jd_skills, *explicit_skills]))

def compare_skills(resume_text: str, job_description: str):
    resume_skills = extract_skills(resume_text)
    resume_set = set(resume_skills)
    jd_skills = build_job_skill_set(job_description)
    matched = [skill for skill in jd_skills if skill in resume_set]
    missing = [skill for skill in jd_skills if skill not in resume_set]
    return matched, missing

def calculate_match_score(resume_text: str, job_description: str):
    resume_embedding = get_model().encode([resume_text])
    jd_embedding = get_jd_embedding(job_description)
    semantic_score = float(cosine_similarity(resume_embedding, jd_embedding)[0][0]) * 100
    semantic_score = max(0.0, min(100.0, semantic_score))
    
    matched, missing = compare_skills(resume_text, job_description)
    required_count = len(matched) + len(missing)
    skill_score = (len(matched) / required_count) * 100 if required_count else semantic_score
    
    final_score = (skill_score * 0.65) + (semantic_score * 0.35)
    return round(max(0.0, min(100.0, final_score)), 2)

def calculate_detailed_scores(resume_text: str, job_description: str, experience_years: float = 0.0):
    resume_embedding = get_model().encode([resume_text])
    jd_embedding = get_jd_embedding(job_description)
    
    semantic_score = float(cosine_similarity(resume_embedding, jd_embedding)[0][0]) * 100
    semantic_score = round(max(0.0, min(100.0, semantic_score)), 2)
    
    matched, missing = compare_skills(resume_text, job_description)
    required_count = len(matched) + len(missing)
    skill_score = round((len(matched) / required_count) * 100 if required_count else semantic_score, 2)
    
    experience_fit = round(min(100.0, max(0.0, experience_years * 12.0 + 40.0)), 2)
    
    final_score = (skill_score * 0.55) + (semantic_score * 0.30) + (experience_fit * 0.15)
    final_score = round(max(0.0, min(100.0, final_score)), 2)
    
    return {
        "score": final_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "score_breakdown": {
            "semantic_alignment": semantic_score,
            "skill_coverage": skill_score,
            "experience_fit": experience_fit
        }
    }
