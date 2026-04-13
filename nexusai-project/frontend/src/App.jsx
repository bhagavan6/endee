import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Upload, MessageCircle, BookOpen, HelpCircle, FileText,
  Sun, Moon, Trash2, Send, RotateCcw, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Loader2, Sparkles, Brain, Zap,
  Shield, TrendingUp, Clock, Target, Cpu, BarChart2
} from 'lucide-react'

const API = '/api'
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}
function Spinner({ size = 18 }) {
  return <Loader2 size={size} style={{ animation: 'spin 0.8s linear infinite' }} />
}

function UploadPanel({ onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const inputRef = useRef()
  async function handleFile(file) {
    if (!file) return
    setLoading(true); setStatus(null)
    const form = new FormData(); form.append('file', file)
    try {
      const data = await apiFetch('/upload', { method: 'POST', body: form })
      setStatus({ ok: true, msg: data.message }); onUploaded(file.name)
    } catch (e) { setStatus({ ok: false, msg: e.message }) }
    finally { setLoading(false) }
  }
  return (
    <div className="nx-card">
      <div className="nx-card-hdr">
        <span className="nx-icon"><Upload size={14} /></span>
        <span className="nx-card-title">Upload Notes</span>
      </div>
      <div className={`nx-drop${dragging ? ' drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        {loading
          ? <div className="nx-drop-loading"><Spinner size={24} /><span>Processing…</span></div>
          : <><div className="nx-drop-orb"><Upload size={20} /></div>
            <p className="nx-drop-main">Drop PDF or TXT here</p>
            <p className="nx-drop-sub">or click to browse</p></>}
      </div>
      {status && (
        <div className={`nx-status ${status.ok ? 'ok' : 'err'}`}>
          {status.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ hasContent }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! Upload your notes and ask me anything about them.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  async function send() {
    const q = input.trim(); if (!q || loading) return
    setMessages(m => [...m, { role: 'user', text: q }]); setInput(''); setLoading(true)
    try {
      const data = await apiFetch('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
      setMessages(m => [...m, { role: 'assistant', text: data.answer }])
    } catch (e) { setMessages(m => [...m, { role: 'assistant', text: `⚠ ${e.message}` }]) }
    finally { setLoading(false) }
  }
  return (
    <div className="nx-card nx-chat">
      <div className="nx-card-hdr">
        <span className="nx-icon"><MessageCircle size={14} /></span>
        <span className="nx-card-title">Ask AI</span>
        {hasContent && <span className="nx-pulse" />}
      </div>
      <div className="nx-messages">
        {messages.map((m, i) => (
          <div key={i} className={`nx-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
            {m.role === 'assistant' ? <div className="nx-md"><ReactMarkdown>{m.text}</ReactMarkdown></div> : <span>{m.text}</span>}
          </div>
        ))}
        {loading && <div className="nx-bubble ai nx-dots"><span /><span /><span /></div>}
        <div ref={bottomRef} />
      </div>
      <div className="nx-input-row">
        <input className="nx-input" placeholder={hasContent ? 'Ask about your notes…' : 'Upload notes first…'}
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} disabled={!hasContent || loading} />
        <button className="nx-send" onClick={send} disabled={!hasContent || loading || !input.trim()}><Send size={14} /></button>
      </div>
    </div>
  )
}

function FlashcardsPanel({ hasContent }) {
  const [cards, setCards] = useState([]); const [loading, setLoading] = useState(false)
  const [idx, setIdx] = useState(0); const [flipped, setFlipped] = useState(false); const [error, setError] = useState(null)
  async function generate() {
    setLoading(true); setError(null); setIdx(0); setFlipped(false)
    try { const data = await apiFetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'flashcards' }) }); setCards(data.data) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  const card = cards[idx]
  return (
    <div className="nx-card">
      <div className="nx-card-hdr">
        <span className="nx-icon"><BookOpen size={14} /></span>
        <span className="nx-card-title">Flashcards</span>
        <button className="nx-gen-btn" onClick={generate} disabled={!hasContent || loading}>
          {loading ? <Spinner size={12} /> : <Sparkles size={12} />}<span>{cards.length ? 'Regenerate' : 'Generate'}</span>
        </button>
      </div>
      {error && <p className="nx-err">{error}</p>}
      {card ? (<>
        <div className="nx-fc" onClick={() => setFlipped(f => !f)}>
          <div className={`nx-fc-inner${flipped ? ' flip' : ''}`}>
            <div className="nx-fc-face nx-fc-front"><span className="nx-fc-tag">QUESTION</span><p className="nx-fc-text">{card.front}</p></div>
            <div className="nx-fc-face nx-fc-back"><span className="nx-fc-tag">ANSWER</span><p className="nx-fc-text">{card.back}</p></div>
          </div>
          <p className="nx-fc-hint">Click to flip</p>
        </div>
        <div className="nx-fc-nav">
          <button className="nx-nav-btn" onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }} disabled={idx === 0}><ChevronLeft size={16} /></button>
          <span className="nx-fc-count">{idx + 1} / {cards.length}</span>
          <button className="nx-nav-btn" onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }} disabled={idx === cards.length - 1}><ChevronRight size={16} /></button>
        </div>
      </>) : !loading && <p className="nx-empty">Generate flashcards from your uploaded notes.</p>}
    </div>
  )
}

