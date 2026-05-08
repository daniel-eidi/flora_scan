import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedToken = process.env.APP_ACCESS_TOKEN;
  if (!expectedToken) {
    return res.status(500).json({ error: 'APP_ACCESS_TOKEN não configurado no servidor.' });
  }

  const providedToken = req.headers['x-access-token'];
  if (providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Token de acesso inválido.' });
  }

  return res.status(200).json({ ok: true });
}
