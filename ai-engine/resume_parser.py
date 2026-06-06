
import re
from skills import SKILL_ALIASES, CANONICAL_SKILL_LOOKUP

def extract_text(pdf_path):
    import fitz
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def normalize_text(text):
    return re.sub(r"[^a-z0-9+#./\s-]", " ", text.lower())

def expand_alias_variants(alias):
    variants = {alias.lower()}
    trimmed = alias.lower().strip()

    if trimmed.endswith("s") and len(trimmed) > 3:
        variants.add(trimmed[:-1])
    else:
        variants.add(f"{trimmed}s")

    return variants

def has_skill(text, aliases):
    normalized = f" {normalize_text(text)} "
    for alias in aliases:
        for variant in expand_alias_variants(alias):
            if re.search(
                rf"(?<![a-z0-9+#./-]){re.escape(variant)}(?![a-z0-9+#./-])",
                normalized
            ):
                return True
    return False

def resolve_canonical_skill(skill_name):
    cleaned = skill_name.strip().lower()
    if not cleaned:
        return None

    if cleaned in CANONICAL_SKILL_LOOKUP:
        return CANONICAL_SKILL_LOOKUP[cleaned]

    for canonical, aliases in SKILL_ALIASES.items():
        if has_skill(skill_name, [canonical, *aliases]):
            return canonical

    return None

def extract_skills(text):
    found = []
    for skill, aliases in SKILL_ALIASES.items():
        if has_skill(text, aliases):
            found.append(skill)
    return found

def extract_explicit_skills(skill_list):
    resolved = []
    for raw_skill in skill_list:
        canonical = resolve_canonical_skill(raw_skill)
        if canonical and canonical not in resolved:
            resolved.append(canonical)
    return resolved
