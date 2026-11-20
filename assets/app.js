/* =====================================================================
   SigOne CRM · Shell compartido (sidebar, topbar, iconos, sesión, toast)
   Cada página solo declara <body data-module="..." data-side="...">
   y este archivo dibuja el menú superior y el sidebar.
   ===================================================================== */

/* ---------- 1. Iconos: PrimeIcons (misma librería que SigOne Legal, clases "pi pi-...") ---------- */
const ICONS = {
  menu:'bars', bell:'bell', logout:'sign-out', search:'search', dashboard:'th-large', users:'users', user:'user',
  shield:'shield', package:'box', funnel:'filter', sliders:'sliders-h', chevron:'chevron-down', back:'arrow-left',
  message:'comment', phone:'phone', mail:'envelope', pin:'map-marker', building:'building', briefcase:'briefcase',
  pencil:'pencil', history:'history', plus:'plus', send:'send', trash:'trash', eye:'eye', eyeoff:'eye-slash',
  check:'check', ban:'ban', x:'times', calendar:'calendar', clock:'clock', wrench:'wrench', trend:'chart-line',
  download:'download', more:'ellipsis-v', sort:'sort-alt', expand:'window-maximize', shrink:'window-minimize',
  file:'file', repeat:'sync', cog:'cog', cart:'shopping-cart', target:'bullseye', swap:'arrow-right-arrow-left', inbox:'inbox', lock:'lock', upload:'upload', table:'table', star:'star', refresh:'refresh', filter2:'filter-slash'
};
/** Devuelve el <i class="pi pi-..."> de un icono por nombre. */
function icon(name, extra=''){ return `<i class="pi pi-${ICONS[name]||'circle'} ic ${extra}" aria-hidden="true"></i>`; }
/** Reemplaza todos los <i data-icon="nombre"> por su icono PrimeIcons (se puede volver a llamar tras render dinámico). */
function hydrateIcons(root=document){
  root.querySelectorAll('i[data-icon]').forEach(el=>{ el.outerHTML = icon(el.dataset.icon, el.className); });
}

/* ---------- 2. Marca: tile + "CRM" (igual que SPL: brand-mark 42px, borde naranja suave, icono pi) ---------- */
function logoMark(uid='a'){ return `<span class="brand-mark"><i class="pi pi-users" aria-hidden="true"></i></span>`; }
function logoFull(uid){ return `<div class="brand">${logoMark(uid)}<strong class="brand-text">CRM</strong></div>`; }

/* ---------- 3. Sesión (demo, solo sessionStorage) ---------- */
const SESSION_KEY = 'sigone_crm_user';
const DEFAULT_USER = { name:'Administrador sigcomt', role:'Administrador', mail:'admin@sigcomt.com' };
function getUser(){
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || DEFAULT_USER; } catch(e){ return DEFAULT_USER; }
}
function logout(){ try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){} location.href='login.html'; }

/* ---------- 4. Estructura de navegación ---------- */
/* Menú superior (módulos) + sidebar de cada módulo. `soon` = aún en construcción. */
const MODULES = [
  { id:'inicio', label:'Inicio', href:'inicio.html', perm:'inicio', side:[
      { id:'dashboard', label:'Dashboard General', icon:'dashboard', href:'inicio.html' } ] },
  { id:'clientes', label:'Conversaciones', href:'clientes.html', perm:'conversaciones', side:[
      { id:'gestion', label:'Conversaciones', icon:'message', href:'clientes.html' } ] },
  { id:'pedidos', label:'Pedidos', href:'pedidos.html', perm:'pedidos', side:[
      { id:'pedidos', label:'Pedidos', icon:'cart', href:'pedidos.html' } ] },
  { id:'cartera', label:'Cartera', href:'cartera.html', perm:'cartera', side:[
      { id:'cartera', label:'Cartera de clientes', icon:'users', href:'cartera.html' } ] },
  { id:'metas', label:'Metas', href:'metas.html', perm:'metas', side:[
      { id:'metas', label:'Metas de vendedores', icon:'target', href:'metas.html' },
      { id:'asignar-metas', label:'Asignar metas', icon:'pencil', href:'metas-asignar.html', needs:['crear','editar'] } ] },   // submódulo: solo roles que pueden crear/editar metas
  /* Seguridad y Mantenedores viven en configuracion.html (layout propio, como en SigOne Suite) */
  { id:'configuracion', label:'Configuración', href:'configuracion.html', config:true, side:[] }
];
/* Solo se muestran los módulos para los que el rol del usuario tiene permiso "ver" (store.js) */
const modVisible = m => typeof can!=='function' ? true : (m.config ? canConfig() : can(m.perm));

