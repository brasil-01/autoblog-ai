'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const NAV = [
  { href: '/', label: 'Dashboard', d: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10' },
  { href: '/gerar', label: 'Gerar Artigo', d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z' },
  { href: '/artigos', label: 'Meus Artigos', d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6M9 9h2' },
];
const NAV2 = [
  { href: '/checklist', label: 'Checklist AdSense & SEO', d: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { href: '/configuracoes', label: 'Configurações', d: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/login') return null;

  const link = (item) => (
    <Link key={item.href} href={item.href} className={`nav-link${pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)) ? ' active' : ''}`}>
      <Icon d={item.d} /> {item.label}
    </Link>
  );

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-badge">⚡</div>
        <div>
          <div className="logo-name">AutoBlog <span>AI</span></div>
          <div className="logo-sub">SEO • Blogger • WordPress</div>
        </div>
      </div>

      <div className="nav-section">Conteúdo</div>
      {NAV.map(link)}

      <div className="nav-section">Crescimento</div>
      {NAV2.map(link)}

      <div className="sidebar-footer">
        Artigos com IA + SEO completo.<br />Tudo fica como rascunho até você revisar e publicar.
        <button className="logout-btn" onClick={logout}>Sair do painel</button>
      </div>
    </aside>
  );
}
