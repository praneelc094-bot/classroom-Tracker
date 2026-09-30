// ============================================================
//  Classroom Tracker – shared helpers for index.html and history.html
//  - Google sign-in through Supabase Auth (the only thing Supabase is used for now)
//  - Topic detection through the "detect-topic" Supabase Edge Function, which keeps the
//    OpenRouter key on the server (see supabase/functions/detect-topic/index.ts)
//  - Saved sessions, kept in this browser and separated per signed-in teacher
//
//  Requires config.js to define SUPABASE_URL and SUPABASE_ANON_KEY, and the Supabase JS
//  library to be loaded before this file.
// ============================================================

// Anything that came from speech, a pasted transcript, an AI reply, Wikimedia or a typed
// session name goes through this before being put into the page as HTML.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Switch the page between the full-screen sign-in view and the app. Until the first call the
// body stays "auth-pending" and shows neither, so signed-in teachers never see a sign-in flash.
function setAuthView(loggedIn) {
  document.body.classList.remove('auth-pending');
  document.body.classList.toggle('signed-in', loggedIn);
  document.body.classList.toggle('signed-out', !loggedIn);
  document.getElementById('appContent').style.display = loggedIn ? 'block' : 'none';
  document.getElementById('userBar').style.display = loggedIn ? 'flex' : 'none';
  const errEl = document.getElementById('authError');
  if (errEl && !loggedIn && SIGN_IN_ERROR) errEl.textContent = 'Google sign-in didn’t finish (' + SIGN_IN_ERROR + '). Please try again.';
}

// A failed Google sign-in comes back as ?error=…#error=… in the address. If that is left there,
// Supabase reports the old error on every later attempt and ignores the new sign-in, so strip it
// before the client reads the address. Returns the message only when this load really failed.
const SIGN_IN_ERROR = (() => {
  const u = new URL(location.href);
  const hash = new URLSearchParams(u.hash.slice(1));
  const msg = u.searchParams.get('error_description') || hash.get('error_description') || u.searchParams.get('error') || hash.get('error');
  if (!msg) return '';
  ['error', 'error_code', 'error_description'].forEach(k => { u.searchParams.delete(k); hash.delete(k); });
  u.hash = hash.toString();
  history.replaceState(null, '', u.pathname + u.search + u.hash);
  return hash.has('access_token') ? '' : msg;   // fresh tokens next to a stale error: the sign-in worked
})();

const CT = (() => {
  const url = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '').trim();
  const key = (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '').trim();
  const ready = !!(url && key && window.supabase);
  const client = ready ? window.supabase.createClient(url, key) : null;

  // ---------- Sign-in ----------
  function onAuthChange(callback) {
    if (!ready) return;
    client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      useSessionsOf(user);
      callback(user);
    });
  }

  async function signInWithGoogle() {
    if (!ready) return;
    // prompt=select_account makes Google show its account chooser every time, instead of
    // silently reusing whichever Google account the browser is already signed in to
    await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: signInReturnUrl(), queryParams: { prompt: 'select_account' } } });
  }

  // Come back to this page, keeping only a pending Continue (?resumeLocal) and dropping
  // anything else in the address, such as an error left by an earlier attempt
  function signInReturnUrl() {
    const back = new URL(location.origin + location.pathname);
    const resume = new URLSearchParams(location.search).get('resumeLocal');
    if (resume) back.searchParams.set('resumeLocal', resume);
    return back.toString();
  }

  async function signOut() {
    if (!ready) return;
    await client.auth.signOut();
  }

  // ---------- Saved sessions (this browser, one list per teacher) ----------
  const LEGACY_KEY = 'classroomSessions';   // before sessions were kept per teacher
  let sessionsKey = null;

  function useSessionsOf(user) {
    sessionsKey = user ? LEGACY_KEY + ':' + user.id : null;
    // Sessions saved before this change had no owner: hand them to the first teacher who signs in
    const legacy = user && localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const mine = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
      const ids = new Set(mine.map(s => s.id));
      localStorage.setItem(sessionsKey, JSON.stringify([...mine, ...JSON.parse(legacy).filter(s => !ids.has(s.id))]));
      localStorage.removeItem(LEGACY_KEY);
    }
  }

  function loadSessions() {
    return sessionsKey ? JSON.parse(localStorage.getItem(sessionsKey) || '[]') : [];
  }

  function storeSessions(list) {
    if (sessionsKey) localStorage.setItem(sessionsKey, JSON.stringify(list));
  }

  // ---------- Topic detection (server-side, so the OpenRouter key never reaches the browser) ----------
  async function detectTopic(payload) {
    if (!ready) throw new Error('Supabase isn’t configured in config.js');
    const { data, error } = await client.functions.invoke('detect-topic', { body: payload });
    if (!error) return data;
    let msg = error.message;
    const status = error.context?.status;
    try { msg = (await error.context.json()).error || msg; } catch { /* not a JSON body */ }
    const err = new Error(status === 404 || error.name === 'FunctionsFetchError'
      ? 'Topic detection isn’t set up yet – deploy the detect-topic function'
      : msg);
    err.notDeployed = status === 404 || error.name === 'FunctionsFetchError';
    throw err;
  }

  return { ready, onAuthChange, signInWithGoogle, signOut, useSessionsOf, loadSessions, storeSessions, detectTopic };
})();