function renderShell(){
  const modId = document.body.dataset.module, sideId = document.body.dataset.side;
  const mod = MODULES.find(m=>m.id===modId) || MODULES[0];
  const u = typeof currentUser==='function' ? currentUser() : getUser(); u.role = u.role||'';

  // Sidebar
  document.getElementById('sidebar').innerHTML = `
    <div class="side-head">${logoFull('s')}</div>
    <nav>
      <div class="nav-label">${mod.label}</div>
      ${mod.side.filter(i=>!i.needs || typeof can!=='function' || i.needs.some(a=>can(mod.perm,a))).map(i=> i.soon
        ? `<a class="nav-item soon" title="En construcción">${icon(i.icon)}<span>${i.label}</span><em class="tag">Pronto</em></a>`
        : `<a class="nav-item ${i.id===sideId?'active':''}" href="${i.href}">${icon(i.icon)}<span>${i.label}</span></a>`).join('')}
    </nav>`;

  // Topbar: hamburguesa · módulos · campana · usuario · cerrar sesión (igual que SPL)
  document.getElementById('topbar').innerHTML = `
    <button class="icon-btn" id="btnMenu" aria-label="Menú">${icon('menu')}</button>
    <div class="top-tabs">${MODULES.filter(m=>!m.config&&modVisible(m)).map(m=>`<a class="top-tab ${m.id===mod.id?'active':''}" href="${m.href}">${m.label}</a>`).join('')}</div>
    <div class="top-right">
      <div class="ntf-wrap"><button class="icon-btn bell" aria-label="Notificaciones" aria-expanded="false" id="btnBell">${icon('bell')}<span class="cnt" id="ntfCnt"></span></button><div class="ntf" id="ntf" hidden></div></div>
      ${userMenuHTML(u, [ ...(canConfig()?[{href:'configuracion.html',icon:'cog',label:'Configuración'}]:[]) ])}
    </div>`;

  // Eventos
  bindUserMenu();
  document.getElementById('btnMenu').onclick = ()=>{
    // En móvil abre/cierra overlay; en escritorio colapsa a solo iconos
    if (innerWidth<=900) document.body.classList.toggle('side-open'); else document.body.classList.toggle('side-collapsed');
  };
  initNotifs();
}

/* ---------- Rango de fechas en un solo campo (calendario desplegable) ----------
   <div class="rp" data-from="fDesde" data-to="fHasta"></div>  →  crea dos <input type="hidden"> con esos ids (ISO yyyy-mm-dd).
   Al elegir el rango dispara "input" y "change" en ellos, así los filtros existentes siguen leyendo fDesde / fHasta. */
