import { ArrowRight, BarChart3, FileSearch, Medal, Sparkles } from 'lucide-react'
import FeatureCard from '../components/FeatureCard'
import Logo from '../components/Logo'
import { useState } from 'react'

function LandingPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="public-page">
      <nav className="public-nav">
        <Logo />

        <div className="nav-links-container">
          <span 
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </span>
          <span 
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </span>
          <span 
            className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contact Us
          </span>
        </div>

        <div className="nav-actions">
          <button className="ghost-button" onClick={() => navigate('login')}>
            Login
          </button>
          <button className="primary-button compact" onClick={() => navigate('register')}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} /> AI-Powered Recruitment Platform
          </span>
          <h1>HireIn</h1>
          <p>
            Screen resumes, rank candidates, and accelerate hiring with a polished AI workflow
            recruiters and candidates can actually see.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('register')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="secondary-button" onClick={() => navigate('login', 'HR')}>
              HR Login
            </button>
          </div>
        </div>

        <div className="blob-container" aria-label="Visual AI Engine Representation">
          <div className="blob-backdrop"></div>
          <div className="blob"></div>
          
          <div className="glass-overlay-card c1">
            <strong>98.4% Accuracy</strong>
            <span>AI Skill Extraction</span>
          </div>
          
          <div className="glass-overlay-card c2">
            <strong>3.2x Faster</strong>
            <span>Candidate Screening</span>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <FeatureCard
          icon={FileSearch}
          title="Resume Screening"
          text="Extract skills and compare resumes against job requirements."
        />
        <FeatureCard
          icon={Medal}
          title="Candidate Ranking"
          text="Turn raw applications into clear recruiter-ready leaderboards."
        />
        <FeatureCard
          icon={Sparkles}
          title="AI Insights"
          text="Show strengths, gaps, and interview recommendations instantly."
        />
        <FeatureCard
          icon={BarChart3}
          title="Hiring Analytics"
          text="Track funnel movement, score trends, and applications per job."
        />
      </section>
    </div>
  )
}

export default LandingPage
