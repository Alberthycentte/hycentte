'use client'
import { useState, useRef, useEffect } from 'react'
import { decryptGigFile, type GigData } from '@/lib/decrypt'

type Platform = 'fiverr' | 'twitter' | 'discord' | 'upwork' | 'linkedin'
type AnalysisTab = 'overview' | 'pricing' | 'descriptionFaq' | 'requirements' | 'gallery'

interface Analysis {
  overview: {
    gigTitle: string
    titleAlternatives: string[]
    keywords: string[]
    tags: string[]
    competitiveEdge: {
      gaps: string[]
      differentiators: string[]
      summary: string
    }
  }
  pricing: {
    basic: {
      label: string
      price: string
      description: string
      deliverables: string[]
      deliveryDays: number
      revisions: number | 'Unlimited'
    }
    standard: {
      label: string
      price: string
      description: string
      deliverables: string[]
      deliveryDays: number
      revisions: number | 'Unlimited'
    }
    premium: {
      label: string
      price: string
      description: string
      deliverables: string[]
      deliveryDays: number
      revisions: number | 'Unlimited'
    }
    extras: {
      name: string
      description: string
      price: string
    }[]
  }
  description: {
    fullDescription: string
    faq: { question: string; answer: string }[]
  }
  requirements: {
    fullRequirementsText: string
    items: {
      question: string
      type: 'free_text' | 'multiple_choice' | string
      required: boolean
    }[]
  }
  gallery: {
    heroImagePrompt: string
    additionalPrompts: string[]
    slides: {
      slide: number
      purpose: string
      exactHeadline: string
      exactSubline: string
    }[]
    colorPalette: string[]
    fontRecommendation: string
    styleNotes: string
    imageCount: string
    videoRecommended: boolean
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
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:999, background: color ? `${color}18` : 'var(--surface2)', border:`1px solid ${color ? `${color}40` : 'var(--border)'}`, color: color || 'var(--text2)', fontSize:12, fontFamily:'var(--font-mono)', fontWeight:600 }}>
      {children}
    </span>
  )
}