function QuizPanel({ hasContent }) {
  const [questions, setQuestions] = useState([]); const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState(null)
  async function generate() {
    setLoading(true); setError(null); setAnswers({}); setSubmitted(false)
    try { const data = await apiFetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'quiz' }) }); setQuestions(data.data) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  const score = questions.filter(q => answers[q.question] === q.answer).length
  return (
    <div className="nx-card">
      <div className="nx-card-hdr">
        <span className="nx-icon"><HelpCircle size={14} /></span>
        <span className="nx-card-title">MCQ Quiz</span>
        <button className="nx-gen-btn" onClick={generate} disabled={!hasContent || loading}>
          {loading ? <Spinner size={12} /> : <Sparkles size={12} />}<span>{questions.length ? 'Regenerate' : 'Generate'}</span>
        </button>
      </div>
      {error && <p className="nx-err">{error}</p>}
      {questions.map((q, qi) => (
        <div key={qi} className="nx-quiz-block">
          <p className="nx-quiz-q">{qi + 1}. {q.question}</p>
          <div className="nx-quiz-opts">
            {q.options.map((opt, oi) => {
              const letter = ['A', 'B', 'C', 'D'][oi]; const sel = answers[q.question] === letter
              const right = submitted && q.answer === letter; const wrong = submitted && sel && !right
              return <button key={oi} className={`nx-opt${sel && !submitted ? ' sel' : ''}${right ? ' right' : ''}${wrong ? ' wrong' : ''}`}
                onClick={() => !submitted && setAnswers(a => ({ ...a, [q.question]: letter }))}><span className="nx-opt-l">{letter}</span>{opt}</button>
            })}
          </div>
          {submitted && answers[q.question] && <p className="nx-explain">{q.explanation}</p>}
        </div>
      ))}
      {questions.length > 0 && !submitted && <button className="nx-submit" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>Submit Quiz</button>}
      {submitted && (
        <div className="nx-score">
          <Brain size={18} /><span>Score: {score}/{questions.length} — {Math.round(score / questions.length * 100)}%</span>
          <button className="nx-gen-btn" style={{ marginLeft: 'auto' }} onClick={() => { setSubmitted(false); setAnswers({}) }}><RotateCcw size={12} /><span style={{ marginLeft: 4 }}>Retry</span></button>
        </div>
      )}
      {!questions.length && !loading && <p className="nx-empty">Generate a quiz from your uploaded notes.</p>}
    </div>
  )
}

function SummaryPanel({ hasContent }) {
  const [summary, setSummary] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(null)
  async function generate() {
    setLoading(true); setError(null)
    try { const data = await apiFetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'summary' }) }); setSummary(data.data) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <div className="nx-card">
      <div className="nx-card-hdr">
        <span className="nx-icon"><FileText size={14} /></span>
        <span className="nx-card-title">Topic Summary</span>
        <button className="nx-gen-btn" onClick={generate} disabled={!hasContent || loading}>
          {loading ? <Spinner size={12} /> : <Sparkles size={12} />}<span>{summary ? 'Regenerate' : 'Generate'}</span>
        </button>
      </div>
      {error && <p className="nx-err">{error}</p>}
      {loading && <div className="nx-loading-row"><Spinner /><span>Generating…</span></div>}
      {summary && !loading && <div className="nx-summary-box"><div className="nx-md"><ReactMarkdown>{summary}</ReactMarkdown></div></div>}
      {!summary && !loading && <p className="nx-empty">Generate a structured summary of your uploaded notes.</p>}
    </div>
  )
}

