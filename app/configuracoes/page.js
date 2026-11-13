'use client';
import { useEffect, useState } from 'react';

const EnvPill = ({ ok, label }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, padding: '7px 10px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
    <span>{label}</span>
    <span className={`badge ${ok ? 'badge-ok' : 'badge-fail'}`}>{ok ? 'configurado' : 'faltando'}</span>
  </div>
);

export default function Configuracoes() {
  const [data, setData] = useState(null);
  const [env, setEnv] = useState(null);
  const [values, setValues] = useState({});
  const [toast, setToast] = useState('');
  const [testing, setTesting] = useState('');
  const [googleMsg, setGoogleMsg] = useState(null);

  async function load() {
    const res = await fetch('/api/settings');
    const d = await res.json();
    if (d.ok) {
      setData(d); setEnv(d.env); setValues({ ...d.values, wp_app_password: '' });
    }
  }
  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const g = params.get('google');
    if (g === 'connected') setGoogleMsg({ type: 'ok', text: 'Blogger conectado com sucesso! Agora defina o BLOGGER_BLOG_ID abaixo.' });
    if (g === 'error') setGoogleMsg({ type: 'err', text: `Falha ao conectar Blogger: ${params.get('msg') || 'erro desconhecido'}` });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  async function save(keys) {
    const payload = {};
    for (const k of keys) payload[k] = values[k] ?? '';
    const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await res.json();
    showToast(d.ok ? 'Salvo ✓' : `Erro: ${d.error}`);
    load();
  }

  async function test(target) {
    setTesting(target);
    try {
      const res = await fetch('/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
      const d = await res.json();
      showToast(`${d.ok ? '✓' : '✕'} ${d.message}`);
    } catch (e) { showToast(`Erro: ${e.message}`); }
    setTesting('');
  }

  if (!data) return <p style={{ color: 'var(--muted)' }}>Carregando…</p>;

  const providerModels = (data.values.default_provider && data.providers.find(p => p.id === data.values.default_provider)?.models) || [];

  return (
    <div>
      <h1 className="page-title">⚙️ Configurações</h1>
      <p className="page-sub">Conecte suas contas, chaves de IA e destinos de publicação.</p>

      {googleMsg && <div className={`notice ${googleMsg.type === 'ok' ? 'notice-ok' : 'notice-error'}`} style={{ marginBottom: 14 }}>{googleMsg.text}</div>}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ===== Coluna esquerda ===== */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>🔌 Status do ambiente (variáveis na Vercel)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <EnvPill ok={env.supabase} label="Supabase (banco)" />
              <EnvPill ok={env.app_password} label="APP_PASSWORD (senha)" />
              <EnvPill ok={env.gemini} label="GEMINI_API_KEY" />
              <EnvPill ok={env.deepseek} label="DEEPSEEK_API_KEY" />
              <EnvPill ok={env.openai} label="OPENAI_API_KEY" />
              <EnvPill ok={env.compatible} label="API compatível (OpenRouter…)" />
              <EnvPill ok={env.pexels} label="PEXELS_API_KEY (fotos)" />
              <EnvPill ok={env.google_oauth} label="Google OAuth (Blogger)" />
              <EnvPill ok={env.cron_secret} label="CRON_SECRET (automático)" />
            </div>
            <p className="f-hint" style={{ marginTop: 10 }}>Chaves ficam nas Environment Variables da Vercel (Settings → Environment Variables) ou no arquivo <code>.env.local</code> em desenvolvimento. Nunca commite o <code>.env.local</code>.</p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>🤖 Provedores de IA</h2>
            {data.providers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1f2536' }}>
                <span style={{ flex: 1, fontSize: 13 }}>{p.label} {p.configured ? <span className="badge badge-ok" style={{ marginLeft: 6 }}>chave ok</span> : <span className="badge badge-fail" style={{ marginLeft: 6 }}>sem chave</span>}</span>
                <button className="btn btn-ghost btn-sm" disabled={!p.configured || testing === p.id} onClick={() => test(p.id)}>
                  {testing === p.id ? 'Testando…' : 'Testar'}
                </button>
              </div>
            ))}
            <div className="f-row" style={{ marginTop: 14 }}>
              <div>
                <label className="f-label">Provedor padrão</label>
                <select className="f-select" value={values.default_provider || 'gemini'} onChange={e => setValues({ ...values, default_provider: e.target.value, default_model: '' })}>
                  {data.providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Modelo padrão</label>
                <select className="f-select" value={values.default_model || ''} onChange={e => setValues({ ...values, default_model: e.target.value })}>
                  <option value="">Padrão do provedor</option>
                  {(data.providers.find(p => p.id === (values.default_provider || 'gemini'))?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => save(['default_provider', 'default_model'])}>Salvar padrão</button>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>🖼️ Imagens</h2>
            <p style={{ fontSize: 12.5, color: '#c9cddb', lineHeight: 1.7 }}>
              {env.pexels
                ? '✓ PEXELS_API_KEY detectada — usaremos fotos reais gratuitas do Pexels (com crédito automático).'
                : 'Sem PEXELS_API_KEY, usaremos o Pollinations.ai: ilustrações geradas por IA, grátis e sem cadastro.'}
            </p>
            <p className="f-hint" style={{ marginTop: 6 }}>Para fotos reais grátis: crie uma chave em pexels.com/api e defina PEXELS_API_KEY na Vercel.</p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>🌐 Site & JSON-LD</h2>
            <label className="f-label">Nome do site / blog</label>
            <input className="f-input" placeholder="ex.: Blog do Linotipo" value={values.site_name || ''} onChange={e => setValues({ ...values, site_name: e.target.value })} />
            <label className="f-label">URL do site/blog (para links canônicos)</label>
            <input className="f-input" placeholder="https://meublog.com.br" value={values.site_url || ''} onChange={e => setValues({ ...values, site_url: e.target.value })} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => save(['site_name', 'site_url'])}>Salvar</button>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>⏰ Geração automática (cron diário)</h2>
            <p style={{ fontSize: 12.5, color: '#c9cddb', lineHeight: 1.7 }}>
              Com <code>CRON_SECRET</code> na Vercel e um tópico por linha abaixo, a Vercel chama <code>/api/cron/generate</code> todo dia às 09:00 e salva um novo artigo como <strong>rascunho</strong>. Você só revisa e publica.
            </p>
            <label className="f-label">Tópicos do cron (um por linha)</label>
            <textarea className="f-textarea" rows={5} placeholder={'como escolher notebook para home office\nmelhores ferramentas de IA para marketing\n...'} value={values.cron_topics || ''} onChange={e => setValues({ ...values, cron_topics: e.target.value })} />
            <div className="f-hint">Cursor atual: {values.cron_cursor ?? 0}. O provedor/modelo padrão acima será usado.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => save(['cron_topics'])}>Salvar tópicos</button>
          </div>
        </div>

        {/* ===== Coluna direita ===== */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>🟠 Blogger</h2>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>Publicação como rascunho via Blogger API v3 (OAuth do Google).</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, flex: 1 }}>Conexão com o Google:</span>
              {values.google_connected
                ? <span className="badge badge-ok">conectado ✓</span>
                : <span className="badge badge-fail">não conectado</span>}
            </div>
            <a href="/api/auth/google" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {values.google_connected ? '🔄 Reconectar Blogger' : '🔗 Conectar Blogger (OAuth)'}
            </a>
            {values.google_connected && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={async () => {
                await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disconnect_google: true }) });
                load(); showToast('Blogger desconectado.');
              }}>Desconectar</button>
            )}

            <label className="f-label">BLOGGER_BLOG_ID (ID do blog)</label>
            <input className="f-input mono" placeholder="ex.: 1234567890123456789" value={values.blogger_blog_id || ''} onChange={e => setValues({ ...values, blogger_blog_id: e.target.value })} />
            <div className="f-hint">Blogger → Configurações → Básico → “ID do blog” (ou o número na URL do painel: <code>blogger.com/blog/post/edit/<strong>ID</strong>/...</code>)</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => save(['blogger_blog_id'])}>Salvar ID</button>
              <button className="btn btn-ghost btn-sm" disabled={testing === 'blogger'} onClick={() => test('blogger')}>{testing === 'blogger' ? 'Testando…' : 'Testar conexão'}</button>
              <button className="btn btn-ghost btn-sm" disabled={testing === 'supabase'} onClick={() => test('supabase')}>{testing === 'supabase' ? 'Testando…' : 'Testar Supabase'}</button>
            </div>
            <div className="notice notice-info" style={{ marginTop: 12 }}>
              ⚠️ O Google só envia o <code>refresh_token</code> na <strong>primeira</strong> autorização. Se você reconectar e o token sumir, revogue o acesso em <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>myaccount.google.com/permissions</a> e conecte de novo.
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>🔵 WordPress</h2>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>Publicação como rascunho via REST API + Application Password.</p>

            <label className="f-label">URL do site</label>
            <input className="f-input" placeholder="https://meublog.com.br" value={values.wp_site_url || ''} onChange={e => setValues({ ...values, wp_site_url: e.target.value })} />
            <label className="f-label">Usuário (login do wp-admin)</label>
            <input className="f-input" placeholder="ex.: admin" value={values.wp_username || ''} onChange={e => setValues({ ...values, wp_username: e.target.value })} />
            <label className="f-label">Application Password {values.wp_app_password_set && <span style={{ color: 'var(--green)' }}>· já configurada ({values.wp_app_password})</span>}</label>
            <input className="f-input mono" type="password" placeholder={values.wp_app_password_set ? 'Deixe em branco para manter a atual' : 'xxxx xxxx xxxx xxxx xxxx xxxx'} value={values.wp_app_password || ''} onChange={e => setValues({ ...values, wp_app_password: e.target.value })} />
            <div className="f-hint">Em wp-admin → Usuários → Perfil → “Senhas de aplicativo” → nome “AutoBlog AI” → Adicionar. Copie a senha (com espaços).</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => save(['wp_site_url', 'wp_username', ...(values.wp_app_password ? ['wp_app_password'] : [])])}>Salvar</button>
              <button className="btn btn-ghost btn-sm" disabled={testing === 'wordpress'} onClick={() => test('wordpress')}>{testing === 'wordpress' ? 'Testando…' : 'Testar conexão'}</button>
            </div>
            <div className="notice notice-info" style={{ marginTop: 12 }}>
              Tags e o<em>cerpt</em> (meta description) também são enviados. O post nasce como <strong>rascunho</strong>: você revisa em wp-admin → Posts e publica.
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>🗄️ Supabase</h2>
            <p style={{ fontSize: 12.5, color: '#c9cddb', lineHeight: 1.7 }}>
              {env.supabase
                ? '✓ SUPABASE_URL e SERVICE_ROLE_KEY detectadas. Os artigos ficam na tabela "articles".'
                : '⚠️ Sem Supabase, em desenvolvimento o app usa arquivo local. Na Vercel o armazenamento some a cada deploy — configure o Supabase (o guia ensina em 5 minutos).'}
            </p>
            <p className="f-hint" style={{ marginTop: 6 }}>SQL pronto do schema: arquivo <code>supabase/schema.sql</code> no projeto — cole no SQL Editor do Supabase.</p>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
