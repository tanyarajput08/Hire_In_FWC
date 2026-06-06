export function skillsAreEquivalent(skillA = '', skillB = '') {
  const normA = skillA.trim().toLowerCase()
  const normB = skillB.trim().toLowerCase()
  if (!normA || !normB) return false
  return normA === normB || normA.includes(normB) || normB.includes(normA)
}

export function isSkillMatched(requiredSkill = '', matchedSkills = [], missingSkills = []) {
  const reqLower = requiredSkill.trim().toLowerCase()
  if (!reqLower) return false

  const isMissing = missingSkills.some(
    (skill) => skillsAreEquivalent(skill, requiredSkill)
  )
  if (isMissing) return false

  return matchedSkills.some(
    (skill) => skillsAreEquivalent(skill, requiredSkill)
  )
}
