const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('talentiq_token')
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export const api = {
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getJobs: () => request('/jobs'),
  createJob: (payload) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  applyToJob: (payload) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyApplications: () => request('/applications/me'),
  getJobApplications: (jobId) => request(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, status) =>
    request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getResumePreviewUrl: async (applicationId) => {
    const token = localStorage.getItem('talentiq_token')
    const response = await fetch(`${API_BASE}/applications/${applicationId}/resume-preview`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch resume preview')
    }
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },
  deleteResume: (applicationId) =>
    request(`/applications/${applicationId}/resume`, {
      method: 'DELETE',
    }),
  getRankings: (jobId) => request(`/jobs/${jobId}/rankings`),
  uploadResume: (formData) =>
    request('/upload-resume', {
      method: 'POST',
      body: formData,
    }),
  screenApplication: (applicationId) =>
    request('/screen', {
      method: 'POST',
      body: JSON.stringify({ applicationId }),
    }),
  getScoreJustification: (applicationId) =>
    request(`/applications/${applicationId}/justification`),
  compareCandidates: (applicationId, otherApplicationId) =>
    request(`/applications/${applicationId}/compare/${otherApplicationId}`),
  bulkScreen: (formData) =>
    request('/bulk-screen', {
      method: 'POST',
      body: formData,
    }),
  analyzeInterview: (formData) =>
    request('/interviews/analyze', {
      method: 'POST',
      body: formData,
    }),
  getInterviewResult: (applicationId) =>
    request(`/applications/${applicationId}/interview-result`),
  askRecruiterAssistant: (payload) =>
    request('/assistant/recruiter', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

