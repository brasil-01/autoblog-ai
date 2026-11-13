import { NextResponse } from 'next/server';
import { getSettings, setSetting, usingSupabase } from '@/lib/db';
import { providerInfo } from '@/lib/ai';
import { getGoogleConnection } from '@/lib/blogger';

export const dynamic = 'force-dynamic';

const WRITABLE = [
  'blogger_blog_id', 'wp_site_url', 'wp_username', 'wp_app_password',
  'default_provider', 'default_model', 'site_name', 'site_url', 'cron_topics',
];

function mask(v) {
  if (v == null) return '';
  const s = String(v);
  return s.length <= 4 ? '••••' : '••••' + s.slice(-4);
}

export async function GET() {
  try {
    const keys = [...WRITABLE, 'google_oauth'];
    const v = await getSettings(keys);
    const google = await getGoogleConnection();
    return NextResponse.json({
      ok: true,
      env: {
        app_password: !!process.env.APP_PASSWORD,
        supabase: usingSupabase,
        gemini: !!process.env.GEMINI_API_KEY,
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        compatible: !!(process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL),
        pexels: !!process.env.PEXELS_API_KEY,
        google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        wp_env: !!(process.env.WP_SITE_URL || process.env.WP_APP_PASSWORD),
        cron_secret: !!process.env.CRON_SECRET,
      },
      providers: providerInfo(),
      values: {
        blogger_blog_id: v.blogger_blog_id || process.env.BLOGGER_BLOG_ID || '',
        wp_site_url: v.wp_site_url || process.env.WP_SITE_URL || '',
        wp_username: v.wp_username || process.env.WP_USERNAME || '',
        wp_app_password: v.wp_app_password ? mask(v.wp_app_password) : (process.env.WP_APP_PASSWORD ? '(definida via env)' : ''),
        wp_app_password_set: !!(v.wp_app_password || process.env.WP_APP_PASSWORD),
        google_connected: google.connected,
        google_expiry: google.expiry_date,
        default_provider: v.default_provider || 'gemini',
        default_model: v.default_model || '',
        site_name: v.site_name || '',
        site_url: v.site_url || '',
        cron_topics: v.cron_topics || '',
        cron_cursor: v.cron_cursor ?? 0,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (body?.disconnect_google) {
      await setSetting('google_oauth', null);
      return NextResponse.json({ ok: true, message: 'Blogger desconectado.' });
    }
    const saved = [];
    for (const key of WRITABLE) {
      if (body[key] !== undefined) {
        await setSetting(key, body[key] === '' ? null : body[key]);
        saved.push(key);
      }
    }
    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
