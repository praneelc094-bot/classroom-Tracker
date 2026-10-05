// ============================================================
//  Consult Visuals – shared helpers
//  - Google sign-in for doctors through Supabase Auth
//  - Each doctor's library choices (approved images, edited text) and settings, kept in this
//    browser under that doctor's account. Nothing about patients is ever stored.
//
//  Requires config.js to define SUPABASE_URL and SUPABASE_ANON_KEY, and the Supabase JS
//  library to be loaded before this file.
// ============================================================

// Anything from Wikimedia or typed by the doctor goes through this before being put into the page as HTML.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Switch the page between the full-screen sign-in view and the app. Until the first call the
// body stays "auth-pending" and shows neither, so signed-in doctors never see a sign-in flash.
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

const CV = (() => {
  const url = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '').trim();
  const key = (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '').trim();
  const ready = !!(url && key && window.supabase);
  const client = ready ? window.supabase.createClient(url, key) : null;

  // ---------- Sign-in ----------
  let userId = null;

  function onAuthChange(callback) {
    if (!ready) return;
    client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      userId = user?.id || null;
      callback(user);
    });
  }

  async function signInWithGoogle() {
    if (!ready) return;
    // prompt=select_account makes Google show its account chooser every time, instead of
    // silently reusing whichever Google account the browser is already signed in to
    await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
  }

  async function signOut() {
    if (ready) await client.auth.signOut();
  }

  // ---------- Per-doctor storage in this browser ----------
  const read = name => { try { return JSON.parse(localStorage.getItem(name + ':' + userId) || '{}'); } catch { return {}; } };
  const write = (name, value) => { if (userId) localStorage.setItem(name + ':' + userId, JSON.stringify(value)); };

  return {
    ready, onAuthChange, signInWithGoogle, signOut,
    // { [conditionId]: { image, reviewed, text } }
    loadLibrary: () => read('cvLibrary'), storeLibrary: lib => write('cvLibrary', lib),
    // { clinicName }
    loadSettings: () => read('cvSettings'), storeSettings: s => write('cvSettings', s),
  };
})();