const FEATURES = [
  { icon: Shield, title: 'Reliable', desc: 'Consistent performance and minimal errors. AI assistants provide dependable support ensuring tasks are completed accurately on time.', highlight: false },
  { icon: Zap, title: 'Productive', desc: 'By handling repetitive tasks, AI boosts productivity, freeing users to focus on critical endeavours.', highlight: true },
  { icon: Target, title: 'Intuitive', desc: 'Designed with user-friendly interfaces, AI assistants are easy to use, reducing the learning curve.', highlight: false },
  { icon: TrendingUp, title: 'Efficient', desc: 'AI assistants streamline tasks and automate routine activities, allowing users to accomplish more in less time.', highlight: false },
  { icon: BarChart2, title: 'Accurate', desc: 'AI assistants deliver precise results, minimising mistakes and enhancing decision-making.', highlight: false },
  { icon: Clock, title: 'Responsive', desc: 'AI assistants provide quick responses to queries, enhancing the user experience by reducing wait times.', highlight: false },
  { icon: Brain, title: 'Convenient', desc: 'Accessible anytime through mobile devices, AI assistants offer unparalleled convenience, simplifying daily activities.', highlight: false },
  { icon: Cpu, title: 'Adaptive', desc: 'AI assistants learn from interactions and adapt to preferences, ensuring a personalised experience.', highlight: false },
  { icon: Sparkles, title: 'Time Saving', desc: 'By automating tasks and providing quick access to information, AI assistants save users significant time.', highlight: false },
]

const TABS = [
  { id: 'chat', label: 'Ask AI', icon: MessageCircle },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'summary', label: 'Summary', icon: FileText },
]

