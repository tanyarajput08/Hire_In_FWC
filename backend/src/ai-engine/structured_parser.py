import re
import datetime

def parse_sections(text: str) -> dict:
    """
    Parses raw resume text into logical sections based on header keywords.
    """
    sections = {
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "other": ""
    }
    
    lines = text.split("\n")
    current_section = "other"
    
    # Regexes for section headers
    exp_pat = re.compile(r"^\s*(?:\d+[\.\-]?|•|\*|-)?\s*(?:work\s+)?experience(?:s)?\s*$|^\s*(?:\d+[\.\-]?|•|\*|-)?\s*employment\s+history\s*$|^\s*(?:\d+[\.\-]?|•|\*|-)?\s*work\s+history\s*$", re.IGNORECASE)
    edu_pat = re.compile(r"^\s*(?:\d+[\.\-]?|•|\*|-)?\s*education\s*$|^\s*(?:\d+[\.\-]?|•|\*|-)?\s*academic\s+(?:background|history|credentials)\s*$", re.IGNORECASE)
    skills_pat = re.compile(r"^\s*(?:\d+[\.\-]?|•|\*|-)?\s*(?:technical\s+)?skills\s*(?:&\s*technologies)?\s*$|^\s*(?:\d+[\.\-]?|•|\*|-)?\s*skills\s+and\s+technologies\s*$|^\s*(?:\d+[\.\-]?|•|\*|-)?\s*core\s+competencies\s*$", re.IGNORECASE)
    proj_pat = re.compile(r"^\s*(?:\d+[\.\-]?|•|\*|-)?\s*(?:key\s+|personal\s+|academic\s+)?projects\s*$", re.IGNORECASE)
    
    section_buffer = []
    
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
            
        # Detect headers
        if exp_pat.match(cleaned):
            sections[current_section] += "\n".join(section_buffer)
            section_buffer = []
            current_section = "experience"
        elif edu_pat.match(cleaned):
            sections[current_section] += "\n".join(section_buffer)
            section_buffer = []
            current_section = "education"
        elif skills_pat.match(cleaned):
            sections[current_section] += "\n".join(section_buffer)
            section_buffer = []
            current_section = "skills"
        elif proj_pat.match(cleaned):
            sections[current_section] += "\n".join(section_buffer)
            section_buffer = []
            current_section = "projects"
        else:
            section_buffer.append(line)
            
    sections[current_section] += "\n".join(section_buffer)
    return sections

def parse_date(date_str: str):
    """
    Parses year and month from a date string. Returns (year, month).
    """
    date_str = date_str.strip().lower()
    if date_str in ["present", "current", "active", "now"]:
        now = datetime.datetime.now()
        return now.year, now.month
        
    # Match MM/YYYY
    m = re.match(r"^(\d{1,2})/(\d{4})$", date_str)
    if m:
        return int(m.group(2)), int(m.group(1))
        
    # Match Year only
    year_match = re.search(r"(\d{4})", date_str)
    if not year_match:
        return None
    year = int(year_match.group(1))
    
    # Detect month
    months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    month = 1
    for i, m_name in enumerate(months):
        if m_name in date_str:
            month = i + 1
            break
            
    return year, month

def extract_experience_years(text: str, full_resume_text: str = "") -> float:
    """
    Extracts total years of experience from date ranges in the experience text.
    Falls back to parsing explicit mentions in full resume text if no ranges found.
    """
    if not text.strip():
        text = full_resume_text
        
    pattern = re.compile(
        r"\b((?:[0-9]{1,2}/)?[0-9]{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*[0-9]{4})\s*(?:-|–|—|to)\s*((?:[0-9]{1,2}/)?[0-9]{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*[0-9]{4}|present|current|active|now)\b",
        re.IGNORECASE
    )
    
    matches = pattern.findall(text)
    total_months = 0
    
    for start_str, end_str in matches:
        start = parse_date(start_str)
        end = parse_date(end_str)
        
        if start and end:
            s_year, s_month = start
            e_year, e_month = end
            months = (e_year - s_year) * 12 + (e_month - s_month)
            if months > 0:
                total_months += months
                
    if total_months > 0:
        years = round(total_months / 12.0, 1)
        # Cap at 40 years to prevent unrealistic numbers from bad parses
        return min(40.0, years)
        
    # Fallback to explicit mentions (e.g., "5+ years of experience")
    fallback_pat = re.compile(r"(\d+)(?:\+|-)?\s*years?\s+(?:of\s+)?experience", re.IGNORECASE)
    fallback_match = fallback_pat.search(text)
    if fallback_match:
        return float(fallback_match.group(1))
        
    return 0.0
