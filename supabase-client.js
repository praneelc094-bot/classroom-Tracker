// ============================================================
//  Classroom Tracker – Supabase storage layer
//  Saves every lecture, its transcript windows, and every
//  approved image so you can come back later and see exactly
//  what was taught and what was shown, in order.
//
//  Requires config.js to define SUPABASE_URL and SUPABASE_ANON_KEY
//  (see the block added to config.js) and the Supabase JS library
//  to be loaded before this file (added to index.html / history.html).
//
//  Everything here fails soft: if Supabase isn't configured, or a
//  save fails (offline, etc.), the app keeps working exactly as
//  before - you just won't have a history for that session.
// ============================================================

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

  function warnOnce(msg) {
    if (!warnOnce._said) { console.warn('[Classroom Tracker storage] ' + msg); warnOnce._said = true; }
  }

  // ---------- Auth (Google sign-in, per-teacher accounts) ----------
  async function getUser() {
    if (!ready) return null;
    const { data } = await client.auth.getUser();
    return data?.user || null;
  }

  function onAuthChange(callback) {
    if (!ready) return;
    client.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  }

  async function signInWithGoogle() {
    if (!ready) return;
    // prompt=select_account makes Google show its account chooser every time, instead of
    // silently reusing whichever Google account the browser is already signed in to
    await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: signInReturnUrl(), queryParams: { prompt: 'select_account' } } });
  }

  // Come back to this page, keeping only a pending Continue (?resumeLocal / ?resumeCloud) and
  // dropping anything else in the address, such as an error left by an earlier attempt
  function signInReturnUrl() {
    const back = new URL(location.origin + location.pathname);
    const now = new URLSearchParams(location.search);
    ['resumeLocal', 'resumeCloud'].forEach(k => { if (now.get(k)) back.searchParams.set(k, now.get(k)); });
    return back.toString();
  }

  async function signOut() {
    if (!ready) return;
    await client.auth.signOut();
  }

  // ---------- Lectures ----------
  async function startLecture({ subject, model, source }) {
    if (!ready) { warnOnce('Supabase not configured - lectures will not be saved. Fill SUPABASE_URL / SUPABASE_ANON_KEY in config.js.'); return null; }
    const user = await getUser();
    if (!user) { warnOnce('Not signed in - lecture will not be saved.'); return null; }
    const { data, error } = await client
      .from('lectures')
      .insert({ subject: subject || 'unknown', model: model || null, source: source || 'live', lecturer_id: user.id })
      .select('id')
      .single();
    if (error) { console.error('startLecture failed', error); return null; }
    return data.id;
  }

  async function endLecture(lectureId, totalWindows) {
    if (!ready || !lectureId) return;
    const { error } = await client
      .from('lectures')
      .update({ ended_at: new Date().toISOString(), total_windows: totalWindows || 0 })
      .eq('id', lectureId);
    if (error) console.error('endLecture failed', error);
  }

  async function reopenLecture(lectureId) {
    if (!ready || !lectureId) return;
    const { error } = await client
      .from('lectures')
      .update({ ended_at: null })
      .eq('id', lectureId);
    if (error) console.error('reopenLecture failed', error);
  }

  async function listLectures() {
    if (!ready) return [];
    const { data, error } = await client
      .from('lectures')
      .select('*')
      .order('started_at', { ascending: false });
    if (error) { console.error('listLectures failed', error); return []; }
    return data;
  }

  async function renameLecture(lectureId, subject) {
    if (!ready || !lectureId) return false;
    const { error } = await client
      .from('lectures')
      .update({ subject })
      .eq('id', lectureId);
    if (error) { console.error('renameLecture failed', error); return false; }
    return true;
  }

  // ---------- Transcript windows ----------
  // Upsert so re-saving the same window (e.g. after the teacher marks it
  // correct/wrong, or after an image gets approved) just updates the row.
  async function saveWindow(lectureId, w) {
    if (!ready || !lectureId || !w) return;
    const row = {
      lecture_id: lectureId,
      window_index: w.index,
      start_sec: w.startSec,
      end_sec: w.endSec,
      transcript_text: w.text || '',
      topic: w.topic || null,
      keywords: w.keywords || null,
      confidence: w.confidence ?? null,
      on_topic: w.onTopic ?? null,
      model: w.model || null,
      latency_ms: w.latencyMs ?? null,
      source: w.source || 'live',
      expected_topic: w.expected || null,
      verdict: w.verdict || null,
      correct_topic: w.correctTopic || null,
      image_query: w.imageQuery || null,
      image_verdict: w.imageVerdict || null,
      image_tries: w.imageTries ?? null
    };
    const { data, error } = await client
      .from('transcript_windows')
      .upsert(row, { onConflict: 'lecture_id,window_index' })
      .select('id')
      .single();
    if (error) { console.error('saveWindow failed', error); return null; }
    w._dbId = data.id;   // remember so saveApprovedImage can link to it
    return data.id;
  }

  // ---------- Approved images ----------
  // Downloads the approved image and keeps a permanent copy in Supabase
  // Storage (Wikimedia URLs can change or disappear later), then records
  // it against the lecture + the window it was shown for.
  async function saveApprovedImage(lectureId, w, image) {
    if (!ready || !lectureId || !image) return null;
    let storagePath = null, publicUrl = null;

    try {
      const res = await fetch(image.src);
      if (res.ok) {
        const blob = await res.blob();
        const ext = (blob.type.split('/')[1] || 'jpg').replace('svg+xml', 'svg');
        const safeTitle = (image.title || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
        storagePath = `${lectureId}/${String(w?.index ?? 0).padStart(4, '0')}-${safeTitle}.${ext}`;
        const { error: upErr } = await client.storage
          .from('lecture-images')
          .upload(storagePath, blob, { contentType: blob.type, upsert: true });
        if (upErr) { console.error('image upload failed', upErr); storagePath = null; }
        else {
          publicUrl = client.storage.from('lecture-images').getPublicUrl(storagePath).data.publicUrl;
        }
      }
    } catch (err) {
      console.error('could not fetch/re-host image, saving source link only', err);
    }

    const { data, error } = await client
      .from('lecture_images')
      .insert({
        lecture_id: lectureId,
        window_id: w?._dbId || null,
        topic: w?.topic || null,
        title: image.title || null,
        artist: image.artist || null,
        license: image.license || null,
        source_url: image.src || null,
        source_page: image.page || null,
        storage_path: storagePath,
        public_url: publicUrl
      })
      .select('id')
      .single();
    if (error) { console.error('saveApprovedImage failed', error); return null; }
    return data.id;
  }

  // ---------- History viewer ----------
  async function getLectureDetail(lectureId) {
    if (!ready || !lectureId) return null;
    const [{ data: lecture }, { data: windows }, { data: images }] = await Promise.all([
      client.from('lectures').select('*').eq('id', lectureId).single(),
      client.from('transcript_windows').select('*').eq('lecture_id', lectureId).order('window_index'),
      client.from('lecture_images').select('*').eq('lecture_id', lectureId).order('approved_at')
    ]);
    return { lecture, windows: windows || [], images: images || [] };
  }

  return { ready, getUser, onAuthChange, signInWithGoogle, signOut, startLecture, endLecture, reopenLecture, listLectures, renameLecture, saveWindow, saveApprovedImage, getLectureDetail };
})();