function initRangePicker(host){
  const idF=host.dataset.from, idT=host.dataset.to, pad=n=>String(n).padStart(2,'0');
  const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  host.classList.add('rp');
  host.innerHTML=`<i class="pi pi-calendar rp-ic"></i><input class="input rp-in" readonly placeholder="Seleccionar rango" autocomplete="off" aria-label="Rango de fechas"><button type="button" class="rp-x" hidden title="Limpiar rango" aria-label="Limpiar rango">×</button>
    <input type="hidden" id="${idF}"><input type="hidden" id="${idT}"><div class="rp-pop" hidden></div>`;
  const inp=host.querySelector('.rp-in'), x=host.querySelector('.rp-x'), pop=host.querySelector('.rp-pop'), hF=host.querySelector('#'+idF), hT=host.querySelector('#'+idT);
  const fmt=iso=>{ const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; };
  const t=new Date(); let vy=t.getFullYear(), vm=t.getMonth(), a='', b='', hover='';
  const show=()=>{ inp.value = a ? (b?`${fmt(a)} – ${fmt(b)}`:`${fmt(a)} – …`) : ''; x.hidden=!a; };
  // Se asignan los dos valores primero y luego se avisa: "rpchange" (una sola vez, en el contenedor) y input/change en los campos ocultos
  const emit=()=>{ hF.value=a; hT.value=b||a; [hF,hT].forEach(e=>{ e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }); host.dispatchEvent(new CustomEvent('rpchange',{bubbles:true})); };
  // Clases de cada día según el rango (y la vista previa al pasar el mouse). Se repintan sin reconstruir el calendario.
  const cls=iso=>{ const end=b||hover, lo=a&&end?(a<end?a:end):a, hi=a&&end?(a<end?end:a):a;
    return [iso===lo?'s':'', iso===hi?'e':'', lo&&iso>lo&&iso<hi?'in':''].join(' ').trim(); };
  const paint=()=>pop.querySelectorAll('[data-d]').forEach(c=>c.className=cls(c.dataset.d));
  const draw=()=>{
    const first=new Date(vy,vm,1), lead=(first.getDay()+6)%7, days=new Date(vy,vm+1,0).getDate();
    let cells='';
    for(let i=0;i<lead;i++) cells+='<button type="button" class="o" disabled></button>';
    for(let d=1;d<=days;d++){ const iso=`${vy}-${pad(vm+1)}-${pad(d)}`; cells+=`<button type="button" class="${cls(iso)}" data-d="${iso}">${d}</button>`; }
    pop.innerHTML=`<div class="rp-h"><button type="button" data-n="-1" aria-label="Mes anterior">‹</button><span>${MES[vm]} ${vy}</span><button type="button" data-n="1" aria-label="Mes siguiente">›</button></div>
      <div class="rp-g">${['L','M','M','J','V','S','D'].map(w=>`<span class="w">${w}</span>`).join('')}${cells}</div>
      <div class="rp-f"><span>${a&&!b?'Elige la fecha final':'Elige la fecha inicial y final'}</span><button type="button" class="link" data-clear>Limpiar</button></div>`;
    pop.querySelectorAll('[data-n]').forEach(n=>n.onclick=e=>{ e.stopPropagation(); vm+=+n.dataset.n; if(vm<0){vm=11;vy--;} if(vm>11){vm=0;vy++;} draw(); });
    pop.querySelectorAll('[data-d]').forEach(c=>{
      c.onmouseenter=()=>{ if(a&&!b){ hover=c.dataset.d; paint(); } };
      c.onclick=e=>{ e.stopPropagation(); const d=c.dataset.d;
        if(!a||b){ a=d; b=''; hover=''; show(); draw(); }
        else { if(d<a){ b=a; a=d; } else b=d; hover=''; show(); emit(); pop.hidden=true; } };
    });
    pop.querySelector('[data-clear]').onclick=e=>{ e.stopPropagation(); clear(); };
  };
  const clear=()=>{ a=b=hover=''; show(); emit(); if(!pop.hidden) draw(); };
  inp.onclick=e=>{ e.stopPropagation(); pop.hidden=!pop.hidden; if(!pop.hidden){ if(a){ const [y,m]=a.split('-'); vy=+y; vm=+m-1; } draw(); } };
  x.onclick=e=>{ e.stopPropagation(); clear(); };
  pop.onclick=e=>e.stopPropagation();
  document.addEventListener('click',()=>{ pop.hidden=true; });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') pop.hidden=true; });
  host.rpClear=()=>{ a=b=hover=''; show(); hF.value=hT.value=''; };           // limpiar desde fuera sin disparar eventos
  host.rpSync=()=>{ a=hF.value; b=hT.value; show(); };
  host.rpSet=(f,t2)=>{ a=f||''; b=t2||''; show(); hF.value=a; hT.value=b; };
}
// app.js se carga al final de la página: los campos ya existen, así que se activan de inmediato (y de nuevo al terminar de cargar por si falta alguno)
const _rpInit = () => document.querySelectorAll('.rp[data-from]').forEach(h=>{ if(!h.querySelector('.rp-in')) initRangePicker(h); });
_rpInit(); document.addEventListener('DOMContentLoaded',_rpInit);

/* ---------- Fecha (y hora) con el calendario del sistema ----------
   dpHTML(nombre, valor, {time}) → valor "yyyy-mm-dd" o "yyyy-mm-ddThh:mm" (24 h). El <input type="hidden" name="nombre"> guarda ese mismo formato.
   dpBind(contenedor) activa los campos. Reemplaza al selector nativo del navegador. */
