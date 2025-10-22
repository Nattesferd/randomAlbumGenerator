export function createComboBox({boxId, inputId, listId, placeholder, source, grouped, onSelect}){
  const box = document.getElementById(boxId);
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  input.placeholder = placeholder || input.placeholder;

  let flat = [];
  if(!grouped){
    flat = source.map(v => ({type:'item', label:v, value:v}));
  } else {
    flat = Object.keys(source).sort().flatMap(g => ([
      {type:'group', label:g},
      ...source[g].map(s => ({type:'item', label:s, value:s, group:g}))
    ]));
  }

  function render(items){
    list.innerHTML = '';
    if(items.length===0){ list.innerHTML = `<div class="cbx-empty">Nessun risultato</div>`; return; }
    items.forEach(it => {
      if(it.type==='group'){
        const d = document.createElement('div');
        d.className = 'cbx-group';
        d.textContent = it.label;
        list.appendChild(d);
      } else {
        const d = document.createElement('div');
        d.className = 'cbx-item';
        d.textContent = it.label;
        d.setAttribute('role','option');
        d.dataset.value = it.value;
        if(it.group) d.dataset.group = it.group;
        d.addEventListener('mousedown', (e)=>{ e.preventDefault(); choose(it); });
        list.appendChild(d);
      }
    });
  }

  function open(){ list.hidden = false; }
  function close(){ list.hidden = true; setActiveIndex(-1); }
  function isOpen(){ return !list.hidden; }

  let filtered = flat.slice();
  let activeIndex = -1;
  let selectedLabel = '';

  function setActiveIndex(i){
    activeIndex = i;
    Array.from(list.querySelectorAll('.cbx-item')).forEach((el,idx)=>{
      el.setAttribute('aria-selected', idx===activeIndex ? 'true' : 'false');
      if(idx===activeIndex){
        const r = el.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        if(r.top < lr.top) el.scrollIntoView(true);
        if(r.bottom > lr.bottom) el.scrollIntoView(false);
      }
    });
  }

  function filter(q){
    const s = (q||'').trim().toLowerCase();
    if(!s){ filtered = flat.slice(); render(filtered); setActiveIndex(Array.from(list.querySelectorAll('.cbx-item')).length ? 0 : -1); return; }

    if(!grouped){
      filtered = flat.filter(it => it.type==='item' && it.label.toLowerCase().includes(s));
    } else {
      const out = [];
      Object.keys(source).sort().forEach(g => {
        const matches = source[g].filter(label => (g + ' ' + label).toLowerCase().includes(s));
        if(matches.length){
          out.push({type:'group', label:g});
          matches.forEach(label => out.push({type:'item', label, value:label, group:g}));
        }
      });
      filtered = out;
    }
    render(filtered);
    setActiveIndex(Array.from(list.querySelectorAll('.cbx-item')).length ? 0 : -1);
  }

  function choose(item){
    input.value = item.label;
    selectedLabel = item.label;
    close();
    onSelect && onSelect(item);
  }

  // init
  render(filtered);

  // events
  input.addEventListener('focus', ()=>{ open(); filter(input.value||''); });
  input.addEventListener('input', ()=>{
    open(); filter(input.value);
    const typed = (input.value || '').trim();
    if (selectedLabel && typed !== selectedLabel) { selectedLabel = ''; onSelect && onSelect({value:'',label:''}); }
    if (!typed) { onSelect && onSelect({value:'',label:''}); }
  });
  input.addEventListener('keydown', (e)=>{
    const items = Array.from(list.querySelectorAll('.cbx-item'));
    if(e.key==='ArrowDown'){ e.preventDefault(); if(!isOpen()) open(); if(items.length){ setActiveIndex(Math.min(activeIndex+1, items.length-1)); } }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(items.length){ setActiveIndex(Math.max(activeIndex-1, 0)); } }
    else if(e.key==='Enter'){ if(isOpen() && items[activeIndex]){ e.preventDefault(); const el = items[activeIndex]; choose({type:'item', label:el.textContent, value:el.dataset.value, group:el.dataset.group}); } }
    else if(e.key==='Escape'){ close(); if ((input.value||'').trim() !== selectedLabel) { selectedLabel=''; onSelect && onSelect({value:'',label:''}); } }
  });
  document.addEventListener('click', (e)=>{ if(!box.contains(e.target)) close(); });
  input.addEventListener('click', ()=>{ if(isOpen()) return; open(); filter(input.value||''); });

  return { set(value){ input.value = value||''; filter(value||''); } };
}