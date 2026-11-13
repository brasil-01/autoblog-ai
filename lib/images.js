// ============================================
// Imagem destacada: Pexels (se houver chave)
// ou Pollinations.ai (grátis, sem cadastro)
// ============================================

export async function resolveImage({ keyword, imagePrompt, imageSource = 'auto' }) {
  const pexels = process.env.PEXELS_API_KEY;

  if ((imageSource === 'pexels' || imageSource === 'auto') && pexels) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword || 'blog')}&per_page=1&orientation=landscape`, {
        headers: { Authorization: pexels },
        cache: 'no-store',
      });
      const data = await res.json();
      const p = data.photos && data.photos[0];
      if (p) {
        return {
          url: p.src.large2x || p.src.original || p.src.large,
          credit: `Foto: ${p.photographer} (Pexels)`,
        };
      }
    } catch { /* cai para a ilustração por IA */ }
  }

  const prompt = encodeURIComponent(imagePrompt || `modern editorial blog illustration about ${keyword || 'this topic'}, high quality, no text`);
  const seed = Math.floor(Math.random() * 1000000);
  return {
    url: `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=720&nologo=true&seed=${seed}`,
    credit: imageSource === 'pexels' ? undefined : 'Imagem gerada por IA (Pollinations.ai)',
  };
}
