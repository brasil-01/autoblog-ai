import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'AutoBlog AI — Artigos SEO automáticos para Blogger e WordPress',
  description: 'Gere artigos otimizados para Google e AdSense com IA, com imagem, FAQ, referências e publicação automática como rascunho no Blogger e no WordPress.',
  robots: { index: false, follow: false }, // painel privado
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