const TICKER = ['AI-Powered Learning', 'Smart Flashcards', 'Instant Summaries', 'MCQ Quiz Generator', 'RAG Architecture', 'Groq LLM Backend', 'Vector Search', '24h Support']

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [tab, setTab] = useState('chat')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [view, setView] = useState('landing')

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  async function handleReset() {
    if (!confirm('Clear all uploaded content?')) return
    try { await apiFetch('/reset', { method: 'DELETE' }); setUploadedFile(null) } catch (e) { alert(e.message) }
  }

  const dark = theme === 'dark'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:${dark ? '#090e09' : '#f0f4f0'};--bg2:${dark ? '#0e150e' : '#e6ede6'};--bg3:${dark ? '#131f13' : '#dce6dc'};
          --surf:${dark ? '#101810' : '#ffffff'};--surf2:${dark ? '#162016' : '#f4faf4'};
          --bd:${dark ? 'rgba(34,197,94,.10)' : 'rgba(34,197,94,.18)'};
          --bd2:${dark ? 'rgba(34,197,94,.20)' : 'rgba(34,197,94,.32)'};
          --tx:${dark ? '#e4efe4' : '#0c190c'};--tx2:${dark ? '#7aa07a' : '#3a5c3a'};--tx3:${dark ? '#4a6a4a' : '#6a8a6a'};
          --g:#22c55e;--g2:#16a34a;
          --gbg:${dark ? 'rgba(34,197,94,.08)' : 'rgba(34,197,94,.10)'};
          --gbd:${dark ? 'rgba(34,197,94,.22)' : 'rgba(34,197,94,.30)'};
          --red:${dark ? '#f87171' : '#dc2626'};
          --rbg:${dark ? 'rgba(248,113,113,.09)' : 'rgba(220,38,38,.07)'};
          --rbd:${dark ? 'rgba(248,113,113,.28)' : 'rgba(220,38,38,.22)'};
          --sh:${dark ? '0 8px 40px rgba(0,0,0,.55)' : '0 8px 40px rgba(0,0,0,.10)'};
          --sh2:${dark ? '0 2px 16px rgba(0,0,0,.38)' : '0 2px 16px rgba(0,0,0,.07)'};
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.78)}}
        @keyframes blink{0%,80%,100%{opacity:0;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        html,body{background:var(--bg);color:var(--tx);font-family:'Inter',sans-serif;font-size:15px;min-height:100vh;transition:background .3s,color .3s;}
        .nx-root{min-height:100vh;position:relative;overflow-x:hidden;}
        .nx-bg-grid{position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px);
          background-size:56px 56px;opacity:${dark ? '1' : '.6'};}
        .nx-glow{position:fixed;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:400px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(34,197,94,.07) 0%,transparent 70%);pointer-events:none;z-index:0;}
        /* HEADER */
        .nx-hdr{position:sticky;top:0;z-index:200;height:60px;display:flex;align-items:center;justify-content:space-between;
          padding:0 36px;background:${dark ? 'rgba(9,14,9,.9)' : 'rgba(240,244,240,.92)'};
          border-bottom:1px solid var(--bd);backdrop-filter:blur(20px);}
        .nx-logo{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nx-logo-mark{width:34px;height:34px;border-radius:9px;background:var(--gbg);border:1px solid var(--gbd);display:flex;align-items:center;justify-content:center;}
        .nx-logo-name{font-weight:800;font-size:1.1rem;letter-spacing:-.02em;color:var(--tx);}
        .nx-logo-badge{font-size:.58rem;font-weight:700;letter-spacing:.1em;color:var(--g);background:var(--gbg);border:1px solid var(--gbd);padding:2px 7px;border-radius:99px;}
        .nx-nav{display:flex;align-items:center;gap:4px;}
        .nx-nav-link{background:none;border:none;color:var(--tx2);font-size:.87rem;padding:6px 12px;border-radius:7px;cursor:pointer;transition:all .15s;}
        .nx-nav-link:hover{background:var(--gbg);color:var(--tx);}
        .nx-hdr-r{display:flex;align-items:center;gap:8px;}
        .nx-theme{width:34px;height:34px;border-radius:8px;background:var(--surf);border:1px solid var(--bd);color:var(--tx2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
        .nx-theme:hover{border-color:var(--gbd);color:var(--tx);}
        .nx-cta{display:flex;align-items:center;gap:6px;background:var(--g);border:none;color:#fff;font-size:.83rem;font-weight:600;padding:8px 18px;border-radius:99px;cursor:pointer;transition:all .18s;}
        .nx-cta:hover{background:var(--g2);transform:translateY(-1px);}
        /* HERO */
        .nx-hero{position:relative;z-index:1;text-align:center;padding:100px 24px 80px;min-height:460px;display:flex;align-items:center;justify-content:center;}
        .nx-hero-inner{max-width:700px;animation:fadeUp .5s ease both;}
        .nx-h1{font-size:clamp(2.6rem,6vw,4rem);font-weight:800;line-height:1.1;letter-spacing:-.03em;color:var(--tx);margin-bottom:20px;}
        .nx-hero-p{font-size:.98rem;color:var(--tx2);line-height:1.7;max-width:520px;margin:0 auto 32px;}
        .nx-hero-btns{display:flex;align-items:center;justify-content:center;gap:12px;}
        .nx-btn-p{background:var(--g);border:none;color:#fff;font-weight:600;font-size:.92rem;padding:12px 28px;border-radius:99px;cursor:pointer;transition:all .18s;}
        .nx-btn-p:hover{background:var(--g2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.3);}
        .nx-btn-g{background:transparent;border:1px solid var(--bd2);color:var(--tx2);font-weight:500;font-size:.92rem;padding:12px 28px;border-radius:99px;cursor:pointer;transition:all .18s;}
        .nx-btn-g:hover{border-color:var(--gbd);color:var(--tx);background:var(--gbg);}
        /* DECO */
        .nx-deco{position:absolute;inset:0;pointer-events:none;z-index:-1;overflow:hidden;}
        .nx-sq{position:absolute;border:1px solid var(--bd2);border-radius:8px;animation:float 4s ease-in-out infinite;opacity:${dark ? '.5' : '.3'};}
        /* SECTION */
        .nx-sec-lbl{position:relative;z-index:1;text-align:center;margin-bottom:14px;}
        .nx-badge{display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;color:var(--g);background:var(--gbg);border:1px solid var(--gbd);padding:5px 14px;border-radius:99px;}
        .nx-sec-h2{position:relative;z-index:1;text-align:center;font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;letter-spacing:-.02em;color:var(--tx);margin-bottom:12px;}
        .nx-sec-h2 em{font-style:normal;color:var(--g);}
        .nx-sec-p{position:relative;z-index:1;text-align:center;font-size:.92rem;color:var(--tx2);line-height:1.7;max-width:500px;margin:0 auto 48px;}
        /* FEATURES */
        .nx-feats{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1100px;margin:0 auto 60px;padding:0 24px;}
        .nx-feat{background:var(--surf);border:1px solid var(--bd);border-radius:14px;padding:24px;transition:all .2s;cursor:pointer;animation:fadeUp .4s ease both;}
        .nx-feat:hover{border-color:var(--gbd);transform:translateY(-3px);box-shadow:var(--sh2);}
        .nx-feat.hl{background:${dark ? '#112011' : '#e6f5e6'};border-color:var(--gbd);box-shadow:0 0 32px rgba(34,197,94,.12);}
        .nx-feat-ico{width:42px;height:42px;border-radius:10px;background:var(--gbg);border:1px solid var(--gbd);color:var(--g);display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
        .nx-feat-t{font-size:.95rem;font-weight:700;color:var(--tx);margin-bottom:8px;}
        .nx-feat-d{font-size:.82rem;color:var(--tx2);line-height:1.6;}
        /* TICKER */
        .nx-ticker{position:relative;z-index:1;background:${dark ? '#0c160c' : '#dfeadf'};border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:14px 0;overflow:hidden;}
        .nx-ticker-track{display:flex;gap:0;white-space:nowrap;animation:ticker 22s linear infinite;}
        .nx-ticker-item{display:inline-flex;align-items:center;gap:8px;font-size:.82rem;font-weight:500;color:var(--tx2);padding:0 32px;}
        .nx-ticker-dot{width:6px;height:6px;border-radius:50%;background:var(--g);flex-shrink:0;}
        /* APP GRID */
        .nx-app{position:relative;z-index:1;display:grid;grid-template-columns:276px 1fr;gap:18px;max-width:1300px;margin:0 auto;padding:22px 22px 48px;}
        .nx-side{display:flex;flex-direction:column;gap:12px;}
        /* CARD */
        .nx-card{background:var(--surf);border:1px solid var(--bd);border-radius:14px;padding:17px;box-shadow:var(--sh2);animation:fadeUp .35s ease both;transition:background .3s,border-color .3s;}
        .nx-card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
        .nx-icon{width:26px;height:26px;border-radius:7px;background:var(--gbg);border:1px solid var(--gbd);color:var(--g);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .nx-card-title{font-weight:700;font-size:.88rem;color:var(--tx);flex:1;}
        .nx-pulse{width:7px;height:7px;border-radius:50%;background:var(--g);animation:pulse 2s ease infinite;}
        /* DROP */
        .nx-drop{border:2px dashed var(--bd2);border-radius:11px;padding:24px 14px;text-align:center;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:7px;}
        .nx-drop:hover,.nx-drop.drag{border-color:var(--g);background:var(--gbg);box-shadow:0 0 20px rgba(34,197,94,.1);}
        .nx-drop-orb{width:48px;height:48px;border-radius:50%;background:var(--gbg);border:1px solid var(--gbd);color:var(--g);display:flex;align-items:center;justify-content:center;margin-bottom:4px;transition:all .18s;}
        .nx-drop:hover .nx-drop-orb,.nx-drop.drag .nx-drop-orb{transform:scale(1.08);}
        .nx-drop-main{font-size:.85rem;font-weight:500;color:var(--tx2);}
        .nx-drop-sub{font-size:.73rem;color:var(--tx3);}
        .nx-drop-loading{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--tx2);font-size:.83rem;}
        /* STATUS */
        .nx-status{display:flex;align-items:center;gap:6px;border-radius:8px;padding:7px 11px;margin-top:9px;font-size:.81rem;}
        .nx-status.ok{background:var(--gbg);border:1px solid var(--gbd);color:var(--g);}
        .nx-status.err{background:var(--rbg);border:1px solid var(--rbd);color:var(--red);}
        /* TABS */
        .nx-sec-sm{font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:8px;padding:0 2px;}
        .nx-tabs{display:flex;flex-direction:column;gap:2px;}
        .nx-tab{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border-radius:9px;background:transparent;border:1px solid transparent;color:var(--tx2);font-size:.86rem;cursor:pointer;text-align:left;transition:all .15s;}
        .nx-tab:hover{background:var(--bg2);color:var(--tx);}
        .nx-tab.active{background:var(--gbg);border-color:var(--gbd);color:var(--tx);}
        /* STRIP */
        .nx-strip{display:flex;justify-content:space-between;background:var(--bg2);border:1px solid var(--bd);border-radius:11px;padding:11px 14px;}
        .nx-strip-item{text-align:center;}
        .nx-strip-lbl{display:block;font-size:.62rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--tx3);margin-bottom:3px;}
        .nx-strip-val{font-size:.8rem;font-weight:600;color:var(--tx2);}
        .nx-strip-val.live{color:var(--g);}
        /* FILE */
        .nx-file{display:flex;align-items:center;gap:7px;background:var(--surf);border:1px solid var(--gbd);border-radius:10px;padding:9px 13px;font-size:.78rem;color:var(--tx2);}
        .nx-file span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .nx-reset{background:none;border:none;color:var(--tx3);cursor:pointer;padding:2px;display:flex;align-items:center;transition:color .15s;}
        .nx-reset:hover{color:var(--red);}
        /* CHAT */
        .nx-chat{display:flex;flex-direction:column;height:calc(100vh - 148px);min-height:480px;}
        .nx-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:11px;padding:2px;margin-bottom:12px;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent;}
        .nx-bubble{max-width:80%;padding:11px 14px;border-radius:13px;font-size:.88rem;line-height:1.65;animation:fadeUp .22s ease both;}
        .nx-bubble.user{background:var(--g);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;box-shadow:0 4px 16px rgba(34,197,94,.22);}
        .nx-bubble.ai{background:var(--surf2);border:1px solid var(--bd);align-self:flex-start;border-bottom-left-radius:4px;color:var(--tx2);}
        .nx-dots{display:flex;align-items:center;gap:5px;padding:12px 15px;}
        .nx-dots span{width:7px;height:7px;border-radius:50%;background:var(--g);animation:blink 1.4s infinite;}
        .nx-dots span:nth-child(2){animation-delay:.2s;}
        .nx-dots span:nth-child(3){animation-delay:.4s;}
        .nx-input-row{display:flex;gap:7px;align-items:center;}
        .nx-input{flex:1;background:var(--bg2);border:1px solid var(--bd2);border-radius:10px;padding:10px 14px;color:var(--tx);font-family:'Inter',sans-serif;font-size:.88rem;outline:none;transition:border-color .15s,box-shadow .15s;}
        .nx-input:focus{border-color:var(--g);box-shadow:0 0 0 3px var(--gbg);}
        .nx-input::placeholder{color:var(--tx3);}
        .nx-input:disabled{opacity:.5;cursor:not-allowed;}
        .nx-send{width:40px;height:40px;border-radius:10px;background:var(--g);border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;}
        .nx-send:hover:not(:disabled){background:var(--g2);transform:scale(1.06);}
        .nx-send:disabled{opacity:.35;cursor:not-allowed;}
        /* GEN BTN */
        .nx-gen-btn{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;background:var(--gbg);border:1px solid var(--gbd);color:var(--g);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;}
        .nx-gen-btn:hover:not(:disabled){background:var(--g);color:#fff;border-color:var(--g);}
        .nx-gen-btn:disabled{opacity:.35;cursor:not-allowed;}
        /* MD */
        .nx-md{font-size:.88rem;line-height:1.68;color:var(--tx2);}
        .nx-md p{margin-bottom:.5em;} .nx-md p:last-child{margin-bottom:0;}
        .nx-md strong{color:var(--tx);font-weight:600;}
        .nx-md ul,.nx-md ol{padding-left:1.3em;margin-bottom:.5em;}
        .nx-md li{margin-bottom:.18em;}
        .nx-md code{background:var(--bg3);border:1px solid var(--bd);padding:1px 5px;border-radius:4px;font-size:.8em;color:var(--g);}
        .nx-md pre{background:var(--bg3);border:1px solid var(--bd);padding:11px;border-radius:9px;overflow-x:auto;margin:.5em 0;}
        .nx-md h1,.nx-md h2,.nx-md h3{color:var(--tx);margin:.9em 0 .35em;font-weight:700;}
        /* FC */
        .nx-fc{perspective:1000px;cursor:pointer;margin-bottom:11px;}
        .nx-fc-inner{position:relative;width:100%;min-height:165px;transform-style:preserve-3d;transition:transform .52s cubic-bezier(.4,0,.2,1);}
        .nx-fc-inner.flip{transform:rotateY(180deg);}
        .nx-fc-face{position:absolute;inset:0;border-radius:12px;padding:20px;backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;gap:9px;}
        .nx-fc-front{background:var(--surf2);border:1px solid var(--bd);}
        .nx-fc-back{background:var(--gbg);border:1px solid var(--gbd);transform:rotateY(180deg);}
        .nx-fc-tag{font-size:.62rem;font-weight:700;letter-spacing:.12em;color:var(--g);text-transform:uppercase;}
        .nx-fc-text{color:var(--tx);font-size:.92rem;line-height:1.5;}
        .nx-fc-hint{text-align:center;font-size:.7rem;color:var(--tx3);}
        .nx-fc-nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:6px;}
        .nx-fc-count{font-size:.86rem;color:var(--tx2);font-weight:600;}
        .nx-nav-btn{width:32px;height:32px;border-radius:8px;background:var(--surf2);border:1px solid var(--bd);color:var(--tx2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
        .nx-nav-btn:hover:not(:disabled){background:var(--gbg);border-color:var(--gbd);color:var(--g);}
        .nx-nav-btn:disabled{opacity:.3;cursor:not-allowed;}
        /* QUIZ */
        .nx-quiz-block{margin-bottom:15px;padding:14px;border-radius:11px;background:var(--bg2);border:1px solid var(--bd);}
        .nx-quiz-q{font-weight:600;font-size:.88rem;color:var(--tx);margin-bottom:9px;}
        .nx-quiz-opts{display:flex;flex-direction:column;gap:6px;}
        .nx-opt{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:var(--surf);border:1px solid var(--bd);border-radius:8px;padding:8px 12px;color:var(--tx2);font-size:.82rem;cursor:pointer;transition:all .13s;}
        .nx-opt:hover:not(:disabled){background:var(--surf2);border-color:var(--bd2);color:var(--tx);}
        .nx-opt.sel{background:var(--surf2);border-color:var(--gbd);color:var(--tx);}
        .nx-opt.right{background:var(--gbg);border-color:var(--gbd);color:var(--g);}
        .nx-opt.wrong{background:var(--rbg);border-color:var(--rbd);color:var(--red);}
        .nx-opt-l{font-weight:700;font-size:.73rem;color:var(--g);min-width:17px;}
        .nx-explain{font-size:.78rem;color:var(--tx3);font-style:italic;margin-top:7px;}
        .nx-submit{width:100%;padding:11px;border-radius:10px;background:var(--g);border:none;color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;margin-top:6px;transition:all .15s;}
        .nx-submit:hover:not(:disabled){background:var(--g2);}
        .nx-submit:disabled{opacity:.35;cursor:not-allowed;}
        .nx-score{display:flex;align-items:center;gap:10px;margin-top:11px;background:var(--gbg);border:1px solid var(--gbd);border-radius:10px;padding:12px 15px;color:var(--tx);font-weight:600;font-size:.9rem;}
        /* SUMMARY */
        .nx-summary-box{background:var(--bg2);border:1px solid var(--bd);border-radius:11px;padding:16px;max-height:520px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bd2) transparent;}
        /* MISC */
        .nx-empty{color:var(--tx3);font-size:.83rem;text-align:center;padding:26px 0;}
        .nx-err{color:var(--red);font-size:.81rem;margin-bottom:9px;}
        .nx-loading-row{display:flex;align-items:center;gap:9px;color:var(--tx3);padding:18px;font-size:.86rem;}
        button{cursor:pointer;} button:disabled{cursor:not-allowed;}
      `}</style>

      <div className="nx-root">
        <div className="nx-bg-grid" />
        <div className="nx-glow" />

        {/* HEADER */}
        <header className="nx-hdr">
          <div className="nx-logo" onClick={() => setView('landing')}>
            <div className="nx-logo-mark"><Brain size={18} color="#22c55e" /></div>
            <span className="nx-logo-name">NexusAI</span>
            <span className="nx-logo-badge">BETA</span>
          </div>
          <nav className="nx-nav">
            {['Home', 'App', 'Pricing', 'Blog', 'Contact'].map((l, i) => (
              <button key={l} className="nx-nav-link" onClick={() => i === 0 ? setView('landing') : i === 1 ? setView('app') : null}>{l}</button>
            ))}
          </nav>
          <div className="nx-hdr-r">
            <button className="nx-theme" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="nx-cta" onClick={() => setView('app')}><Zap size={14} />Launch App</button>
          </div>
        </header>

        {view === 'landing' ? (<>
          {/* HERO */}
          <section className="nx-hero">
            <div className="nx-hero-inner">
              <h1 className="nx-h1">Enhance Your<br />Study Experience</h1>
              <p className="nx-hero-p">Experience superior AI-powered learning with NexusAI — intelligent notes analysis, flashcards, quizzes, and summaries powered by RAG and Groq.</p>
              <div className="nx-hero-btns">
                <button className="nx-btn-p" onClick={() => setView('app')}>Launch App</button>
                <button className="nx-btn-g">Learn More</button>
              </div>
            </div>
            <div className="nx-deco">
              {[
                { t: '10%', l: '5%', w: 90, h: 90, d: 0 }, { t: '20%', l: '14%', w: 60, h: 60, d: .5 },
                { t: '60%', l: '3%', w: 70, h: 70, d: 1 }, { t: '75%', l: '18%', w: 50, h: 50, d: 1.5 },
                { t: '8%', r: '5%', w: 85, h: 85, d: .3 }, { t: '22%', r: '13%', w: 55, h: 55, d: .8 },
                { t: '55%', r: '5%', w: 75, h: 75, d: 1.2 }, { t: '70%', r: '18%', w: 48, h: 48, d: 1.8 },
                { t: '40%', l: '8%', w: 40, h: 40, d: .2 }, { t: '40%', r: '8%', w: 44, h: 44, d: .9 },
              ].map((s, i) => (
                <div key={i} className="nx-sq" style={{
                  top: s.t, left: s.l, right: s.r, width: s.w, height: s.h,
                  animationDelay: `${s.d}s`
                }} />
              ))}
            </div>
          </section>

          <div className="nx-sec-lbl">
            <span className="nx-badge"><Sparkles size={11} /> Just the Best in the Game</span>
          </div>
          <h2 className="nx-sec-h2">AI Tailored <em>Just for You</em></h2>
          <p className="nx-sec-p">Experience the comfort and ease of personalised AI technology, designed to simplify learning and enhance your daily study routines.</p>

          {/* FEATURES */}
          <div className="nx-feats">
            {FEATURES.map((f, i) => (
              <div key={i} className={`nx-feat${f.highlight ? ' hl' : ''}`} onClick={() => setView('app')}>
                <div className="nx-feat-ico"><f.icon size={22} /></div>
                <h3 className="nx-feat-t">{f.title}</h3>
                <p className="nx-feat-d">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* TICKER */}
          <div className="nx-ticker">
            <div className="nx-ticker-track">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="nx-ticker-item">
                  <span className="nx-ticker-dot" />{t}
                </span>
              ))}
            </div>
          </div>
        </>) : (
          /* APP VIEW */
          <div className="nx-app">
            <aside className="nx-side">
              <UploadPanel onUploaded={setUploadedFile} />
              <div className="nx-card">
                <p className="nx-sec-sm">Features</p>
                <div className="nx-tabs">
                  {TABS.map(t => (
                    <button key={t.id} className={`nx-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                      <t.icon size={14} style={{ color: tab === t.id ? '#22c55e' : 'inherit' }} />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="nx-strip">
                {[{ l: 'Model', v: 'Groq' }, { l: 'Vector', v: 'Endee' }, { l: 'Status', v: uploadedFile ? 'Ready' : 'Idle', live: !!uploadedFile }].map(s => (
                  <div key={s.l} className="nx-strip-item">
                    <span className="nx-strip-lbl">{s.l}</span>
                    <span className={`nx-strip-val${s.live ? ' live' : ''}`}>{s.v}</span>
                  </div>
                ))}
              </div>
              {uploadedFile && (
                <div className="nx-file">
                  <FileText size={12} color="#22c55e" />
                  <span>{uploadedFile}</span>
                  <button className="nx-reset" onClick={handleReset}><Trash2 size={12} /></button>
                </div>
              )}
            </aside>
            <section style={{ minWidth: 0 }}>
              {tab === 'chat' && <ChatPanel hasContent={!!uploadedFile} />}
              {tab === 'flashcards' && <FlashcardsPanel hasContent={!!uploadedFile} />}
              {tab === 'quiz' && <QuizPanel hasContent={!!uploadedFile} />}
              {tab === 'summary' && <SummaryPanel hasContent={!!uploadedFile} />}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