function Card({ title, icon, children, noPad }: { title?: string; icon?: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding: noPad ? 0 : 24, marginBottom:18, boxShadow:'0 16px 40px rgba(0,0,0,0.12)' }}>
      {title && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, padding: noPad ? '24px 24px 0' : 0 }}>
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
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 13px', borderRadius:999, border:'1px solid var(--border)', background: copied ? '#1dbf73' : 'rgba(255,255,255,0.04)', color: copied ? 'white' : 'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-mono)', transition:'all 0.2s', boxShadow: copied ? '0 0 16px rgba(29,191,115,0.25)' : 'none' }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function Skeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {[220,180,200,220].map((w,i) => (
        <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:26 }}>
          <div className="animate-shimmer" style={{ height:20, width:w, borderRadius:8, marginBottom:18 }} />
          <div className="animate-shimmer" style={{ height:14, width:'90%', borderRadius:6, marginBottom:8 }} />
          <div className="animate-shimmer" style={{ height:14, width:'70%', borderRadius:6, marginBottom:8 }} />
          <div className="animate-shimmer" style={{ height:14, width:'80%', borderRadius:6 }} />
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
  const [selectedTitle, setSelectedTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [copyAllStatus, setCopyAllStatus] = useState('Copy All')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (analysis) {
      setSelectedTitle(analysis.overview.gigTitle)
      setSelectedTags(analysis.overview.tags)
      setFaqOpen(0)
      setCopyAllStatus('Copy All')
    }
  }, [analysis])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    try {
      const text = await file.text()
      const encData = JSON.parse(text)
      const decrypted = await decryptGigFile(encData)
      setGigs(decrypted)
      setStep('analyze')
    } catch {
      setError("Could not read file. Make sure it's a valid .enc.json from the Gig Collector extension.")
    }
  }

  async function handleAnalyze() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigs, niche }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
      setStep('results')
      setActiveTab('overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  function buildCopyAllText() {
    if (!analysis) return ''
    const nl = '\n'
    const parts: string[] = []
    parts.push(`GIG TITLE: ${selectedTitle || analysis.overview.gigTitle}`)
    parts.push(`Alternative Titles: ${analysis.overview.titleAlternatives.join(' | ')}`)
    parts.push(`Keywords: ${analysis.overview.keywords.join(', ')}`)
    parts.push(`Tags: ${selectedTags.join(', ')}`)
    parts.push(`COMPETITIVE EDGE:${nl}Gaps:${nl}- ${analysis.overview.competitiveEdge.gaps.join(`${nl}- `)}${nl}Differentiators:${nl}- ${analysis.overview.competitiveEdge.differentiators.join(`${nl}- `)}${nl}${nl}${analysis.overview.competitiveEdge.summary}`)
    parts.push('---')
    parts.push(`PRICING - BASIC (${analysis.pricing.basic.label}) ${analysis.pricing.basic.price} / ${analysis.pricing.basic.deliveryDays}d / ${analysis.pricing.basic.revisions} revisions${nl}${analysis.pricing.basic.description}${nl}Deliverables:${nl}- ${analysis.pricing.basic.deliverables.join(`${nl}- `)}`)
    parts.push(`PRICING - STANDARD (${analysis.pricing.standard.label}) ${analysis.pricing.standard.price} / ${analysis.pricing.standard.deliveryDays}d / ${analysis.pricing.standard.revisions} revisions${nl}${analysis.pricing.standard.description}${nl}Deliverables:${nl}- ${analysis.pricing.standard.deliverables.join(`${nl}- `)}`)
    parts.push(`PRICING - PREMIUM (${analysis.pricing.premium.label}) ${analysis.pricing.premium.price} / ${analysis.pricing.premium.deliveryDays}d / ${analysis.pricing.premium.revisions} revisions${nl}${analysis.pricing.premium.description}${nl}Deliverables:${nl}- ${analysis.pricing.premium.deliverables.join(`${nl}- `)}`)
    parts.push(`Extras:${nl}${analysis.pricing.extras.map(extra => `- ${extra.name}: ${extra.description} (${extra.price})`).join(nl)}`)
    parts.push('---')
    parts.push(`DESCRIPTION:${nl}${analysis.description.fullDescription}`)
    parts.push('---')
    parts.push(`FAQ:${nl}${analysis.description.faq.map(faq => `Q: ${faq.question}${nl}A: ${faq.answer}`).join(`${nl}${nl}`)}`)
    parts.push('---')
    parts.push(`REQUIREMENTS:${nl}${analysis.requirements.fullRequirementsText}`)
    parts.push(`Fields:${nl}${analysis.requirements.items.map(item => `- ${item.question} (${item.type})${item.required ? ' [required]' : ''}`).join(nl)}`)
    parts.push('---')
    parts.push(`GALLERY PROMPTS:${nl}Hero prompt:${nl}${analysis.gallery.heroImagePrompt}${nl}${nl}Additional prompts:${nl}${analysis.gallery.additionalPrompts.join(`${nl}${nl}`)}`)
    return parts.join(`${nl}${nl}`)
  }

  function reset() {
    setGigs([])
    setAnalysis(null)
    setStep('upload')
    setFileName('')
    setNiche('')
    setError('')
    setSelectedTitle('')
    setSelectedTags([])
    setFaqOpen(0)
    setCopyAllStatus('Copy All')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
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
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', background: activePlatform===p.id ? `${p.color}12` : 'transparent', cursor: p.available ? 'pointer' : 'not-allowed', marginBottom:2, borderLeft: activePlatform===p.id ? `3px solid ${p.color}` : '3px solid transparent', transition:'all 0.15s', opacity: p.available ? 1 : 0.4 }}
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

      <main style={{ flex:1, overflow:'auto', padding:32 }}>
        <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1dbf73', boxShadow:'0 0 8px #1dbf73' }}/>
              <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Fiverr Intelligence</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Gig Analyzer</h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>Upload collected gigs → get a full Fiverr-ready gig package</p>
          </div>
        </div>

        {step === 'upload' && (
          <div style={{ maxWidth:560, animation:'fadeUp 0.4s ease' }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); if (fileRef.current) fileRef.current.files = dt.files; handleFile({ target: fileRef.current } as React.ChangeEvent<HTMLInputElement>); } }}
              style={{ border:'2px dashed var(--border2)', borderRadius:20, padding:48, textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'var(--surface)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLElement).style.background='rgba(108,99,255,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLElement).style.background='var(--surface)' }}
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
              {[['1','Install the Fiverr Gig Collector browser extension','var(--accent)'],['2','Browse Fiverr, enable Collection Mode, click + on gigs','var(--accent2)'],['3','Extension opens each gig, captures deep data, encrypts it','#ff9f43'],['4','Download the .enc.json → upload here → get your blueprint','var(--accent3)']].map(([n,t,c]) => (
                <div key={n} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:`${c}20`, border:`1px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:c, flexShrink:0 }}>{n}</div>
                  <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'analyze' && (
          <div style={{ maxWidth:560, animation:'fadeUp 0.4s ease' }}>
            <div style={{ padding:'16px 20px', borderRadius:12, marginBottom:24, background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20 }}>✅</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--accent2)' }}>{gigs.length} gigs loaded</div>
                <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{fileName}</div>
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Collected Gigs</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:200, overflow:'auto' }}>
                {gigs.slice(0,10).map((g,i) => (
                  <div key={i} style={{ padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'var(--text)', flex:1, marginRight:12 }}>
                      <span style={{ color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:11, marginRight:8 }}>{i + 1}.</span>
                      {g.title.slice(0,62)}{g.title.length > 62 ? '…' : ''}
                    </span>
                    <span style={{ fontSize:11, color:'var(--accent2)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{g.price}</span>
                  </div>
                ))}
                {gigs.length > 10 && <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)', padding:8 }}>+{gigs.length - 10} more gigs</div>}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Your Niche <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional but recommended)</span>
              </label>
              <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Kajabi website design, React development…"
                style={{ width:'100%', padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'var(--font-display)', outline:'none', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>
            {error && <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:16, background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'var(--accent3)', fontSize:13 }}>{error}</div>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleAnalyze} disabled={loading}
                style={{ flex:1, padding:'14px', background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), #8b85ff)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading ? 'wait' : 'pointer', fontFamily:'var(--font-display)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              >
                {loading ? (
                  <><span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin-slow 0.8s linear infinite' }}/> Analyzing {gigs.length} gigs…</>
                ) : '🧠 Analyze & Generate Blueprint'}
              </button>
              <button onClick={reset} style={{ padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text2)', cursor:'pointer', fontSize:13 }}>↩</button>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div style={{ maxWidth:980, animation:'fadeUp 0.4s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:12, flexWrap:'wrap' }}>
              <div style={{ padding:'12px 16px', background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:20 }}>
                <span style={{ fontSize:13, color:'var(--accent2)', fontWeight:600 }}>
                  ✨ Blueprint from {gigs.length} gigs{niche && <span style={{ color:'var(--text2)', fontWeight:400 }}> · {niche}</span>}
                </span>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={async () => {
                    const text = buildCopyAllText()
                    if (!text) return
                    await navigator.clipboard.writeText(text)
                    setCopyAllStatus('Copied!')
                    window.setTimeout(() => setCopyAllStatus('Copy All'), 2000)
                  }}
                  style={{ padding:'10px 16px', borderRadius:14, border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--text2)', cursor:'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:8 }}
                >📋 {copyAllStatus}</button>
                <button onClick={reset} style={{ padding:'10px 16px', borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>← New analysis</button>
              </div>
            </div>

            <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:6 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex:1, padding:'12px 14px', borderRadius:12, border:'none', background: activeTab===tab.id ? 'var(--accent)' : 'transparent', color: activeTab===tab.id ? 'white' : 'var(--text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:12, fontWeight:700 }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {loading ? <Skeleton /> : analysis && (
              <>
                {activeTab === 'overview' && (
                  <div style={{ animation:'fadeUp 0.3s ease' }}>
                    <Card title="Fiverr Title & Tags" icon="✍️">
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
                        <div>
                          <div style={{ marginBottom:10, fontSize:11, textTransform:'uppercase', color:'var(--text3)', letterSpacing:'0.09em' }}>Gig Title</div>
                          <input readOnly value={selectedTitle || analysis.overview.gigTitle}
                            style={{ width:'100%', padding:'16px 16px', borderRadius:14, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:15, fontFamily:'var(--font-display)' }}
                          />
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'flex-end' }}>
                          <CopyBtn text={selectedTitle || analysis.overview.gigTitle} label="Copy title" />
                        </div>
                      </div>
                      <div style={{ marginBottom:18 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Alternate titles</span>
                          <span style={{ fontSize:12, color:'var(--text2)' }}>Tap to select</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
                          {analysis.overview.titleAlternatives.map((alt, index) => (
                            <button key={index} onClick={() => setSelectedTitle(alt)}
                              style={{ padding:'12px 14px', borderRadius:14, border: selectedTitle===alt ? '1px solid #1dbf73' : '1px solid var(--border)', background: selectedTitle===alt ? 'rgba(29,191,115,0.12)' : 'var(--surface)', color:'var(--text)', textAlign:'left', cursor:'pointer' }}
                            >{alt}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom:18 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Tags</span>
                          <CopyBtn text={selectedTags.join(', ')} label="Copy tags" />
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                          {analysis.overview.tags.map((tag, index) => (
                            <button key={index} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                              style={{ padding:'10px 14px', borderRadius:999, border:'1px solid var(--border)', background: selectedTags.includes(tag) ? 'rgba(29,191,115,0.15)' : 'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}
                            >{tag}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding:'18px', background:'rgba(108,99,255,0.08)', borderRadius:16, border:'1px solid var(--border)' }}>
                        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8 }}>{analysis.overview.competitiveEdge.summary}</p>
                        <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:10 }}>
                          {analysis.overview.competitiveEdge.gaps.map((gap, index) => <Tag key={index} color='var(--accent2)'>{gap}</Tag>)}
                          {analysis.overview.competitiveEdge.differentiators.map((diff, index) => <Tag key={index} color='var(--accent)'>{diff}</Tag>)}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div style={{ animation:'fadeUp 0.3s ease', display:'grid', gap:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16 }}>
                      {(['basic', 'standard', 'premium'] as const).map((tierKey) => {
                        const tier = analysis.pricing[tierKey]
                        const accent = tierKey === 'standard' ? 'var(--accent)' : tierKey === 'premium' ? 'var(--accent2)' : 'var(--text2)'
                        return (
                          <div key={tierKey} style={{ background:'var(--surface)', border:`1px solid ${accent}20`, borderRadius:18, padding:22, display:'flex', flexDirection:'column', justifyContent:'space-between', gap:18 }}>
                            <div>
                              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>{tier.label}</div>
                              <div style={{ fontSize:28, fontWeight:800, color:accent, marginBottom:6 }}>{tier.price}</div>
                              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>{tier.description}</div>
                            </div>
                            <div style={{ display:'grid', gap:10 }}>
                              {tier.deliverables.map((item, idx) => (
                                <div key={idx} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                                  <span style={{ color:accent, marginTop:2 }}>✓</span>
                                  <span style={{ fontSize:13, color:'var(--text2)' }}>{item}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', color:'var(--text3)', fontSize:12, gap:12, flexWrap:'wrap' }}>
                              <span>{tier.deliveryDays} days</span>
                              <span>{tier.revisions} revisions</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Card title="Extras" icon="➕">
                      <div style={{ display:'grid', gap:12 }}>
                        {analysis.pricing.extras.map((extra, index) => (
                          <div key={index} style={{ padding:'14px', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{extra.name}</div>
                              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{extra.description}</div>
                            </div>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--accent2)' }}>{extra.price}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'descriptionFaq' && (
                  <div style={{ animation:'fadeUp 0.3s ease', display:'grid', gap:16 }}>
                    <Card title="Full Fiverr Description" icon="📝">
                      <div style={{ position:'relative', borderRadius:18, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg2)' }}>
                        <textarea readOnly value={analysis.description.fullDescription}
                          style={{ width:'100%', minHeight:300, padding:22, border:'none', background:'transparent', color:'var(--text)', fontSize:14, lineHeight:1.8, fontFamily:'var(--font-display)', resize:'none' }}
                        />
                        <div style={{ position:'absolute', top:16, right:16 }}><CopyBtn text={analysis.description.fullDescription} label='Copy description' /></div>
                      </div>
                    </Card>
                    <Card title="FAQ" icon="❓">
                      <div style={{ display:'grid', gap:12 }}>
                        {analysis.description.faq.map((faq, index) => (
                          <div key={index} style={{ borderRadius:18, background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden' }}>
                            <button onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                              style={{ width:'100%', padding:'16px 18px', border:'none', background:'transparent', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', color:'var(--text)' }}
                            >
                              <span style={{ fontSize:13, fontWeight:700 }}>Q: {faq.question}</span>
                              <span style={{ color:'var(--accent2)' }}>{faqOpen === index ? '−' : '+'}</span>
                            </button>
                            {faqOpen === index && (
                              <div style={{ padding:'0 18px 18px', display:'flex', justifyContent:'space-between', gap:14, color:'var(--text2)', fontSize:13, lineHeight:1.8 }}>
                                <p style={{ flex:1 }}>A: {faq.answer}</p>
                                <CopyBtn text={`Q: ${faq.question}
A: ${faq.answer}`} label='Copy answer' />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div style={{ animation:'fadeUp 0.3s ease', display:'grid', gap:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <Card title="Required fields" icon="📌">
                        <div style={{ display:'grid', gap:10 }}>
                          {analysis.requirements.items.filter(item => item.required).map((item, index) => (
                            <div key={index} style={{ padding:'14px', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)' }}>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{item.question}</div>
                              <div style={{ display:'flex', gap:10, flexWrap:'wrap', color:'var(--text3)', fontSize:12 }}>
                                <Tag color={item.type === 'multiple_choice' ? 'var(--accent)' : 'var(--accent2)'}>{item.type}</Tag>
                                <Tag color='#1dbf73'>{item.required ? 'Required' : 'Optional'}</Tag>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card title="Optional fields" icon="💡">
                        <div style={{ display:'grid', gap:10 }}>
                          {analysis.requirements.items.filter(item => !item.required).map((item, index) => (
                            <div key={index} style={{ padding:'14px', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)' }}>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{item.question}</div>
                              <div style={{ display:'flex', gap:10, flexWrap:'wrap', color:'var(--text3)', fontSize:12 }}>
                                <Tag color={item.type === 'multiple_choice' ? 'var(--accent)' : 'var(--accent2)'}>{item.type}</Tag>
                                <Tag color='var(--text3)'>Optional</Tag>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                    <Card title="Ready-to-paste requirements" icon="📄">
                      <div style={{ position:'relative', borderRadius:18, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg2)' }}>
                        <textarea readOnly value={analysis.requirements.fullRequirementsText}
                          style={{ width:'100%', minHeight:220, padding:20, border:'none', background:'transparent', color:'var(--text)', fontSize:14, lineHeight:1.8, fontFamily:'var(--font-display)', resize:'none' }}
                        />
                        <div style={{ position:'absolute', top:16, right:16 }}><CopyBtn text={analysis.requirements.fullRequirementsText} label='Copy requirements' /></div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div style={{ animation:'fadeUp 0.3s ease', display:'grid', gap:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <Card title="Visual style" icon="🎨">
                        <div style={{ display:'grid', gap:14 }}>
                          <div>
                            <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Font</div>
                            <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7 }}>{analysis.gallery.fontRecommendation}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Style notes</div>
                            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{analysis.gallery.styleNotes}</div>
                          </div>
                          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                            {analysis.gallery.colorPalette.map((color, index) => (
                              <div key={index} style={{ width:42, height:42, borderRadius:14, background:color, border:'1px solid var(--border)' }} />
                            ))}
                          </div>
                        </div>
                      </Card>
                      <Card title="Hero & media" icon="📸">
                        <div style={{ display:'grid', gap:12 }}>
                          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Hero image prompt</div>
                          <div style={{ position:'relative', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)', padding:16, fontFamily:'var(--font-mono)', fontSize:13, lineHeight:1.8, color:'var(--text)' }}>
                            {analysis.gallery.heroImagePrompt}
                            <div style={{ position:'absolute', top:16, right:16 }}><CopyBtn text={analysis.gallery.heroImagePrompt} label='Copy prompt' /></div>
                          </div>
                          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase' }}>Video</div>
                          <div style={{ fontSize:13, color:'var(--text2)' }}>{analysis.gallery.videoRecommended ? 'Recommended for higher conversion and trust.' : 'Optional, but useful for premium positioning.'}</div>
                        </div>
                      </Card>
                    </div>
                    <Card title="Suggested gallery slides" icon="🖼️">
                      <div style={{ display:'grid', gap:12 }}>
                        {analysis.gallery.slides.map((slide, index) => (
                          <div key={index} style={{ padding:'16px', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)' }}>
                            <div style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Slide {slide.slide}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{slide.purpose}</div>
                            <div style={{ marginTop:10, fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{slide.exactHeadline}</div>
                            <div style={{ marginTop:8, fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{slide.exactSubline}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    {analysis.gallery.additionalPrompts.length > 0 && (
                      <Card title="Extra image prompts" icon="✨">
                        <div style={{ display:'grid', gap:12 }}>
                          {analysis.gallery.additionalPrompts.map((prompt, index) => (
                            <div key={index} style={{ position:'relative', padding:'16px', borderRadius:16, background:'var(--bg2)', border:'1px solid var(--border)', fontSize:13, fontFamily:'var(--font-mono)', whiteSpace:'pre-wrap', color:'var(--text)' }}>
                              {prompt}
                              <div style={{ position:'absolute', top:16, right:16 }}><CopyBtn text={prompt} label='Copy prompt' /></div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
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
