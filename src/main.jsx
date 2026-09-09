import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Compass, Copy, Check, Sparkles, ArrowUpRight, RotateCcw } from "lucide-react";
import "./styles.css";

const examples = ["I don't", "She has never", "They would like"];
const fallback = {
  "i don't": [
    { en: "I don't like coffee.", pt: "Eu não gosto de café." },
    { en: "I don't understand.", pt: "Eu não entendo." },
    { en: "I don't think so.", pt: "Acho que não." },
    { en: "I don't have time right now.", pt: "Eu não tenho tempo agora." },
    { en: "I don't want to miss the bus.", pt: "Eu não quero perder o ônibus." }
  ],
  "she has never": [
    { en: "She has never been to London.", pt: "Ela nunca esteve em Londres." },
    { en: "She has never tried sushi.", pt: "Ela nunca experimentou sushi." },
    { en: "She has never seen that movie.", pt: "Ela nunca viu esse filme." },
    { en: "She has never worked from home.", pt: "Ela nunca trabalhou de casa." },
    { en: "She has never traveled alone.", pt: "Ela nunca viajou sozinha." }
  ],
  "they would like": [
    { en: "They would like a table for two.", pt: "Eles gostariam de uma mesa para dois." },
    { en: "They would like to book a room.", pt: "Eles gostariam de reservar um quarto." },
    { en: "They would like some more water.", pt: "Eles gostariam de mais água." },
    { en: "They would like to know the price.", pt: "Eles gostariam de saber o preço." },
    { en: "They would like to join us.", pt: "Eles gostariam de se juntar a nós." }
  ]
};

function App() {
  const [structure, setStructure] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState("");

  async function generate() {
    const value = structure.trim();
    if (!value || loading) return;
    setLoading(true); setError(""); setCopied(null);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structure: value }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "MISSING_API_KEY") {
          throw new Error("A conexão com o OpenRouter ainda não está disponível nesta implantação. Salve a chave OPENROUTER_API_KEY na Vercel e faça um novo deploy.");
        }
        throw new Error(data.error || "Não foi possível gerar as frases.");
      }
      if (!Array.isArray(data.phrases) || data.phrases.length !== 5 || data.phrases.some(p => !p?.en || !p?.pt)) {
        throw new Error("A resposta não trouxe 5 frases com tradução.");
      }
      setPhrases(data.phrases);
    } catch (err) {
      const local = fallback[value.toLowerCase()];
      if (local && !String(err.message).includes("OpenRouter")) {
        setPhrases(local);
        setError("Modo demonstração: estas são frases de exemplo. A geração com IA encontrou um problema.");
      } else {
        setError(err.message || "Algo deu errado. Tente novamente.");
        setPhrases([]);
      }
    } finally { setLoading(false); }
  }

  async function copyPhrase(text, key) {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1400);
  }
  async function copyAll() {
    if (!phrases.length) return;
    const text = phrases.map(({ en, pt }) => `Frente: ${en}\nVerso: ${pt}`).join("\n\n");
    await navigator.clipboard.writeText(text); setCopied("all"); setTimeout(() => setCopied(null), 1400);
  }
  function useExample(example) { setStructure(example); setTimeout(() => document.querySelector("#structure")?.focus(), 0); }

  return <div className="app-shell">
    <div className="topographic" aria-hidden="true" />
    <header className="site-header">
      <a className="brand" href="/" aria-label="PhraseForge"><span className="brand-mark"><Compass size={21} strokeWidth={1.7} /></span><span><strong>PhraseForge</strong><small>REAL ENGLISH · ANKI</small></span></a>
      <div className="header-note">SMALL STEPS · BIG PROGRESS</div>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> YOUR ENGLISH, IN REAL LIFE</div>
        <h1>O inglês que <em>fica.</em></h1>
        <p className="hero-copy">Transforme uma estrutura em inglês em <strong>5 frases naturais, úteis e prontas para o Anki.</strong></p>
        <div className="forge-card">
          <div className="input-label"><span>ESTRUTURA EM INGLÊS</span><span className="counter">{structure.length}/80</span></div>
          <div className="input-row">
            <input id="structure" maxLength="80" value={structure} onChange={e => setStructure(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="Ex.: I don't" autoComplete="off" />
            <button className="generate-btn" onClick={generate} disabled={!structure.trim() || loading}>{loading ? <span className="spinner" /> : <><span>Gerar frases</span><ArrowUpRight size={18} /></>}</button>
          </div>
          <div className="examples"><span>TENTE:</span>{examples.map(item => <button key={item} onClick={() => useExample(item)}>{item}</button>)}</div>
        </div>
        {error && <div className="notice">{error}</div>}
      </section>
      {phrases.length > 0 ? <section className="results">
        <div className="results-heading"><div><div className="eyebrow">YOUR PHRASES</div><h2>Frases que você <em>vai usar.</em></h2></div><button className="copy-all" onClick={copyAll}>{copied === "all" ? <Check size={16} /> : <Copy size={16} />}{copied === "all" ? "Copiado!" : "Copiar tudo"}</button></div>
        <div className="phrase-grid">{phrases.map((phrase, index) => <article className="phrase-card" key={`${phrase.en}-${index}`}>
          <span className="phrase-number">0{index + 1}</span>
          <div className="card-side front-side"><div className="side-label">FRENTE · ENGLISH</div><p>{phrase.en}</p><button className="copy-btn" onClick={() => copyPhrase(phrase.en, `en-${index}`)}>{copied === `en-${index}` ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar inglês</>}</button></div>
          <div className="card-divider" />
          <div className="card-side back-side"><div className="side-label">VERSO · PORTUGUÊS</div><p>{phrase.pt}</p><button className="copy-btn" onClick={() => copyPhrase(phrase.pt, `pt-${index}`)}>{copied === `pt-${index}` ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar português</>}</button></div>
        </article>)}</div>
        <div className="anki-tip"><div className="tip-icon"><Sparkles size={17} /></div><div><strong>Pronto para o Anki.</strong><span>Use o inglês na frente e o português no verso. Copie cada lado separadamente para montar seus cartões.</span></div></div>
        <button className="new-search" onClick={() => { setPhrases([]); setStructure(""); setError(""); }}><RotateCcw size={15} /> Criar outra estrutura</button>
      </section> : <section className="how-it-works"><div className="section-label">COMO FUNCIONA</div><div className="steps"><div><span>01</span><h3>Digite</h3><p>Uma estrutura que você quer automatizar.</p></div><div><span>02</span><h3>Gere</h3><p>Receba cinco exemplos naturais do dia a dia.</p></div><div><span>03</span><h3>Revise</h3><p>Leve as frases para o Anki e repita.</p></div></div></section>}
    </main>
    <footer><div className="footer-compass"><Compass size={18} /></div><div><strong>Teacher Luma Neiva</strong><span>Teacher · Explorer · Real English</span></div><span className="footer-right">REAL CONVERSATIONS · REAL RESULTS</span></footer>
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);