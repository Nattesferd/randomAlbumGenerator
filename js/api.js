export const els = {
  token: document.getElementById('token'),
  saveToken: document.getElementById('saveToken'),
  clearToken: document.getElementById('clearToken'),
  tokenStatus: document.getElementById('tokenStatus'),
  go: document.getElementById('go'),
  again: document.getElementById('again'),
  status: document.getElementById('status'),
  output: document.getElementById('output'),
  genre: document.getElementById('genre'),
  style: document.getElementById('style'),
  country: document.getElementById('country'),
  format: document.getElementById('format'),
  yearFrom: document.getElementById('yearFrom'),
  yearTo: document.getElementById('yearTo')
};

export const LS_KEY = 'discogs_user_token';

export function setTokenStatus(msg, cls){ els.tokenStatus.className = 'status ' + (cls||''); els.tokenStatus.textContent = msg; }
export function setStatus(msg, cls){ els.status.className = 'status ' + (cls||''); els.status.textContent = msg; }

export function buildQuery({ perPage = 50, page } = {}) {
  const params = new URLSearchParams();

  const g  = els.genre?.value?.trim();
  const s  = els.style?.value?.trim();
  const c  = els.country?.value?.trim();
  const f  = els.format?.value?.trim();
  const yf = els.yearFrom?.value?.trim();
  const yt = els.yearTo?.value?.trim();

  if (g) params.set('genre', g);
  if (s) params.set('style', s);
  if (c) params.set('country', c);
  if (f) params.set('format', f);

  if (yf || yt) {
    if (yf && yt) params.set('year', `${yf}-${yt}`);
    else if (yf)  params.set('year', `${yf}-`);
    else          params.set('year', `-${yt}`);
  }

  params.set('per_page', String(perPage));
  if (page) params.set('page', String(page));

  return 'https://api.discogs.com/database/search?' + params.toString();
}

export async function discogsFetch(url){
  const token = els.token.value.trim() || localStorage.getItem(LS_KEY);
  if(!token){ throw new Error('NO_TOKEN'); }
  const res = await fetch(url, {
    headers: { 'Accept':'application/json', 'Authorization': `Discogs token=${token}` }
  });
  if(!res.ok){
    const txt = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

export async function getRandomAlbum(renderRelease){
  els.output.innerHTML = '';
  els.again.style.display = 'none';
  setStatus('Cerco album disponibili…', '');

  try {
    const perPage = 50;
    const firstUrl = buildQuery({ perPage });
    const first = await discogsFetch(firstUrl);
    const pages = Math.max(Number(first?.pagination?.pages || 0), 0);
    const results0 = first?.results || [];

    if (!pages || (!results0.length && pages === 0)) {
      setStatus('Nessun album trovato. Allarga o rimuovi qualche filtro.', 'warn');
      return;
    }

    const randomPage = pages === 1 ? 1 : (1 + Math.floor(Math.random() * pages));
    let pageResults = (randomPage === 1) ? results0 : null;

    if (!pageResults) {
      const pageUrl = buildQuery({ perPage, page: randomPage });
      try {
        const pageRes = await discogsFetch(pageUrl);
        pageResults = pageRes?.results || [];
      } catch {
        const fallbackUrl = buildQuery({ perPage, page: 1 });
        const fb = await discogsFetch(fallbackUrl);
        pageResults = fb?.results || [];
      }
    }

    if (!pageResults.length) { setStatus('Nessun risultato nella pagina estratta. Riprova.', 'warn'); return; }

    const r = pageResults[Math.floor(Math.random() * pageResults.length)];
    await renderRelease(r);

    setStatus('Pronto ✅', 'ok');
    els.again.style.display = '';
  } catch (err) {
    console.error(err);
    if (String(err.message).includes('NO_TOKEN')) setStatus('Inserisci il tuo Discogs User Token e riprova.', 'err');
    else if (String(err.message).includes('401')) setStatus('Autenticazione negata (401). Controlla il token.', 'err');
    else if (String(err.message).includes('403')) setStatus('Accesso proibito (403).', 'err');
    else if (String(err.message).includes('429')) setStatus('Rate limit (429). Attendi qualche secondo e riprova.', 'err');
    else if (String(err.message).includes('404')) setStatus('Pagina fuori range. Ho ristretto il range interno: riprova ora.', 'err');
    else setStatus('Errore: ' + err.message, 'err');
  }
}