function dpHTML(name, value='', {time=false}={}){
  return `<div class="dp" data-dp data-time="${time?1:0}"><input type="hidden" name="${name}" value="${esc(value)}"><i class="pi pi-calendar rp-ic"></i>
    <input class="input rp-in" readonly placeholder="${time?'dd/mm/aaaa hh:mm':'dd/mm/aaaa'}" autocomplete="off"><div class="rp-pop dp-pop" hidden></div></div>`;
}
function dpBind(root=document){
  const pad=n=>String(n).padStart(2,'0'), MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  root.querySelectorAll('[data-dp]').forEach(dp=>{
    const time=dp.dataset.time==='1', hid=dp.querySelector('input[type=hidden]'), inp=dp.querySelector('.rp-in'), pop=dp.querySelector('.rp-pop');
    let [d0,t0]=(hid.value||'').split('T'); let date=d0||'', hh=t0?+t0.slice(0,2):9, mm=t0?+t0.slice(3,5):0;
    const now=new Date(); let vy=date?+date.slice(0,4):now.getFullYear(), vm=date?+date.slice(5,7)-1:now.getMonth();
    const out=()=>{ if(!date) return ''; return time?`${date}T${pad(hh)}:${pad(mm)}`:date; };
    const show=()=>{ hid.value=out(); if(!date){ inp.value=''; return; } const [y,m,d]=date.split('-'); const h12=hh%12||12;
      inp.value = time ? `${d}/${m}/${y} ${pad(h12)}:${pad(mm)} ${hh>=12?'pm':'am'}` : `${d}/${m}/${y}`; };
    const draw=()=>{
      const lead=(new Date(vy,vm,1).getDay()+6)%7, days=new Date(vy,vm+1,0).getDate(), hoy=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
      let cells=''; for(let i=0;i<lead;i++) cells+='<button type="button" class="o" disabled></button>';
      for(let d=1;d<=days;d++){ const iso=`${vy}-${pad(vm+1)}-${pad(d)}`; cells+=`<button type="button" class="${iso===date?'s e':''}${iso===hoy?' today':''}" data-d="${iso}">${d}</button>`; }
      const h12=hh%12||12;
      pop.innerHTML=`<div class="rp-h"><button type="button" data-n="-1" aria-label="Mes anterior">‹</button><span>${MES[vm]} ${vy}</span><button type="button" data-n="1" aria-label="Mes siguiente">›</button></div>
        <div class="rp-g">${['L','M','M','J','V','S','D'].map(w=>`<span class="w">${w}</span>`).join('')}${cells}</div>
        ${time?`<div class="dp-t"><span>Hora</span><select class="select" data-h>${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i+1===h12?'selected':''}>${pad(i+1)}</option>`).join('')}</select>
          <b>:</b><select class="select" data-m>${Array.from({length:60},(_,i)=>`<option value="${i}" ${i===mm?'selected':''}>${pad(i)}</option>`).join('')}</select>
          <select class="select" data-ap><option ${hh<12?'selected':''}>am</option><option ${hh>=12?'selected':''}>pm</option></select></div>`:''}
        <div class="rp-f"><button type="button" class="link" data-today>Hoy</button><button type="button" class="link" data-clear>Limpiar</button>${time?'<button type="button" class="btn btn-primary btn-sm" data-ok>Aceptar</button>':''}</div>`;
      pop.querySelectorAll('[data-n]').forEach(n=>n.onclick=e=>{ e.stopPropagation(); vm+=+n.dataset.n; if(vm<0){vm=11;vy--;} if(vm>11){vm=0;vy++;} draw(); });
      pop.querySelectorAll('[data-d]').forEach(c=>c.onclick=e=>{ e.stopPropagation(); date=c.dataset.d; show(); if(time) draw(); else pop.hidden=true; });
      pop.querySelector('[data-today]').onclick=e=>{ e.stopPropagation(); date=hoy; vy=now.getFullYear(); vm=now.getMonth(); show(); if(time) draw(); else pop.hidden=true; };
      pop.querySelector('[data-clear]').onclick=e=>{ e.stopPropagation(); date=''; show(); draw(); };
      if(time){
        const setT=()=>{ const h=+pop.querySelector('[data-h]').value%12, pm=pop.querySelector('[data-ap]').value==='pm'; hh=h+(pm?12:0); mm=+pop.querySelector('[data-m]').value; if(!date) date=hoy; show(); };
        pop.querySelectorAll('select').forEach(s=>s.onchange=()=>{ setT(); draw(); });
        pop.querySelector('[data-ok]').onclick=e=>{ e.stopPropagation(); if(!date){ date=hoy; show(); } pop.hidden=true; };
      }
    };
    inp.onclick=e=>{ e.stopPropagation(); document.querySelectorAll('.dp .rp-pop').forEach(p=>{ if(p!==pop) p.hidden=true; });
      pop.hidden=!pop.hidden; if(pop.hidden) return; draw();
      const r=inp.getBoundingClientRect(), h=pop.offsetHeight, top=r.bottom+6+h>innerHeight ? Math.max(8,r.top-6-h) : r.bottom+6;
      Object.assign(pop.style,{ position:'fixed', left:Math.min(r.left,innerWidth-pop.offsetWidth-8)+'px', top:top+'px' }); };
    pop.onclick=e=>e.stopPropagation(); show();
  });
}
document.addEventListener('click',()=>document.querySelectorAll('.dp .rp-pop').forEach(p=>p.hidden=true));
window.addEventListener('scroll',e=>{ if(!(e.target.closest&&e.target.closest('.dp'))) document.querySelectorAll('.dp .rp-pop').forEach(p=>p.hidden=true); },true);

/* ---------- Combo desplegable con casillas (selección múltiple) ----------
   msHTML(nombre, opciones, seleccionados) → markup con un <input type="hidden" name="nombre"> que guarda "a, b, c".
   msBind(contenedor) activa todos los combos dentro de él. */
function msHTML(name, opts, selected=[], ph='Seleccionar…'){
  const S=new Set(selected), all=[...opts, ...selected.filter(v=>v&&!opts.includes(v))];
  return `<div class="ms" data-ms data-ph="${esc(ph)}"><input type="hidden" name="${name}" value="${esc([...S].join(', '))}">
    <button type="button" class="ms-btn" aria-haspopup="listbox"><span class="ms-t"></span>${icon('chevron')}</button>
    <div class="ms-pop" hidden>${all.map(o=>`<label class="ms-opt"><input type="checkbox" value="${esc(o)}" ${S.has(o)?'checked':''}><span>${esc(o)}</span></label>`).join('')||'<div style="padding:10px;color:#98A2B3">Sin opciones</div>'}</div></div>`;
}
function msBind(root=document){
  root.querySelectorAll('[data-ms]').forEach(ms=>{
    const hid=ms.querySelector('input[type=hidden]'), pop=ms.querySelector('.ms-pop'), t=ms.querySelector('.ms-t');
    const upd=()=>{ const v=[...pop.querySelectorAll('input:checked')].map(c=>c.value); hid.value=v.join(', ');
      t.textContent = !v.length ? ms.dataset.ph : v.length<=2 ? v.join(', ') : v.length+' seleccionados'; t.classList.toggle('ph',!v.length); };
    ms.querySelector('.ms-btn').onclick=e=>{ e.stopPropagation(); document.querySelectorAll('.ms.open').forEach(o=>{ if(o!==ms){ o.classList.remove('open'); o.querySelector('.ms-pop').hidden=true; } }); pop.hidden=!pop.hidden; ms.classList.toggle('open',!pop.hidden);
      if(!pop.hidden){ const r=e.currentTarget.getBoundingClientRect(); Object.assign(pop.style,{ left:r.left+'px', top:(r.bottom+4)+'px', width:r.width+'px', maxHeight:Math.max(120,Math.min(210,innerHeight-r.bottom-12))+'px' }); } };
    pop.onclick=e=>e.stopPropagation(); pop.querySelectorAll('input').forEach(c=>c.onchange=upd); upd();
  });
}
const _msClose=ev=>document.querySelectorAll('.ms.open').forEach(o=>{ if(ev&&ev.target&&o.contains(ev.target)) return; o.classList.remove('open'); o.querySelector('.ms-pop').hidden=true; });
document.addEventListener('click',()=>_msClose()); window.addEventListener('scroll',_msClose,true); window.addEventListener('resize',()=>_msClose());

/* ---------- Paginador único del sistema (mismo estilo y 5 filas por defecto en todas las tablas) ---------- */
const PAGE_SIZES = [5,10,20];
const PAGE_DEFAULT = 5;
/** Pinta el paginador en `el`. st = {page,size} (se corrige si la página queda fuera de rango). Devuelve el rango [desde,hasta) a mostrar. */
function renderPager(el, st, total, label, redraw){
  const pages = Math.max(1, Math.ceil(total/st.size)); if(st.page>pages) st.page=pages;
  const from = total?(st.page-1)*st.size+1:0, to = Math.min(st.page*st.size,total);
  el.innerHTML = `<div class="sz">Filas por página <select class="select">${PAGE_SIZES.map(n=>`<option ${n===st.size?'selected':''}>${n}</option>`).join('')}</select></div>
    <span class="info">${from}–${to} de ${total} ${label}</span>
    <div class="pg"><button data-p="${st.page-1}" ${st.page<=1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button class="${i+1===st.page?'on':''}" data-p="${i+1}">${i+1}</button>`).join('')}<button data-p="${st.page+1}" ${st.page>=pages?'disabled':''}>›</button></div>`;
  el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ st.page=+b.dataset.p; redraw(); });
  el.querySelector('select').onchange = e => { st.size=+e.target.value; st.page=1; redraw(); };
  return [(st.page-1)*st.size, st.page*st.size];
}

/* ---------- 4a. Menú de usuario: "Hola, nombre" despliega Configuración y Cerrar sesión ---------- */
function userMenuHTML(u, items=[]){
  return `<div class="user-menu" id="userMenu">
    <button type="button" class="user-trigger" id="btnUser" aria-haspopup="menu" aria-expanded="false">
      <div class="user-box"><small>Hola,</small><strong>${esc(u.name)}</strong><em>${esc(u.role||'')}${u.tipo?' · '+u.tipo:''}</em></div>${icon('chevron')}</button>
    <div class="user-pop" id="userPop" role="menu" hidden>
      ${items.map(i=>`<a href="${i.href}" role="menuitem">${icon(i.icon)}<span>${i.label}</span></a>`).join('')}
      ${items.length?'<div class="sep"></div>':''}
      <button type="button" class="out" id="btnLogout" role="menuitem">${icon('logout')}<span>Cerrar sesión</span></button>
    </div></div>`;
}
function bindUserMenu(){
  const m=document.getElementById('userMenu'), b=document.getElementById('btnUser'), p=document.getElementById('userPop');
  const set=o=>{ p.hidden=!o; m.classList.toggle('open',o); b.setAttribute('aria-expanded',String(o)); };
  b.onclick=e=>{ e.stopPropagation(); set(p.hidden); };
  p.onclick=e=>e.stopPropagation();
  document.addEventListener('click',()=>set(false));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') set(false); });
  document.getElementById('btnLogout').onclick=logout;
}

/* ---------- 4b. Notificaciones (nuevo pedido, cartera, metas) ---------- */
const NOTIFS = [
  { id:1, type:'pedido',  icon:'cart',   t:'Nuevo pedido PED-0142', d:'Distribuidora Andina · S/ 3,480 · registrado por Juan Perez', time:'Hace 5 min', unread:true },
  { id:2, type:'pedido',  icon:'cart',   t:'Nuevo pedido PED-0141', d:'Ferretería El Sol · S/ 1,250 · registrado por Carlos Ramírez', time:'Hace 40 min', unread:true },
  { id:3, type:'cartera', icon:'swap',   t:'Cartera actualizada', d:'3 clientes reasignados de Lucía Fernández a Carlos Ramírez', time:'Hace 2 h', unread:true },
  { id:4, type:'meta',    icon:'target', t:'Meta al 80 %', d:'Juan Perez superó el 80 % de su meta de octubre', time:'Ayer', unread:false },
  { id:5, type:'cartera', icon:'users',  t:'Cliente asignado', d:'Bazar San Isidro fue asignado a Lucía Fernández', time:'Ayer', unread:false }
];
let ntfTab='all';
function renderNotifs(){
  const list=NOTIFS.filter(n=>ntfTab==='all'||n.type===ntfTab), un=NOTIFS.filter(n=>n.unread).length;
  const c=document.getElementById('ntfCnt'); c.textContent=un; c.hidden=!un;
  document.getElementById('ntf').innerHTML=`<div class="ntf-h"><b>Notificaciones</b><button class="ntf-all" id="ntfRead">Marcar todo como leído</button></div>
    <div class="ntf-tabs">${[['all','Todas'],['pedido','Pedidos'],['cartera','Cartera'],['meta','Metas']].map(([k,l])=>`<button class="${ntfTab===k?'on':''}" data-nt="${k}">${l}</button>`).join('')}</div>
    <ul class="ntf-l">${list.length?list.map(n=>`<li class="ntf-i ${n.unread?'un':''} t-${n.type}" data-ni="${n.id}"><span class="ntf-ic">${icon(n.icon)}</span><div><b>${n.t}</b><p>${n.d}</p><small>${n.time}</small></div>${n.unread?'<i class="ntf-dot"></i>':''}</li>`).join(''):'<li class="ntf-empty">Sin notificaciones</li>'}</ul>`;
  document.getElementById('ntfRead').onclick=e=>{ e.stopPropagation(); NOTIFS.forEach(n=>n.unread=false); renderNotifs(); };
  document.querySelectorAll('[data-nt]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); ntfTab=b.dataset.nt; renderNotifs(); });
  document.querySelectorAll('[data-ni]').forEach(li=>li.onclick=e=>{ e.stopPropagation(); NOTIFS.find(n=>n.id==li.dataset.ni).unread=false; renderNotifs(); });
}
function initNotifs(){
  const b=document.getElementById('btnBell'), p=document.getElementById('ntf');
  renderNotifs();
  b.onclick=e=>{ e.stopPropagation(); p.hidden=!p.hidden; b.setAttribute('aria-expanded',String(!p.hidden)); };
  p.onclick=e=>e.stopPropagation();
  document.addEventListener('click',()=>{ p.hidden=true; b.setAttribute('aria-expanded','false'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') p.hidden=true; });
}

/* ---------- 5. Toast ---------- */
function toast(msg){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.innerHTML = icon('check') + `<span>${msg}</span>`;
  requestAnimationFrame(()=>t.classList.add('show'));
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600);
}

/** Escapa texto del usuario antes de inyectarlo como HTML. */
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.addEventListener('DOMContentLoaded',()=>{
  if (document.getElementById('sidebar')) renderShell();
  hydrateIcons();
});


/* =====================================================================
   Ventana de historial (componente compartido: Clientes, Mantenedores, Dashboard)
   histModal({title, sub, items:[{icon?, field, before, after, text, date, user}]}) → HTML del modal
   Cada botón con [data-close] debe cerrarse desde la página que lo usa.
   ===================================================================== */
const FIELD_ICON = { 'Calificación':'trend','Cargo':'briefcase','Vendedor':'user','Empresa':'building','Celular':'phone','Correo':'mail','Dirección':'pin','Etapa':'funnel','Próxima':'calendar','Horario':'clock','Canales':'message','Líneas':'package','Productos':'cart','Observaciones':'pencil','Rol':'shield','Estado':'check','Nombre':'user','Usuario':'plus','Forma':'cart','Tipo':'file','Número':'file','Cliente':'users' };
function fieldIcon(label=''){ const k=Object.keys(FIELD_ICON).find(k=>label.startsWith(k)); return FIELD_ICON[k]||'history'; }
function histModal({title='Historial de cambios', sub='', items=[]}){
  const ini = n => (n||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const last = items[0];
  const rows = items.map(h=>{
    const [d,...t] = (h.date||'').split(' ');
    const body = h.text!=null
      ? `<div class="hm-tx">${esc(h.text)}</div>`
      : `<div class="hm-v"><span class="hm-b">${esc(h.before)}</span>${icon('back','hm-arr')}<span class="hm-a">${esc(h.after)}</span></div>`;
    return `<li class="hm-i"><span class="hm-n">${icon(h.icon||fieldIcon(h.field||''))}</span>
      <div class="hm-c"><div class="hm-t"><b>${esc(h.field)}</b><time>${d}${t.length?' · '+t.join(' '):''}</time></div>${body}
        ${h.user?`<div class="hm-u"><span class="hm-av">${ini(h.user)}</span>${esc(h.user)}</div>`:''}</div></li>`;
  }).join('');
  return `<div class="hm-h"><span class="hm-tile">${icon('history')}</span><div class="hm-ti"><h3>${esc(title)}</h3>${sub?`<small>${esc(sub)}</small>`:''}</div>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="hm-b0">${items.length?`<div class="hm-sum"><span><b>${items.length}</b> ${items.length===1?'registro':'registros'}</span>${last&&last.date?`<span>Último: <b>${last.date.split(' ')[0]}</b>${last.user?' · '+esc(last.user):''}</span>`:''}</div><ol class="hm-l">${rows}</ol>`
      : `<div class="hm-empty">${icon('history')}<b>Sin cambios registrados</b><small>Cuando alguien edite esta sección, el cambio aparecerá aquí.</small></div>`}</div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>`;
}
