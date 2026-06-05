'use client'
import { useState, useRef } from 'react'
import { decryptGigFile, type GigData } from '@/lib/decrypt'

type Platform = 'fiverr' | 'twitter' | 'discord' | 'upwork' | 'linkedin'
type AnalysisTab = 'overview' | 'pricing' | 'descriptionFaq' | 'requirements' | 'gallery'

interface Analysis {
  overview: {
    titleFormula: { pattern: string; examples: string[]; keywords: string[]; tip: string }
    tags: { recommended: string[]; explanation: string }
    competitiveEdge: { gaps: string[]; differentiators: string[]; summary: string }
  }
  pricing: {
    basic: { price: string; label: string; deliverables: string[]; rationale: string }
    standard: { price: string; label: string; deliverables: string[]; rationale: string }
    premium: { price: string; label: string; deliverables: string[]; rationale: string }
    strategy: string
    extras: string[]
  }
  descriptionFaq: {
    hook: string
    structure: { section: string; content: string }[]
    mustInclude: string[]
    wordCount: string
    faqTemplates: { question: string; answer: string }[]
  }
  requirements: {
    essentials: string[]
    optionals: string[]
    tips: string
    template: string
  }
  gallery: {
    imageCount: string
    videoRecommended: boolean
    slides: { slide: number; purpose: string; layout: string; content: string }[]
    colorPalette: string[]
    styleNotes: string
    heroImagePrompt: string
    additionalPrompts: string[]
  }
}

const PLATFORMS: { id: Platform; label: string; emoji: string; color: string; available: boolean }[] = [
  { id: 'fiverr',   label: 'Fiverr',     emoji: '🟢', color: '#1dbf73', available: true },
  { id: 'twitter',  label: 'Twitter / X', emoji: '𝕏',  color: '#ffffff', available: false },
  { id: 'discord',  label: 'Discord',    emoji: '💬', color: '#5865f2', available: false },
  { id: 'upwork',   label: 'Upwork',     emoji: '💼', color: '#6fda44', available: false },
  { id: 'linkedin', label: 'LinkedIn',   emoji: '🔗', color: '#0a66c2', available: false },
]

const TABS: { id: AnalysisTab; label: string; icon: string }[] = [
  { id: 'overview',       label: 'Overview',           icon: '🔍' },
  { id: 'pricing',        label: 'Pricing',            icon: '💰' },
  { id: 'descriptionFaq', label: 'Description & FAQ',  icon: '📝' },
  { id: 'requirements',   label: 'Requirements',       icon: '📋' },
  { id: 'gallery',        label: 'Gallery',            icon: '🎨' },
]

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display:'inline-block', padding:'4px 11px', borderRadius:20,
      background: color ? `${color}18` : 'var(--surface2)',
      border:`1px solid ${color ? `${color}40` : 'var(--border)'}`,
      color: color || 'var(--text2)', fontSize:12, fontFamily:'var(--font-mono)', fontWeight:500
    }}>{children}</span>
  )
}

function Card({ title, icon, children, noPad }: { title?: string; icon?: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding: noPad ? 0 : 24, marginBottom:16, overflow:'hidden' }}>
      {title && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, padding: noPad ? '20px 24px 0' : 0 }}>
          {icon && <span style={{ fontSize:18 }}>{icon}</span>}
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ fontSize:11, color: copied ? 'var(--accent2)' : 'var(--text3)', background:'none', border:'none', cursor:'pointer', flexShrink:0, fontFamily:'var(--font-mono)', padding:'2px 6px' }}
    >{copied ? '✓ Copied' : label}</button>
  )
}

function Skeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {[200,160,180,200].map((w,i) => (
        <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
          <div className="animate-shimmer" style={{ height:20, width:w, borderRadius:6, marginBottom:16 }}/>
          <div className="animate-shimmer" style={{ height:14, width:'90%', borderRadius:4, marginBottom:8 }}/>
          <div className="animate-shimmer" style={{ height:14, width:'75%', borderRadius:4, marginBottom:8 }}/>
          <div className="animate-shimmer" style={{ height:14, width:'60%', borderRadius:4 }}/>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [activePlatform, setActivePlatform] = useState<Platform>('fiverr')
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview')
  const [gigs, setGigs] = useState<GigData[]>([])
  const [niche, setNiche] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'analyze' | 'results'>('upload')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setError('')
    try {
      const text = await file.text()
      const encData = JSON.parse(text)
      const decrypted = await decryptGigFile(encData)
      setGigs(decrypted); setStep('analyze')
    } catch {
      setError('Could not read file. Make sure it\'s a valid .enc.json from the Gig Collector extension.')
    }
  }

  async function handleAnalyze() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gigs, niche }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis); setStep('results'); setActiveTab('overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally { setLoading(false) }
  }

  function reset() {
    setGigs([]); setAnalysis(null); setStep('upload')
    setFileName(''); setNiche(''); setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleLogout() {
    await fetch('/api/auth', { method:'DELETE' })
    window.location.href = '/login'
  }

  const infoRow = (label: string, value: string) => (
    <div style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
      <span style={{ color:'var(--text3)', fontFamily:'var(--font-mono)', minWidth:90 }}>{label}</span>
      <span style={{ color:'var(--text)' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{ width:220, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'20px 0' }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 4px 14px rgba(108,99,255,0.3)' }}>H</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>HyCentte</div>
              <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Intelligence</div>
            </div>
          </div>
        </div>

        <div style={{ padding:'20px 20px 8px' }}>
          <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600 }}>Platforms</span>
        </div>

        <nav style={{ flex:1, padding:'0 10px' }}>
          {PLATFORMS.map(p => (
            <button key={p.id}
              onClick={() => p.available && setActivePlatform(p.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', background: activePlatform===p.id ? `${p.color}12` : 'transparent', cursor: p.available ? 'pointer' : 'not-allowed', marginBottom:2, borderLeft: activePlatform===p.id ? `2px solid ${p.color}` : '2px solid transparent', transition:'all 0.15s', opacity: p.available ? 1 : 0.4 }}
            >
              <span style={{ fontSize:15, width:22, textAlign:'center', flexShrink:0 }}>{p.emoji}</span>
              <div style={{ textAlign:'left', flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color: activePlatform===p.id ? p.color : 'var(--text2)' }}>{p.label}</div>
                {!p.available && <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>Soon</div>}
              </div>
            </button>
          ))}
        </nav>

        <div style={{ padding:'16px 10px 0', borderTop:'1px solid var(--border)' }}>
          <button onClick={handleLogout}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:13, textAlign:'left', transition:'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color='var(--accent3)')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--text3)')}
          >← Sign out</button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, overflow:'auto', padding:32 }}>
        {/* Header */}
        <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1dbf73', boxShadow:'0 0 8px #1dbf73' }}/>
              <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Fiverr Intelligence</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Gig Analyzer</h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>Upload collected gigs → get a blueprint to rank on page 1</p>
          </div>
        </div>

        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div style={{ maxWidth:560, animation:'fadeUp 0.4s ease' }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){const dt=new DataTransfer();dt.items.add(f);if(fileRef.current)fileRef.current.files=dt.files;handleFile({target:fileRef.current} as React.ChangeEvent<HTMLInputElement>);} }}
              style={{ border:'2px dashed var(--border2)', borderRadius:20, padding:48, textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'var(--surface)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.background='rgba(108,99,255,0.04)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border2)';(e.currentTarget as HTMLElement).style.background='var(--surface)'}}
            >
              <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:'var(--text)' }}>Upload Encrypted Gig File</h3>
              <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.6 }}>
                Drop your <code style={{ fontFamily:'var(--font-mono)', color:'var(--accent2)', fontSize:12 }}>.enc.json</code> file here, or click to browse
              </p>
              <p style={{ color:'var(--text3)', fontSize:11, marginTop:10, fontFamily:'var(--font-mono)' }}>Generated by the Fiverr Gig Collector extension</p>
              <input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{ display:'none' }}/>
            </div>
            {error && <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'var(--accent3)', fontSize:13 }}>{error}</div>}
            <div style={{ marginTop:24, padding:20, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16 }}>
              <h4 style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:12 }}>How it works</h4>
              {[['1','Install the Fiverr Gig Collector browser extension','var(--accent)'],['2','Browse Fiverr, enable Collection Mode, click + on gigs','var(--accent2)'],['3','Extension opens each gig, captures deep data, encrypts it','#ff9f43'],['4','Download the .enc.json → upload here → get your blueprint','var(--accent3)']].map(([n,t,c])=>(
                <div key={n} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                  <div style={{ width:22,height:22,borderRadius:'50%',background:`${c}20`,border:`1px solid ${c}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:c,flexShrink:0 }}>{n}</div>
                  <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Configure ──────────────────────────────────────────── */}
        {step === 'analyze' && (
          <div style={{ maxWidth:560, animation:'fadeUp 0.4s ease' }}>
            <div style={{ padding:'16px 20px', borderRadius:12, marginBottom:24, background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20 }}>✅</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--accent2)' }}>{gigs.length} gigs loaded</div>
                <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{fileName}</div>
              </div>
            </div>
            {/* Preview */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Collected Gigs</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:200, overflow:'auto' }}>
                {gigs.slice(0,10).map((g,i)=>(
                  <div key={i} style={{ padding:'9px 13px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'var(--text)', flex:1, marginRight:12 }}>
                      <span style={{ color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:11, marginRight:8 }}>{i+1}.</span>
                      {g.title.slice(0,60)}{g.title.length>60?'…':''}
                    </span>
                    <span style={{ fontSize:11, color:'var(--accent2)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{g.price}</span>
                  </div>
                ))}
                {gigs.length>10 && <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)', padding:8 }}>+{gigs.length-10} more gigs</div>}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Your Niche <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional but recommended)</span>
              </label>
              <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. Kajabi website design, React development…"
                style={{ width:'100%', padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'var(--font-display)', outline:'none', transition:'border-color 0.2s' }}
                onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            {error && <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:16, background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'var(--accent3)', fontSize:13 }}>{error}</div>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleAnalyze} disabled={loading}
                style={{ flex:1, padding:'14px', background: loading?'var(--surface2)':'linear-gradient(135deg, var(--accent), #8b85ff)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading?'wait':'pointer', fontFamily:'var(--font-display)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              >
                {loading ? (
                  <><span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin-slow 0.8s linear infinite' }}/> Analyzing {gigs.length} gigs…</>
                ) : '🧠 Analyze & Generate Blueprint'}
              </button>
              <button onClick={reset} style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text2)', cursor:'pointer', fontSize:13 }}>↩</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Results ────────────────────────────────────────────── */}
        {step === 'results' && (
          <div style={{ maxWidth:780, animation:'fadeUp 0.4s ease' }}>
            {/* Top bar */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ padding:'8px 16px', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:20 }}>
                <span style={{ fontSize:13, color:'var(--accent2)', fontWeight:600 }}>
                  ✨ Blueprint from {gigs.length} gigs{niche && <span style={{ color:'var(--text2)', fontWeight:400 }}> · {niche}</span>}
                </span>
              </div>
              <button onClick={reset} style={{ padding:'8px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text2)', cursor:'pointer', fontSize:13 }}>
                ← New analysis
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:5 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex:1, padding:'9px 6px', borderRadius:10, border:'none', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, fontWeight:600,
                    background: activeTab===tab.id ? 'var(--accent)' : 'transparent',
                    color: activeTab===tab.id ? 'white' : 'var(--text2)',
                    boxShadow: activeTab===tab.id ? '0 2px 12px rgba(108,99,255,0.3)' : 'none'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span style={{ display:'none' }}>{tab.label}</span>
                  <span style={{ fontSize:11 }}>{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {loading ? <Skeleton /> : analysis && (
              <>
                {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    <Card title="Title Formula" icon="✍️">
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Pattern</div>
                        <div style={{ padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--accent)', fontFamily:'var(--font-mono)' }}>
                          {analysis.overview.titleFormula.pattern}
                        </div>
                      </div>
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Ready-to-use examples</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {analysis.overview.titleFormula.examples.map((ex,i)=>(
                            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', background:'var(--bg2)', borderRadius:8, gap:10 }}>
                              <span style={{ fontSize:13, color:'var(--text)' }}>{ex}</span>
                              <CopyBtn text={ex}/>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:8 }}>Top keywords</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {analysis.overview.titleFormula.keywords.map((k,i)=><Tag key={i} color="var(--accent)">{k}</Tag>)}
                        </div>
                      </div>
                      <div style={{ padding:'10px 14px', background:'rgba(108,99,255,0.08)', borderRadius:8, fontSize:13, color:'var(--text2)', borderLeft:'3px solid var(--accent)' }}>
                        💡 {analysis.overview.titleFormula.tip}
                      </div>
                    </Card>

                    <Card title="SEO Tags" icon="🏷️">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:14 }}>
                        {analysis.overview.tags.recommended.map((t,i)=><Tag key={i} color="var(--accent2)">{t}</Tag>)}
                      </div>
                      <CopyBtn text={analysis.overview.tags.recommended.join(', ')} label="Copy all tags"/>
                      <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginTop:12 }}>{analysis.overview.tags.explanation}</p>
                    </Card>

                    <Card title="Competitive Edge" icon="⚡">
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:8 }}>Market Gaps</div>
                        {analysis.overview.competitiveEdge.gaps.map((g,i)=>(
                          <div key={i} style={{ display:'flex', gap:10, marginBottom:7, padding:'8px 12px', background:'rgba(0,229,160,0.06)', border:'1px solid rgba(0,229,160,0.15)', borderRadius:8 }}>
                            <span style={{ color:'var(--accent2)', flexShrink:0 }}>→</span>
                            <p style={{ fontSize:13, color:'var(--text2)' }}>{g}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:8 }}>Differentiators</div>
                        {analysis.overview.competitiveEdge.differentiators.map((d,i)=>(
                          <div key={i} style={{ display:'flex', gap:10, marginBottom:7, padding:'8px 12px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:8 }}>
                            <span style={{ color:'var(--accent)', flexShrink:0 }}>✦</span>
                            <p style={{ fontSize:13, color:'var(--text2)' }}>{d}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding:'14px 16px', background:'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,229,160,0.08))', border:'1px solid var(--border)', borderRadius:10 }}>
                        <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, fontWeight:500 }}>{analysis.overview.competitiveEdge.summary}</p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ── PRICING TAB ─────────────────────────────────────────── */}
                {activeTab === 'pricing' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
                      {([
                        { key:'basic',    tier: analysis.pricing.basic,    accent:'var(--text2)' },
                        { key:'standard', tier: analysis.pricing.standard, accent:'var(--accent)' },
                        { key:'premium',  tier: analysis.pricing.premium,  accent:'var(--accent2)' },
                      ] as const).map(({ key, tier, accent }) => (
                        <div key={key} style={{ background:'var(--surface)', border:`1px solid ${accent}30`, borderRadius:16, padding:20, position:'relative', overflow:'hidden' }}>
                          {key === 'standard' && <div style={{ position:'absolute', top:12, right:12, fontSize:9, fontFamily:'var(--font-mono)', background:'var(--accent)', color:'white', padding:'2px 8px', borderRadius:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Popular</div>}
                          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:6 }}>{key}</div>
                          <div style={{ fontSize:13, fontWeight:700, color: accent, marginBottom:4 }}>{tier.label}</div>
                          <div style={{ fontSize:28, fontWeight:800, color: accent, marginBottom:14, letterSpacing:'-0.03em' }}>{tier.price}</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                            {tier.deliverables.map((d,i)=>(
                              <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                                <span style={{ color: accent, fontSize:11, marginTop:2, flexShrink:0 }}>✓</span>
                                <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.4 }}>{d}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{tier.rationale}</div>
                        </div>
                      ))}
                    </div>
                    <Card title="Strategy" icon="📊">
                      <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>{analysis.pricing.strategy}</p>
                    </Card>
                    {analysis.pricing.extras.length > 0 && (
                      <Card title="Recommended Gig Extras" icon="➕">
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {analysis.pricing.extras.map((e,i)=>(
                            <div key={i} style={{ padding:'10px 14px', background:'var(--bg2)', borderRadius:8, fontSize:13, color:'var(--text2)', display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ color:'var(--accent)', fontSize:16 }}>+</span> {e}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* ── DESCRIPTION & FAQ TAB ───────────────────────────────── */}
                {activeTab === 'descriptionFaq' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    <Card title="Opening Hook" icon="🎯">
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, gap:12 }}>
                        <p style={{ fontSize:15, color:'var(--text)', lineHeight:1.7, fontStyle:'italic' }}>"{analysis.descriptionFaq.hook}"</p>
                        <CopyBtn text={analysis.descriptionFaq.hook}/>
                      </div>
                    </Card>
                    <Card title="Description Structure" icon="🗂️">
                      {analysis.descriptionFaq.structure.map((s,i)=>(
                        <div key={i} style={{ display:'flex', gap:14, marginBottom:14, paddingBottom:14, borderBottom: i<analysis.descriptionFaq.structure.length-1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--accent)', fontWeight:700, flexShrink:0 }}>{i+1}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{s.section}</div>
                            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{s.content}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                        {analysis.descriptionFaq.mustInclude.map((m,i)=><Tag key={i} color="#ff9f43">✓ {m}</Tag>)}
                      </div>
                      <div style={{ marginTop:12, fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                        Recommended length: {analysis.descriptionFaq.wordCount}
                      </div>
                    </Card>
                    <Card title="FAQ Templates" icon="❓">
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {analysis.descriptionFaq.faqTemplates.map((faq,i)=>(
                          <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                            <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Q: {faq.question}</span>
                              <CopyBtn text={`Q: ${faq.question}\nA: ${faq.answer}`}/>
                            </div>
                            <div style={{ padding:'10px 14px', fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>A: {faq.answer}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* ── REQUIREMENTS TAB ────────────────────────────────────── */}
                {activeTab === 'requirements' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                      <Card title="Essential Info to Collect" icon="📌">
                        {analysis.requirements.essentials.map((r,i)=>(
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                            <span style={{ color:'var(--accent2)', flexShrink:0, marginTop:2 }}>✓</span>
                            <span style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{r}</span>
                          </div>
                        ))}
                      </Card>
                      <Card title="Optional but Helpful" icon="💡">
                        {analysis.requirements.optionals.map((r,i)=>(
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                            <span style={{ color:'var(--accent)', flexShrink:0, marginTop:2 }}>○</span>
                            <span style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{r}</span>
                          </div>
                        ))}
                      </Card>
                    </div>
                    <Card title="Pro Tips" icon="🎯">
                      <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{analysis.requirements.tips}</p>
                    </Card>
                    <Card title="Ready-to-Use Requirements Template" icon="📄">
                      <div style={{ position:'relative' }}>
                        <div style={{ padding:'16px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', fontSize:13, color:'var(--text)', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'var(--font-mono)' }}>
                          {analysis.requirements.template}
                        </div>
                        <div style={{ position:'absolute', top:10, right:10 }}>
                          <CopyBtn text={analysis.requirements.template} label="Copy template"/>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ── GALLERY TAB ─────────────────────────────────────────── */}
                {activeTab === 'gallery' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    {/* Style overview */}
                    <Card title="Visual Style Analysis" icon="👁️">
                      <div style={{ display:'flex', gap:16, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
                        <div>
                          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:8 }}>Color Palette</div>
                          <div style={{ display:'flex', gap:8 }}>
                            {analysis.gallery.colorPalette.map((c,i)=>(
                              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                <div style={{ width:36, height:36, borderRadius:10, background:c, border:'2px solid var(--border)' }}/>
                                <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ flex:1, minWidth:200 }}>
                          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:6 }}>Style Notes</div>
                          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{analysis.gallery.styleNotes}</p>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <div style={{ padding:'8px 14px', background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:8, fontSize:12, color:'var(--accent2)' }}>
                          📸 {analysis.gallery.imageCount}
                        </div>
                        {analysis.gallery.videoRecommended && (
                          <div style={{ padding:'8px 14px', background:'rgba(108,99,255,0.08)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:8, fontSize:12, color:'var(--accent)' }}>
                            🎬 Video recommended
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Slide plan */}
                    <Card title="Gallery Slide Plan" icon="🖼️">
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {analysis.gallery.slides.map((sl)=>(
                          <div key={sl.slide} style={{ display:'flex', gap:14, padding:'12px 14px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', alignItems:'flex-start' }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'white', flexShrink:0 }}>{sl.slide}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{sl.purpose}</span>
                                <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{sl.layout}</span>
                              </div>
                              <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{sl.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Hero image prompt */}
                    <Card title="🤖 AI Image Prompt — Hero Thumbnail" icon="">
                      <div style={{ padding:'4px 0 12px' }}>
                        <div style={{ display:'inline-flex', gap:6, alignItems:'center', padding:'4px 12px', background:'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,229,160,0.1))', borderRadius:20, marginBottom:14, border:'1px solid rgba(108,99,255,0.3)' }}>
                          <span style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)', fontWeight:600 }}>Midjourney / DALL-E 3 / Ideogram ready</span>
                        </div>
                        <div style={{ position:'relative' }}>
                          <div style={{ padding:'16px', background:'var(--bg2)', border:'1px solid var(--accent)30', borderRadius:12, fontSize:13, color:'var(--text)', lineHeight:1.8, fontFamily:'var(--font-mono)', whiteSpace:'pre-wrap' }}>
                            {analysis.gallery.heroImagePrompt}
                          </div>
                          <div style={{ position:'absolute', top:10, right:10 }}>
                            <CopyBtn text={analysis.gallery.heroImagePrompt} label="Copy prompt"/>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Additional prompts */}
                    {analysis.gallery.additionalPrompts.map((prompt, i) => (
                      <Card key={i} title={`AI Image Prompt — Slide ${i+2}`} icon="🎨">
                        <div style={{ position:'relative' }}>
                          <div style={{ padding:'16px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, fontSize:13, color:'var(--text2)', lineHeight:1.8, fontFamily:'var(--font-mono)', whiteSpace:'pre-wrap' }}>
                            {prompt}
                          </div>
                          <div style={{ position:'absolute', top:10, right:10 }}>
                            <CopyBtn text={prompt} label="Copy prompt"/>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
