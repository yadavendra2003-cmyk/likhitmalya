import type { Config, Context } from '@netlify/functions';
import { drizzle } from 'drizzle-orm/netlify-db';
import { and, eq, desc } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { mocks } from '../../db/schema.js';

export default async (req: Request, context: Context) => {
  const headers = { 'Cache-Control': 'private, no-store' };
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (!['GET', 'POST'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, POST' } });
  if (req.method === 'POST' && req.headers.get('origin') !== new URL(req.url).origin) return reply({ error: 'Request origin is not allowed.' }, 403);
  let browser = context.cookies.get('practice_library');
  if (!browser || !/^[a-f0-9]{64}$/.test(browser)) {
    browser = randomBytes(32).toString('hex');
    context.cookies.set({ name: 'practice_library', value: browser, path: '/', httpOnly: true, secure: new URL(req.url).protocol === 'https:', sameSite: 'Lax', maxAge: 31536000 });
  }
  const owner = createHash('sha256').update(browser).digest('hex');
  const subject = new URL(req.url).searchParams.get('subject');
  if (!subject || !['math', 'reasoning', 'gk', 'english'].includes(subject)) return reply({ error: 'Choose a valid subject.' }, 400);
  try {
    const db = drizzle();
    if (req.method === 'GET') {
      const rows = await db.select().from(mocks).where(and(eq(mocks.owner, owner), eq(mocks.subject, subject))).orderBy(desc(mocks.createdAt));
      return reply(rows.map(({ owner: _, ...row }) => row));
    }
    const text = await req.text();
    if (text.length > 1000000) return reply({ error: 'Upload must be smaller than 1 MB.' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    const validQuestion = (q: any) => q && typeof q.q === 'string' && q.q.trim() && q.q.length <= 10000 && Array.isArray(q.options) && q.options.length === 4 && q.options.every((o: unknown) => typeof o === 'string' && o.length <= 5000) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3 && typeof q.explanation === 'string' && q.explanation.length <= 20000;
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120 || !Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 500 || !body.questions.every(validQuestion)) return reply({ error: 'Provide a title and 1–500 questions with four options and an answer index from 0 to 3.' }, 400);
    const [row] = await db.insert(mocks).values({ owner, subject, title: body.title.trim(), questions: body.questions.map((q: any) => ({ q: q.q, options: q.options, answer: q.answer, explanation: q.explanation })) }).returning();
    const { owner: _, ...result } = row;
    return reply(result, 201);
  } catch {
    return reply({ error: 'Your mock library is unavailable. Please try again.' }, 503);
  }
};
export const config: Config = { path: '/api/mocks' };
