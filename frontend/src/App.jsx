import '@fontsource/inter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams
} from 'react-router-dom'
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  ClipboardCheck,
  FileStack,
  LayoutDashboard,
  Medal,
  Plus,
  Video,
  UserRound,
  Users,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { api } from './services/api'
import { ROUTES } from './routes'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import ApplicationDetail from './pages/candidate/ApplicationDetail'
import ApplicationsPage from './pages/candidate/ApplicationsPage'
import ApplyPage from './pages/candidate/ApplyPage'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import JobsPage from './pages/candidate/JobsPage'
import UpdateResumePage from './pages/candidate/UpdateResumePage'
import ProfilePage from './pages/candidate/ProfilePage'
import AnalyticsPage from './pages/hr/AnalyticsPage'
import ApplicantsPage from './pages/hr/ApplicantsPage'
import BulkScreeningPage from './pages/hr/BulkScreeningPage'
import CandidateDetailPage from './pages/hr/CandidateDetailPage'
import CreateJobPage from './pages/hr/CreateJobPage'
import HrDashboard from './pages/hr/HrDashboard'
import InterviewAnalysisPage from './pages/hr/InterviewAnalysisPage'
import RecruiterAssistantPage from './pages/hr/RecruiterAssistantPage'
import RankingsPage from './pages/hr/RankingsPage'
import './App.css'

const hrSidebarItems = [
  [ROUTES.HR_DASHBOARD, LayoutDashboard, 'Dashboard'],
  [ROUTES.HR_CREATE_JOB, Plus, 'Create Job'],
  [ROUTES.HR_BULK_SCREENING, FileStack, 'Bulk Screen'],
  [ROUTES.HR_APPLICANTS, Users, 'Applicants'],
  [ROUTES.HR_RANKINGS, Medal, 'Rankings'],
  [ROUTES.HR_ASSISTANT, Bot, 'AI Assistant'],
  [ROUTES.HR_INTERVIEWS, Video, 'Interviews'],
  [ROUTES.HR_ANALYTICS, BarChart3, 'Analytics'],
]

const candidateSidebarItems = [
  [ROUTES.CANDIDATE_DASHBOARD, LayoutDashboard, 'Dashboard'],
  [ROUTES.CANDIDATE_JOBS, BriefcaseBusiness, 'Jobs'],
  [ROUTES.CANDIDATE_APPLICATIONS, ClipboardCheck, 'Applications'],
  [ROUTES.CANDIDATE_PROFILE, UserRound, 'Profile'],
]

