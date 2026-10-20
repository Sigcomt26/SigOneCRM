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
  check:'check', x:'times', calendar:'calendar', clock:'clock', wrench:'wrench', trend:'chart-line',
  download:'download', more:'ellipsis-v', sort:'sort-alt', expand:'window-maximize', shrink:'window-minimize',
  file:'file', repeat:'sync', cart:'shopping-cart'
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
const DEFAULT_USER = { name:'Administrador sigcomt', role:'Administrador' };
function getUser(){
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || DEFAULT_USER; } catch(e){ return DEFAULT_USER; }
}
function logout(){ try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){} location.href='login.html'; }

/* ---------- 4. Estructura de navegación ---------- */
/* Menú superior (módulos) + sidebar de cada módulo. `soon` = aún en construcción. */
const MODULES = [
  { id:'inicio', label:'Inicio', href:'inicio.html', side:[
      { id:'dashboard', label:'Dashboard General', icon:'dashboard', href:'inicio.html' } ] },
  { id:'clientes', label:'Clientes', href:'clientes.html', side:[
      { id:'gestion', label:'Gestión de Clientes', icon:'users', href:'clientes.html' } ] },
  { id:'mantenedores', label:'Mantenedores', href:'mantenedores.html', side:[
      { id:'usuarios', label:'Usuarios', icon:'user', href:'mantenedores.html' },
      { id:'roles', label:'Roles y permisos', icon:'shield', soon:true },
      { id:'productos', label:'Productos', icon:'package', soon:true },
      { id:'etapas', label:'Etapas de venta', icon:'funnel', soon:true } ] }
];

function renderShell(){
  const modId = document.body.dataset.module, sideId = document.body.dataset.side;
  const mod = MODULES.find(m=>m.id===modId) || MODULES[0];
  const u = getUser();

  // Sidebar
  document.getElementById('sidebar').innerHTML = `
    <div class="side-head">${logoFull('s')}</div>
    <nav>
      <div class="nav-label">${mod.label}</div>
      ${mod.side.map(i=> i.soon
        ? `<a class="nav-item soon" title="En construcción">${icon(i.icon)}<span>${i.label}</span><em class="tag">Pronto</em></a>`
        : `<a class="nav-item ${i.id===sideId?'active':''}" href="${i.href}">${icon(i.icon)}<span>${i.label}</span></a>`).join('')}
    </nav>`;

  // Topbar: hamburguesa · módulos · campana · usuario · cerrar sesión (igual que SPL)
  document.getElementById('topbar').innerHTML = `
    <button class="icon-btn" id="btnMenu" aria-label="Menú">${icon('menu')}</button>
    <div class="top-tabs">${MODULES.map(m=>`<a class="top-tab ${m.id===mod.id?'active':''}" href="${m.href}">${m.label}</a>`).join('')}</div>
    <div class="top-right">
      <button class="icon-btn bell" aria-label="Notificaciones" id="btnBell">${icon('bell')}<span class="cnt">5</span></button>
      <div class="user-box"><small>Hola,</small><strong>${u.name}</strong><em>${u.role}</em></div>
      <button class="btn-logout" id="btnLogout">${icon('logout')}<span>Cerrar sesión</span></button>
    </div>`;

  // Eventos
  document.getElementById('btnLogout').onclick = logout;
  document.getElementById('btnMenu').onclick = ()=>{
    // En móvil abre/cierra overlay; en escritorio colapsa a solo iconos
    if (innerWidth<=900) document.body.classList.toggle('side-open'); else document.body.classList.toggle('side-collapsed');
  };
  document.getElementById('btnBell').onclick = ()=> toast('Tienes 3 notificaciones nuevas');
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
