'use client';
import { useEffect, useState } from 'react';

const NICHES = [
  ['financas', 'Finanças'],
  ['tecnologia', 'Tecnologia'],
  ['saude', 'Saúde e bem-estar'],
  ['receitas', 'Culinária e receitas'],
  ['viagens', 'Viagens'],
  ['outro', 'Outro nicho'],
];
const LANGUAGES = [
  ['pt-BR', 'Português (Brasil)'],
  ['pt-PT', 'Português (Portugal)'],
  ['en', 'English'],
  ['es', 'Español'],
];
const INTENTS = [
  ['informacional', 'Informacional (quem quer aprender)'],
  ['comercial', 'Comercial (quem está comparando)'],
  ['transacional', 'Transacional (quem quer comprar)'],
];
const DIFFICULTY = [
  ['baixo', 'Baixa concorrência'],
  ['medio', 'Média concorrência'],
  ['alto', 'Alta concorrência'],
];

export default function Catalogo() {
  const [categories, setCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', niche: 'financas', language: 'pt-BR', description: '' });
  const [kwForm, setKwForm] = useState({ keyword: '', niche: 'financas', language: 'pt-BR', intent: 'informacional', difficulty: 'baixo', category_id: '' });

  async function load() {
    setError('');
    try {
      const [c, k] = await Promise.all([fetch('/api/catalog/categories').then(r => r.json()), fetch('/api/catalog/keywords').then(r => r.json())]);
      if (c.error) setError(c.error);
      else setCategories(c.categories || []);
      if (k.keywords) setKeywords(k.keywords);
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  async function submitCategory(e) {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setBusy(true); setError('');
    const res = await fetch('/api/catalog/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
    const d = await res.json();
    setBusy(false);
    if (d.error) { setError(d.error); return; }
    setCatForm(f => ({ ...f, name: '', description: '' }));
    showToast('Categoria cadastrada ✓');
    load();
  }

  async function submitKeyword(e) {
    e.preventDefault();
    if (!kwForm.keyword.trim()) return;
    setBusy(true); setError('');
    const body = { ...kwForm, category_id: kwForm.category_id || null };
    const res = await fetch('/api/catalog/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    setBusy(false);
    if (d.error) { setError(d.error); return; }
    setKwForm(f => ({ ...f, keyword: '' }));
    showToast('Palavra-chave cadastrada ✓');
    load();
  }

  async function remove(kind, id) {
    const res = await fetch(`/api/catalog/${kind}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.error) { setError(d.error); return; }
    showToast('Removido ✓');
    load();
  }

  async function seed() {
    setBusy(true); setError('');
    const res = await fetch('/api/catalog/seed', { method: 'POST' });
    const d = await res.json();
    setBusy(false);
    if (d.error) { setError(d.error); return; }
    showToast(`Seed importado: ${d.totalCategories} categorias e ${d.totalKeywords} palavras-chave (finanças/pt-BR + exemplo en) ✓`);
    load();
  }

  const catName = (id) => categories.find(c => c.id === id)?.name || '—';

  return (
    <div>
      <h1 className="page-title">🗂️ Catálogo de Nichos e Palavras-chave</h1>
      <p className="page-sub">Pré-cadastre nichos, categorias e palavras-chave. O gerador usa esse catálogo para preencher os formulários e respeitar o idioma de cada blog — hoje finanças em PT-BR, amanhã outros nichos e idiomas sem reconfigurar nada.</p>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: 16 }}>
          <strong>{error}</strong>
          {/catalog\.sql|não encontradas/i.test(error) && (
            <div style={{ marginTop: 8, fontSize: 12.5 }}>
              <strong>Como resolver (1 minuto):</strong> abra o Supabase → <em>SQL Editor</em> → cole o conteúdo do arquivo
              <code> supabase/catalog.sql </code> do projeto → <em>Run</em>. Depois clique em “Importar exemplos de finanças” aqui embaixo.
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🌱 Importar exemplos prontos (finanças / pt-BR)</div>
          <div className="f-hint" style={{ marginTop: 4 }}>9 categorias e 31 palavras-chave reais de cauda longa + 1 exemplo em inglês. Idempotente: pode clicar mais de uma vez, nada duplica.</div>
        </div>
        <button className="btn btn-green" disabled={busy} onClick={seed}>{busy ? <><span className="spinner" /> Importando…</> : 'Importar exemplos'}</button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ===== Categorias ===== */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>📁 Categorias de blog ({categories.length})</h2>
          <form onSubmit={submitCategory}>
            <label className="f-label">Nome da categoria *</label>
            <input className="f-input" placeholder="ex.: Finanças para a Família" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
            <div className="f-row" style={{ marginTop: 10 }}>
              <div>
                <label className="f-label">Nicho</label>
                <select className="f-select" value={catForm.niche} onChange={e => setCatForm({ ...catForm, niche: e.target.value })}>
                  {NICHES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Idioma</label>
                <select className="f-select" value={catForm.language} onChange={e => setCatForm({ ...catForm, language: e.target.value })}>
                  {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <label className="f-label" style={{ marginTop: 10 }}>Descrição (opcional)</label>
            <input className="f-input" placeholder="sobre o que é este cluster de artigos" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
            <button type="submit" className="btn btn-primary" disabled={busy || !catForm.name.trim()} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>+ Adicionar categoria</button>
          </form>
          <hr className="divider" />
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table className="table">
              <thead><tr><th>Categoria</th><th>Nicho</th><th>Idioma</th><th></th></tr></thead>
              <tbody>
                {categories.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Nenhuma categoria ainda — importe os exemplos acima.</td></tr>}
                {categories.map(c => (
                  <tr key={c.id}><td>{c.name}</td><td>{c.niche}</td><td>{c.language}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => remove('categories', c.id)}>excluir</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Palavras-chave ===== */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>🔑 Palavras-chave ({keywords.length})</h2>
          <form onSubmit={submitKeyword}>
            <label className="f-label">Palavra-chave *</label>
            <input className="f-input" placeholder="ex.: como fazer um orçamento mensal" value={kwForm.keyword} onChange={e => setKwForm({ ...kwForm, keyword: e.target.value })} />
            <div className="f-row" style={{ marginTop: 10 }}>
              <div>
                <label className="f-label">Categoria</label>
                <select className="f-select" value={kwForm.category_id} onChange={e => setKwForm({ ...kwForm, category_id: e.target.value })}>
                  <option value="">— sem categoria —</option>
                  {categories.filter(c => c.niche === kwForm.niche && c.language === kwForm.language).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Nicho</label>
                <select className="f-select" value={kwForm.niche} onChange={e => setKwForm({ ...kwForm, niche: e.target.value })}>
                  {NICHES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="f-row" style={{ marginTop: 10 }}>
              <div>
                <label className="f-label">Idioma</label>
                <select className="f-select" value={kwForm.language} onChange={e => setKwForm({ ...kwForm, language: e.target.value })}>
                  {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Intenção de busca</label>
                <select className="f-select" value={kwForm.intent} onChange={e => setKwForm({ ...kwForm, intent: e.target.value })}>
                  {INTENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <label className="f-label" style={{ marginTop: 10 }}>Concorrência</label>
            <select className="f-select" value={kwForm.difficulty} onChange={e => setKwForm({ ...kwForm, difficulty: e.target.value })}>
              {DIFFICULTY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button type="submit" className="btn btn-primary" disabled={busy || !kwForm.keyword.trim()} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>+ Adicionar palavra-chave</button>
          </form>
          <hr className="divider" />
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table className="table">
              <thead><tr><th>Palavra-chave</th><th>Intenção</th><th>Idioma</th><th></th></tr></thead>
              <tbody>
                {keywords.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Nenhuma palavra-chave ainda — importe os exemplos acima.</td></tr>}
                {keywords.map(k => (
                  <tr key={k.id}>
                    <td title={k.category?.name || catName(k.category_id)}>{k.keyword}</td>
                    <td><span className={`badge ${k.intent === 'comercial' ? 'badge-blogger' : k.intent === 'transacional' ? 'badge-ok' : 'badge-muted'}`}>{k.intent}</span></td>
                    <td>{k.language}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => remove('keywords', k.id)}>excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="notice notice-info" style={{ marginTop: 16 }}>
        💡 <strong>Como isso vira dinheiro:</strong> palavras-chave de intenção <em>comercial</em> (“melhor X”, “X vale a pena”, “X ou Y”) atraem quem está prestes a comprar — são as que rendem com afiliados e AdSense. Priorize-as depois de cobrir os pilares informacionais do nicho. O seletor de idioma já deixa o terreno pronto para um blog em inglês/espanhol no futuro.
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
