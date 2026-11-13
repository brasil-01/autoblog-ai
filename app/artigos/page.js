'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function scoreClass(s) { return s >= 85 ? 'score-good' : s >= 60 ? 'score-mid' : 'score-bad'; }
const STATUS = {
  draft: ['Rascunho', 'badge-draft'],
  published_blogger: ['→ Blogger', 'badge-blogger'],
  published_wordpress: ['→ WordPress', 'badge-wordpress'],
};

export default function ArtigosPage() {
  const [articles, setArticles] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArticles(data);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Excluir este artigo permanentemente?')) return;
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    setArticles(a => a.filter(x => x.id !== id));
  }

  const filtered = useMemo(() => (articles || []).filter(a => {
    if (status !== 'all' && a.status !== status) return false;
    if (!q.trim()) return true;
    const hay = `${a.title} ${a.keyword || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [articles, q, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">📚 Meus Artigos</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>{articles ? `${articles.length} artigo(s) no banco` : 'Carregando…'}</p>
        </div>
        <Link href="/gerar" className="btn btn-primary">⚡ Novo artigo</Link>
      </div>

      <div className="card" style={{ marginTop: 18, padding: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input className="f-input" style={{ flex: 1, minWidth: 220 }} placeholder="🔎 Buscar por título, keyword ou tag…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="f-select" style={{ width: 210 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="draft">Rascunhos</option>
          <option value="published_blogger">Enviados ao Blogger</option>
          <option value="published_wordpress">Enviados ao WordPress</option>
        </select>
      </div>

      {error && <div className="notice notice-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="card" style={{ marginTop: 14, overflowX: 'auto' }}>
        {filtered.length > 0 ? (
          <table className="table">
            <thead><tr><th>Artigo</th><th>SEO</th><th>Status</th><th>Criado</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {filtered.map(a => {
                const [label, cls] = STATUS[a.status] || STATUS.draft;
                return (
                  <tr key={a.id}>
                    <td><Link href={`/artigos/${a.id}`}>{a.title}</Link><div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{a.keyword}</div></td>
                    <td><span className={`score-pill ${scoreClass(a.seo_score || 0)}`}>{a.seo_score ?? '–'}</span></td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link href={`/artigos/${a.id}`} className="btn btn-ghost btn-sm">Abrir</Link>{' '}
                      <button className="btn btn-red btn-sm" onClick={() => remove(a.id)}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{articles ? 'Nada encontrado com esse filtro.' : 'Carregando…'}</p>
        )}
      </div>
    </div>
  );
}
