const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
  });
} else {
  console.warn("[WARNING] GEMINI_API_KEY environment variable is not set. AI features will fail at runtime.");
  model = {
    generateContent: () => {
      throw new Error("AI Service is not configured (GEMINI_API_KEY environment variable is missing)");
    }
  };
}

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

const analyzeResume = async (resumeText, jobDescription) => {
  const prompt = `
    Analyze the following resume against the job description.
    Provide a JSON response with: score (0-100), matched_skills (array), missing_skills (array), and summary.
    
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Return ONLY valid JSON, no other text.
  `;

  try {
    if (!resumeText || !jobDescription) {
      throw new Error("Resume text and job description are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error analyzing resume:", error.message);
    throw new Error(`Resume analysis failed: ${error.message}`);
  }
};

const analyzePDF = async (pdfPath, jobDescription) => {
  const prompt = `
    Analyze a resume PDF at path: ${pdfPath}
    Against job description: ${jobDescription}
    
    Provide JSON with: score (0-100), matched_skills (array), missing_skills (array), summary
    Return ONLY valid JSON.
  `;

  try {
    if (!pdfPath || !jobDescription) {
      throw new Error("PDF path and job description are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error analyzing PDF:", error.message);
    throw new Error(`PDF analysis failed: ${error.message}`);
  }
};

const analyzeInterviewTranscript = async (transcript, jobDescription) => {
  const prompt = `
    Analyze this interview transcript:
    ${transcript}
    
    For job: ${jobDescription}
    
    Provide JSON with: score (0-100), strengths (array), weaknesses (array), recommendation
    Return ONLY valid JSON.
  `;

  try {
    if (!transcript || !jobDescription) {
      throw new Error("Interview transcript and job description are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error analyzing interview transcript:", error.message);
    throw new Error(`Interview analysis failed: ${error.message}`);
  }
};

const analyzeInterviewVideo = async (videoPath, jobDescription) => {
  const prompt = `
    Analyze interview video at: ${videoPath}
    For job: ${jobDescription}
    
    Provide JSON with: score (0-100), communication_skills (0-100), technical_knowledge (0-100), culture_fit (text)
    Return ONLY valid JSON.
  `;

  try {
    if (!videoPath || !jobDescription) {
      throw new Error("Video path and job description are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error analyzing interview video:", error.message);
    throw new Error(`Video analysis failed: ${error.message}`);
  }
};

const askRecruiterAssistant = async (question, candidates) => {
  const prompt = `
    You are an expert recruiting assistant. Answer this question:
    "${question}"
    
    Based on these candidates:
    ${JSON.stringify(candidates, null, 2)}
    
    Provide actionable insights in JSON format with: answer, recommendations, next_steps
    Return ONLY valid JSON.
  `;

  try {
    if (!question) {
      throw new Error("Question is required");
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("Candidates array is required and must not be empty");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error asking recruiter assistant:", error.message);
    throw new Error(`Recruiter assistant failed: ${error.message}`);
  }
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
    
    Provide JSON with: explanation, key_strengths (array), areas_to_improve (array)
    Return ONLY valid JSON.
  `;

  try {
    if (!resumeText || !jobDescription || score === null || score === undefined) {
      throw new Error("Resume text, job description, and score are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error explaining score:", error.message);
    throw new Error(`Score explanation failed: ${error.message}`);
  }
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
    
    Provide JSON with: winner (A or B), reasoning (text), recommendation (text)
    Return ONLY valid JSON.
  `;

  try {
    if (!candidateA || !candidateB || !jobDescription) {
      throw new Error("Both candidates and job description are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error comparing candidates:", error.message);
    throw new Error(`Candidate comparison failed: ${error.message}`);
  }
};

const generateCandidateSummary = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
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

  try {
    if (!resumeText || !jobDescription || score === null || score === undefined) {
      throw new Error("Resume text, job description, and score are required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error("Error generating candidate summary:", error.message);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
};

const extractPDFText = async (pdfPath) => {
  const prompt = `Extract and return all text content from the PDF file at: ${pdfPath}. Return JSON with: text (the extracted text)`;

  try {
    if (!pdfPath) {
      throw new Error("PDF path is required");
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
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
