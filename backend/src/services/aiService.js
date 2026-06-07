const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
});

const analyzeResume = async (resumeText, jobDescription) => {
  const prompt = `
    Analyze the following resume against the job description.
    Provide a JSON response with: score (0-100), matched_skills (array), missing_skills (array), and summary.
    
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const analyzePDF = async (pdfPath, jobDescription) => {
  // For PDF, extract text first then analyze
  const prompt = `
    Analyze the resume PDF at path: ${pdfPath}
    Against job description: ${jobDescription}
    
    Provide JSON with: score, matched_skills, missing_skills, summary
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const analyzeInterviewTranscript = async (transcript, jobDescription) => {
  const prompt = `
    Analyze interview transcript:
    ${transcript}
    
    For job: ${jobDescription}
    
    Provide JSON with: score (0-100), strengths (array), weaknesses (array), recommendation
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const analyzeInterviewVideo = async (videoPath, jobDescription) => {
  const prompt = `
    Analyze interview video at: ${videoPath}
    For job: ${jobDescription}
    
    Provide JSON with: score, communication_skills, technical_knowledge, culture_fit
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const askRecruiterAssistant = async (question, candidates) => {
  const prompt = `
    You are a recruiting assistant. Answer this question:
    ${question}
    
    Based on these candidates:
    ${JSON.stringify(candidates, null, 2)}
    
    Provide actionable insights in JSON format.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const explainScore = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  const prompt = `
    Explain why this resume got a score of ${score}/100 for this job.
    
    Resume: ${resumeText}
    Job: ${jobDescription}
    Matched Skills: ${matchedSkills.join(", ")}
    Missing Skills: ${missingSkills.join(", ")}
    
    Provide JSON with: explanation, key_strengths, areas_to_improve
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const compareCandidates = async ({
  candidateA,
  candidateB,
  jobDescription
}) => {
  const prompt = `
    Compare these two candidates for the job:
    
    Candidate A: ${JSON.stringify(candidateA)}
    Candidate B: ${JSON.stringify(candidateB)}
    Job: ${jobDescription}
    
    Provide JSON with: winner, reasoning, recommendation
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const generateCandidateSummary = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  const prompt = `
    Generate a professional summary for this candidate.
    
    Resume: ${resumeText}
    Job: ${jobDescription}
    Score: ${score}
    
    Provide JSON with: summary, recommendation, next_steps
    Return JSON only.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

const extractPDFText = async (pdfPath) => {
  // This would need a PDF extraction library
  const prompt = `Extract text from PDF at: ${pdfPath}`;
  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
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
