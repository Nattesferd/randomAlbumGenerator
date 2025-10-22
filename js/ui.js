import { els } from './api.js';

function parseArtistAndTitle(title){
  if(!title) return { artist:'Sconosciuto', album:'Untitled' };
  const idx = title.indexOf(' - ');
  if(idx === -1) return { artist: 'Sconosciuto', album: title };
  return { artist: title.slice(0, idx), album: title.slice(idx+3) };
}
const uniq = arr => Array.from(new Set(arr || []));

export function openSpotifyPreferApp(appUrl, webUrl){
  let didHide = false;
  const onVis = () => { if (document.visibilityState === 'hidden') didHide = true; };
  document.addEventListener('visibilitychange', onVis, { once: true });
  window.location.href = appUrl;
  setTimeout(() => { document.removeEventListener('visibilitychange', onVis); if (!didHide) window.open(webUrl, '_blank', 'noopener'); }, 1000);
}

export async function renderRelease(r, detailsFetcher){
  const img = r.cover_image || '';
  const { artist, album } = parseArtistAndTitle(r.title || '');
  const year = r.year || '—';
  const country = r.country || '—';
  const genres = uniq(r.genre);
  const styles = uniq(r.style);
  const labels = uniq(r.label);
  const formats = uniq(r.format);
  const uri = r.uri || r.resource_url || '';
  const fullUri = uri?.startsWith('http') ? uri : `https://www.discogs.com${uri}`;

  let details = null;
  try{
    details = r.resource_url ? await detailsFetcher(r.resource_url) : null;
    if(details && details.main_release_url){
      details = await detailsFetcher(details.main_release_url);
    } else if(details && details.main_release){
      details = await detailsFetcher(`https://api.discogs.com/releases/${details.main_release}`);
    }
  }catch(e){ console.warn('Dettagli/tracklist Discogs falliti:', e); }

  let tracklistHtml = '';
  const tracklist = details?.tracklist || [];
  if(Array.isArray(tracklist) && tracklist.length){
    const items = tracklist
      .filter(t => ['track','index'].includes((t.type_||'').toLowerCase()) || !t.type_)
      .map((t,i) => {
        const title = (t.title || `Traccia ${i+1}`).trim();
        const time = (t.duration || '').trim();
        return `<li><span class="t-title">${title}</span>${time ? `<span class="t-time">${time}</span>` : ''}</li>`;
      }).join('');
    tracklistHtml = `<div class="tracks"><h3>Tracklist</h3><ol>${items}</ol></div>`;
  }

  let upc = '';
  try{
    const ids = details?.identifiers || [];
    const upcId = ids.find(x => /UPC|EAN/i.test(x?.type||''))?.value;
    if (upcId) upc = String(upcId).trim();
  }catch{}

  const terms = [];
  if (upc)            terms.push(`upc:${upc}`);
  if (album)          terms.push(`album:"${album}"`);
  if (artist)         terms.push(`artist:"${artist}"`);
  if (year && year!=='—') terms.push(`year:${year}`);
  if (labels?.length) terms.push(`label:"${labels[0]}"`);

  const q = terms.join(' ').trim() || `${album} ${artist}`;
  const spotifySearchWeb = `https://open.spotify.com/search/${encodeURIComponent(q)}`;
  const spotifySearchApp = `spotify:search:${encodeURIComponent(`${album} ${artist}`)}`;

  const spotifyLinkHtml =
    `<a class="link" href="${spotifySearchWeb}"
       onclick="window.openSpotifyPreferApp('${spotifySearchApp}','${spotifySearchWeb}'); return false;">
       <img class="ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg" alt="Spotify">
       Apri su Spotify
     </a>`;

  els.output.innerHTML = `
    <hr />
    <div class="result-grid">
      <div class="albumTop">
        <img class="cover" src="${img}" alt="Cover"
             onerror="this.src='';this.style.background='linear-gradient(135deg,#141a33,#0e1426)';" />
        <div class="footer-links">
          ${uri ? `
            <a href="${fullUri}" target="_blank" rel="noopener">
              <img class="ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discogs.svg" alt="Discogs">
              Apri su Discogs
            </a>` : ''}
          ${spotifyLinkHtml}
        </div>
      </div>

      <div class="albumDetails">
        <div class="artist">${artist}</div>
        <div class="title">${album}</div>

        <div class="chips">
          ${genres.map(g=>`<span class='chip'>${g}</span>`).join('')}
          ${styles.map(s=>`<span class='chip'>${s}</span>`).join('')}
        </div>

        <div class="meta">
          <div class="box"><span class="label">Anno</span><span class="value">${year}</span></div>
          <div class="box"><span class="label">Paese</span><span class="value">${country}</span></div>
          <div class="box"><span class="label">Etichetta</span><span class="value">${labels.join(', ') || '—'}</span></div>
          <div class="box"><span class="label">Formato</span><span class="value">${formats.join(', ') || 'Album'}</span></div>
        </div>

        ${tracklistHtml}
      </div>
    </div>
  `;

  // esponi helper per l'onclick inline
  window.openSpotifyPreferApp = openSpotifyPreferApp;
}