'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no login');
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(1200px 600px at 50% -10%, #241d4e 0%, var(--bg) 60%)' }}>
      <form onSubmit={submit} className="card" style={{ width: 380, padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AutoBlog <span style={{ color: '#a99cff' }}>AI</span></h1>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '6px 0 20px' }}>Painel privado — entre com a senha do ambiente (APP_PASSWORD).</p>
        <input
          className="f-input"
          type="password"
          autoFocus
          placeholder="Senha do painel"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ textAlign: 'center' }}
        />
        {error && <div className="notice notice-error" style={{ marginTop: 12 }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading || !password} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
          {loading ? <span className="spinner" /> : 'Entrar'}
        </button>
        <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
          Defina <code>APP_PASSWORD</code> nas Environment Variables da Vercel.<br />Sem ela, o painel fica aberto — não recomendado.
        </p>
      </form>
    </div>
  );
}
