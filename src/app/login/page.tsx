'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', top:'5%', left:'15%', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)', bottom:'10%', right:'15%', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, padding:'0 24px', animation:'fadeUp 0.5s ease forwards' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:60, height:60, borderRadius:18,
            background:'linear-gradient(135deg, var(--accent), var(--accent2))',
            marginBottom:16, fontSize:26, fontWeight:800, color:'white',
            boxShadow:'0 8px 32px rgba(108,99,255,0.35)'
          }}>H</div>
          <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)' }}>
            HyCentte
          </h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:6, fontFamily:'var(--font-mono)' }}>
            AI-powered gig intelligence
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:20, padding:32, boxShadow:'0 24px 80px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:24, color:'var(--text)' }}>
            Welcome back
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required autoComplete="email"
                style={{ width:'100%', padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'var(--font-mono)', outline:'none', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>

            <div style={{ marginBottom:28 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                style={{ width:'100%', padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'var(--font-mono)', outline:'none', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16, background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'var(--accent3)', fontSize:13 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width:'100%', padding:'13px',
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), #8b85ff)',
                color:'white', border:'none', borderRadius:10,
                fontSize:15, fontWeight:700, cursor: loading ? 'wait' : 'pointer',
                fontFamily:'var(--font-display)', letterSpacing:'-0.01em',
                transition:'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(108,99,255,0.3)'
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
