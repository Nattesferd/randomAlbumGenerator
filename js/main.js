import { GENRES, STYLES_BY_GENRE } from './data.js';
import { createComboBox } from './combobox.js';
import { els, LS_KEY, setTokenStatus, setStatus, discogsFetch, getRandomAlbum } from './api.js';
import { renderRelease } from './ui.js';

// Combobox Genere
createComboBox({
  boxId:'genreBox',
  inputId:'genreCombo',
  listId:'genreList',
  placeholder:'Genere… (scrivi per filtrare)',
  source: GENRES,
  grouped: false,
  onSelect: (item)=>{ els.genre.value = item.value || ''; }
});

// Combobox Stile (raggruppata)
createComboBox({
  boxId:'styleBox',
  inputId:'styleCombo',
  listId:'styleList',
  placeholder:'Stile… (scrivi per filtrare)',
  source: STYLES_BY_GENRE,
  grouped: true,
  onSelect: (item)=>{ els.style.value = item.value || ''; }
});

// Token init
(function init(){
  const t = localStorage.getItem(LS_KEY);
  if(t){ els.token.value = t; setTokenStatus('Token caricato da localStorage.', 'ok'); }
  else { setTokenStatus('Nessun token salvato.', 'warn'); }
})();

els.saveToken.addEventListener('click', () => {
  const t = els.token.value.trim();
  if(!t){ setTokenStatus('Inserisci un token valido prima di salvare.', 'err'); return; }
  localStorage.setItem(LS_KEY, t);
  setTokenStatus('Token salvato localmente ✅', 'ok');
});
els.clearToken.addEventListener('click', () => {
  localStorage.removeItem(LS_KEY);
  els.token.value = '';
  setTokenStatus('Token rimosso dalla memoria locale.', 'warn');
});

// Azioni
els.go.addEventListener('click', () => getRandomAlbum((r)=>renderRelease(r, discogsFetch)));
els.again.addEventListener('click', () => getRandomAlbum((r)=>renderRelease(r, discogsFetch)));