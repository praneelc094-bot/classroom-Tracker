// Classroom Tracker – topic detection, run on Supabase so the OpenRouter key stays secret.
//
// The browser sends the current 15-second window of transcript; this function checks the caller
// is a signed-in teacher, adds the instructions itself and calls OpenRouter with the key stored as
// the OPENROUTER_API_KEY secret. Because the prompt and model list live here, the function can only
// be used for topic detection, not as a general-purpose chatbot on your key.
//
// Deploy (once):  npx supabase secrets set OPENROUTER_API_KEY=sk-or-... --project-ref hnhheydwvgroahkywfsp
//                 npx supabase functions deploy detect-topic --project-ref hnhheydwvgroahkywfsp

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SYSTEM_PROMPT = `You label what a teacher is currently teaching, from a short live speech transcript.
The transcript comes from speech recognition, so expect misheard words, filler, and half sentences.
Reply with ONLY a JSON object, no other text:
{
  "topic": "short topic label, max 8 words",
  "keywords": ["3 to 5 key terms a student would search for"],
  "confidence": 0.0 to 1.0,
  "on_topic": true if this is lesson content, false if it is admin, jokes, discipline or chit-chat,
  "image_query": "3 to 6 word search query to find a clear teaching diagram of this topic on Wikimedia Commons, e.g. 'p-n junction depletion region diagram'"
}
If the window continues the previous topic, keep the same topic label.`;

// Must match the <select id="model"> options in index.html
const MODELS = new Set([
  'anthropic/claude-haiku-4.5',
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct',
]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const text = (v: unknown, max: number) => String(v ?? '').slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  // The public anon key alone is not enough: there must be a real signed-in teacher
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Sign in first' }, 401);

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) return json({ error: 'OPENROUTER_API_KEY secret is not set on the server' }, 500);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Body must be JSON' }, 400); }
  const model = String(body.model ?? '');
  if (!MODELS.has(model)) return json({ error: 'Unknown model: ' + model }, 400);
  const current = text(body.text, 4000).trim();
  if (!current) return json({ error: 'Empty transcript window' }, 400);

  const userMsg =
`Subject: ${text(body.subject, 200) || 'unknown'}
Previous topic: ${text(body.prevTopic, 200) || '(none)'}
Previous window text: ${text(body.prevText, 4000) || '(none)'}
CURRENT window text: ${current}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey, 'X-Title': 'Classroom Tracker' },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      temperature: 0.2,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMsg }],
    }),
  });
  return new Response(await res.text(), { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
});