const screensWithActiveJob = [
  ROUTES.HR_DASHBOARD,
  ROUTES.HR_APPLICANTS,
  ROUTES.HR_RANKINGS
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('talentiq_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  
  const [role, setRole] = useState(() => {
    const storedUser = localStorage.getItem('talentiq_user')
    if (!storedUser) return 'Candidate'
    try {
      const parsedUser = JSON.parse(storedUser)
      return parsedUser.role === 'HR' ? 'HR' : 'Candidate'
    } catch {
      return 'Candidate'
    }
  })
  
  const [activeJobId, setActiveJobId] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [applicants, setApplicants] = useState([])
  const [allApplicants, setAllApplicants] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')
  const [candidateStatus, setCandidateStatus] = useState({})

  const activeJob = jobs.find((job) => job.id === activeJobId) || jobs[0] || null

  const refreshJobs = useCallback(async () => {
    const nextJobs = await api.getJobs()
    setJobs(nextJobs)
    if (nextJobs.length) {
      setActiveJobId((currentJobId) => (
        nextJobs.some((job) => job.id === currentJobId) ? currentJobId : nextJobs[0].id
      ))
    }
    return nextJobs
  }, [])

  const refreshCandidateApplications = useCallback(async () => {
    const rows = await api.getMyApplications()
    setApplications(rows)
    return rows
  }, [])

  const refreshApplicants = useCallback(async (jobId = activeJobId) => {
    if (!jobId) return []
    const rows = await api.getJobApplications(jobId)
    setApplicants(rows)
    setCandidateStatus((current) => ({
      ...current,
      ...Object.fromEntries(rows.map((row) => [row.application_id || row.id, row.status])),
    }))
    return rows
  }, [activeJobId])

  const refreshAllApplicants = useCallback(async (jobRows = []) => {
    if (!jobRows.length) {
      setAllApplicants([])
      return []
    }
    const groupedRows = await Promise.all(
      jobRows.map((job) => api.getJobApplications(job.id).catch(() => []))
    )
    const rows = groupedRows.flat()
    setAllApplicants(rows)
    return rows
  }, [])

  const refreshWorkspaceData = useCallback(async (currentRole = role) => {
    setDataError('')
    setLoadingData(true)
    try {
      const nextJobs = await refreshJobs()
      if (currentRole === 'HR') {
        const targetJobId = nextJobs.some(j => j.id === activeJobId) ? activeJobId : nextJobs[0]?.id
        if (targetJobId) {
          setActiveJobId(targetJobId)
          await refreshApplicants(targetJobId)
        }
        await refreshAllApplicants(nextJobs)
      } else {
        await refreshCandidateApplications()
      }
    } catch (error) {
      setDataError(error.message)
    } finally {
      setLoadingData(false)
    }
  }, [activeJobId, refreshAllApplicants, refreshApplicants, refreshCandidateApplications, refreshJobs, role])

  useEffect(() => {
    if (!user) return
    let ignore = false
    Promise.resolve().then(() => {
      if (!ignore) refreshWorkspaceData(user.role)
    })
    return () => {
      ignore = true
    }
  }, [refreshWorkspaceData, user])

  useEffect(() => {
    if (user && user.role === 'HR' && activeJobId) {
      Promise.resolve().then(() => {
        refreshApplicants(activeJobId)
        refreshAllApplicants(jobs)
      })
    }
  }, [activeJobId, jobs, user, refreshAllApplicants, refreshApplicants])

  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role)
    }
  }, [location.state])

  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchableText = `${job.title} ${job.skills_required || ''}`.toLowerCase()
      const matchesQuery = searchableText.includes(query.toLowerCase())
      const matchesFilter = filter === 'All' || job.mode === filter || job.type === filter
      return matchesQuery && matchesFilter
    })
  }, [filter, jobs, query])

  const appliedJobIds = useMemo(
    () => applications.map((application) => application.job_id).filter(Boolean),
    [applications]
  )

  const handleDeleteResume = async (applicationId) => {
    if (!window.confirm('Delete uploaded resume? Screening results will be cleared for HR as well.')) {
      return
    }
    setDataError('')
    try {
      await api.deleteResume(applicationId)
      await refreshCandidateApplications()
    } catch (error) {
      setDataError(error.message)
    }
  }

  const handleSidebarNavigate = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const loginAs = async ({ name, email, password, role: selectedRole, mode }) => {
    const payloadRole = selectedRole === 'HR' ? 'HR' : 'CANDIDATE'
    if (mode === 'register') {
      await api.register({ name, email, password, role: payloadRole })
    }
    const response = await api.login({ email, password })
    localStorage.setItem('talentiq_token', response.token)
    localStorage.setItem('talentiq_user', JSON.stringify(response.user))
    setUser(response.user)
    setRole(response.user.role === 'HR' ? 'HR' : 'Candidate')
    
    const targetDashboard = response.user.role === 'HR' ? ROUTES.HR_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD
    navigate(targetDashboard)
    await refreshWorkspaceData(response.user.role)
  }

  const handleLogout = () => {
    localStorage.removeItem('talentiq_token')
    localStorage.removeItem('talentiq_user')
    setUser(null)
    setApplications([])
    setApplicants([])
    setAllApplicants([])
    setCandidateStatus({})
    navigate(ROUTES.LANDING)
  }

  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage navigate={navigate} />} />
        <Route
          path={ROUTES.LOGIN}
          element={
            <AuthPage
              mode="login"
              role={role}
              setRole={setRole}
              loginAs={loginAs}
              navigate={navigate}
            />
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <AuthPage
              mode="register"
              role={role}
              setRole={setRole}
              loginAs={loginAs}
              navigate={navigate}
            />
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={role === 'HR' ? hrSidebarItems : candidateSidebarItems}
        screen={location.pathname}
        navigate={handleSidebarNavigate}
        role={role}
        open={sidebarOpen}
      />
      <main className="workspace">
        <Topbar
          role={role}
          user={user}
          onMenu={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          jobs={jobs}
          activeJobId={activeJobId}
          onChangeJob={setActiveJobId}
          showActiveJob={screensWithActiveJob.some(path => location.pathname.startsWith(path))}
        />
        {loadingData && <div className="system-banner">Loading data...</div>}
        {dataError && <div className="system-banner error">{dataError}</div>}
        {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} />}
        
        <Routes>
          {role === 'HR' ? (
            <>
              <Route path={ROUTES.HR_DASHBOARD} element={<HrDashboard navigate={navigate} jobs={visibleJobs} applicants={applicants} />} />
              <Route path={ROUTES.HR_CREATE_JOB} element={<CreateJobPage onCreated={refreshJobs} />} />
              <Route path={ROUTES.HR_BULK_SCREENING} element={<BulkScreeningPage jobs={visibleJobs} />} />
              <Route
                path={ROUTES.HR_APPLICANTS}
                element={
                  <ApplicantsPage
                    candidates={applicants}
                    status={candidateStatus}
                    onOpen={(candidateId) => navigate(`/hr/applicants/${candidateId}`)}
                    onScreen={async (applicationId) => {
                      await api.screenApplication(applicationId)
                      await refreshApplicants()
                    }}
                    onStatusChange={async (applicationId, status) => {
                      await api.updateApplicationStatus(applicationId, status)
                      await refreshApplicants()
                    }}
                  />
                }
              />
              <Route
                path={ROUTES.HR_CANDIDATE_DETAIL}
                element={
                  <ActiveCandidateDetailWrapper
                    applicants={applicants}
                    candidateStatus={candidateStatus}
                    setCandidateStatus={setCandidateStatus}
                    refreshApplicants={refreshApplicants}
                  />
                }
              />
              <Route
                path={ROUTES.HR_RANKINGS}
                element={
                  <RankingsPage
                    candidates={applicants}
                    status={candidateStatus}
                    onOpen={(candidateId) => navigate(`/hr/applicants/${candidateId}`)}
                  />
                }
              />
              <Route path={ROUTES.HR_ASSISTANT} element={<RecruiterAssistantPage candidates={allApplicants} />} />
              <Route path={ROUTES.HR_INTERVIEWS} element={<InterviewAnalysisPage jobs={jobs} applications={allApplicants} />} />
              <Route path={ROUTES.HR_ANALYTICS} element={<AnalyticsPage jobs={jobs} applicants={allApplicants} />} />
              <Route path="*" element={<Navigate to={ROUTES.HR_DASHBOARD} replace />} />
            </>
          ) : (
            <>
              <Route path={ROUTES.CANDIDATE_DASHBOARD} element={<CandidateDashboard navigate={navigate} applications={applications} />} />
              <Route
                path={ROUTES.CANDIDATE_JOBS}
                element={
                  <JobsPage
                    jobs={visibleJobs}
                    appliedJobIds={appliedJobIds}
                    query={query}
                    setQuery={setQuery}
                    filter={filter}
                    setFilter={setFilter}
                    onApply={(jobId) => {
                      setActiveJobId(jobId)
                      navigate(ROUTES.CANDIDATE_APPLY)
                    }}
                  />
                }
              />
              <Route
                path={ROUTES.CANDIDATE_APPLY}
                element={
                  activeJob ? (
                    <ApplyPage
                      job={activeJob}
                      navigate={navigate}
                      onApplied={async () => {
                        await refreshCandidateApplications()
                      }}
                    />
                  ) : <Navigate to={ROUTES.CANDIDATE_DASHBOARD} replace />
                }
              />
              <Route
                path={ROUTES.CANDIDATE_APPLICATIONS}
                element={
                  <ApplicationsPage
                    rows={applications}
                    onOpen={(row) => navigate(`/candidate/applications/${row.id}`)}
                    onDeleteResume={handleDeleteResume}
                  />
                }
              />
              <Route
                path={ROUTES.CANDIDATE_APPLICATION_DETAIL}
                element={
                  <ActiveApplicationDetailWrapper
                    applications={applications}
                    onDeleteResume={handleDeleteResume}
                    refreshCandidateApplications={refreshCandidateApplications}
                    navigate={navigate}
                  />
                }
              />
              <Route path={ROUTES.CANDIDATE_PROFILE} element={<ProfilePage user={user} applications={applications} />} />
              <Route
                path={ROUTES.CANDIDATE_UPDATE_RESUME}
                element={
                  <UpdateResumePage
                    applications={applications}
                    onUpdated={refreshCandidateApplications}
                  />
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.CANDIDATE_DASHBOARD} replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}

function ActiveCandidateDetailWrapper({ applicants, candidateStatus, setCandidateStatus, refreshApplicants }) {
  const { candidateId } = useParams()
  const candidate = applicants.find((c) => String(c.application_id || c.id) === String(candidateId))

  const updateStatus = async (nextStatus) => {
    if (!candidate) return
    const applicationId = candidate.application_id || candidate.id
    await api.updateApplicationStatus(applicationId, nextStatus)
    setCandidateStatus((current) => ({
      ...current,
      [applicationId]: nextStatus,
    }))
    await refreshApplicants()
  }

  return (
    <CandidateDetailPage
      candidate={candidate}
      allCandidates={applicants}
      status={candidate ? candidateStatus[candidate.application_id || candidate.id] || candidate.status : undefined}
      updateStatus={updateStatus}
    />
  )
}

function ActiveApplicationDetailWrapper({ applications, onDeleteResume, refreshCandidateApplications, navigate }) {
  const { applicationId } = useParams()
  const candidate = applications.find((a) => String(a.id) === String(applicationId))

  return (
    <ApplicationDetail
      candidate={candidate}
      onBack={() => navigate(ROUTES.CANDIDATE_APPLICATIONS)}
      onDeleteResume={async (id) => {
        await onDeleteResume(id)
        navigate(ROUTES.CANDIDATE_APPLICATIONS)
      }}
      onResumeUpdated={refreshCandidateApplications}
    />
  )
}

export default App
