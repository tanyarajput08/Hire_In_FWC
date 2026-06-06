import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Logo from '../components/Logo'
import TextField from '../components/TextField'

function AuthPage({ mode, role, setRole, loginAs, navigate }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <div className="auth-page">
      <button className="brand-link" onClick={() => navigate('landing')}>
        <Logo />
      </button>
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault()
          setError('')
          setLoading(true)
          loginAs({
            ...form,
            role,
            mode,
          })
            .catch((apiError) => setError(apiError.message))
            .finally(() => setLoading(false))
        }}
      >
        <span className="eyebrow">
          <ShieldCheck size={16} /> Secure Access
        </span>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p>
          {isRegister
            ? 'Choose your role and start the HireIn flow.'
            : 'Login as HR or Candidate to explore the workspace.'}
        </p>

        {isRegister && (
          <TextField
            label="Name"
            placeholder="Enter your name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        )}
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
        />

        <div className="role-switcher" role="radiogroup" aria-label="Select role">
          {['Candidate', 'HR'].map((option) => (
            <button
              type="button"
              className={role === option ? 'active' : ''}
              key={option}
              onClick={() => setRole(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button wide" type="submit">
          {loading ? 'Working...' : isRegister ? 'Register' : 'Login'} <ArrowRight size={18} />
        </button>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate(isRegister ? 'login' : 'register')}
        >
          {isRegister ? 'Already have an account? Login' : 'New here? Create account'}
        </button>
      </form>
    </div>
  )
}

export default AuthPage
