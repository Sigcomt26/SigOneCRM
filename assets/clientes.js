/* =====================================================================
   SigOne CRM · Gestión de Clientes (datos de ejemplo, sin backend)
   Vista 1: lista + detalle.  Vista 2: conversación + panel (Crear pedido).
   ===================================================================== */

/* ---------- 1. Datos demo ---------- */
/* Clasificación de clientes (se muestra como filtro, franja de color y badge) */
const CATS = {          // c = color fuerte · t = fondo suave · d = texto oscuro
  'Sin calificar':  { color:'#8A92A6', tint:'#EEF0F5', dark:'#5A6379', badge:'gray'  },
  'Alto valor':     { color:'#16A34A', tint:'#E3F6EA', dark:'#15803D', badge:'green' },
  'Regular':        { color:'#3B6FE0', tint:'#E6EEFF', dark:'#2F5FD0', badge:'blue'  },
  'En seguimiento': { color:'#E39B0B', tint:'#FFF1CC', dark:'#A16207', badge:'amber' }
};
const catVars = c => `--c:${CATS[c.cat].color};--t:${CATS[c.cat].tint};--d:${CATS[c.cat].dark}`;
const catPill = c => `<span class="cat-pill" style="${catVars(c)}">${c.cat}</span>`;
const base = { vendedor:'Juan Perez', canales:'Conversaciones de whatsapp', horario:'En la mañana a partir de las 08:00 am', lineas:'Productos navideños', interes:'Pesebres, luces de navidad', obs:'-' };
const CLIENTS = [
  { id:1, nombre:'Cliente 1', cat:'Alto valor', stage:'Por confirmar',  time:'Ayer, 05:00 pm', empresa:'Sigcomt S.A.C.',        cargo:'Administrador',   cel:'999383211', mail:'bjimenez@sigcomt.com', dir:'Lima',     ult:'19/10/2026 10:50 am', prox:'29/10/2026 10:50 am', prim:'01/07/2026', ventas:20, antig:'01', ...base },
  { id:2, nombre:'Cliente 2', cat:'Regular', stage:'En seguimiento', time:'Ayer, 05:00 pm', empresa:'Distribuidora Andina',  cargo:'Compras',         cel:'987654321', mail:'compras@andina.pe',    dir:'Arequipa', ult:'18/10/2026 04:20 pm', prox:'25/10/2026 09:00 am', prim:'12/03/2026', ventas:8,  antig:'01', ...base, lineas:'Decoración', interes:'Árboles navideños' },
  { id:3, nombre:'Cliente 3', cat:'Sin calificar', stage:'Nuevo',          time:'Ayer, 05:00 pm', empresa:'Bazar Los Olivos',      cargo:'Gerente',         cel:'955112233', mail:'gerencia@bazarlo.pe',  dir:'Lima',     ult:'17/10/2026 11:10 am', prox:'22/10/2026 03:00 pm', prim:'15/10/2026', ventas:0,  antig:'00', ...base, horario:'Por la tarde, de 02:00 a 06:00 pm', interes:'Luces de navidad' },
  { id:4, nombre:'Cliente 4', cat:'Alto valor', stage:'Cerrado',        time:'Ayer, 05:00 pm', empresa:'Comercial Pacífico',    cargo:'Jefe de compras', cel:'944778899', mail:'jcompras@pacifico.pe', dir:'Trujillo', ult:'12/10/2026 09:30 am', prox:'—',                  prim:'20/01/2025', ventas:34, antig:'02', ...base, lineas:'Productos navideños, hogar', interes:'Esferas, guirnaldas', obs:'Prefiere factura electrónica' },
  { id:5, nombre:'Cliente 5', cat:'En seguimiento', stage:'En seguimiento', time:'Ayer, 05:00 pm', empresa:'Regalos & Más E.I.R.L.',cargo:'Propietaria',     cel:'933445566', mail:'ventas@regalosymas.pe',dir:'Cusco',    ult:'16/10/2026 06:45 pm', prox:'27/10/2026 10:00 am', prim:'03/05/2026', ventas:5,  antig:'01', ...base, canales:'Llamadas y whatsapp', interes:'Pesebres' }
];
const CATALOG = [
  { n:'Pesebre familiar',     d:'Producto en caja', p:85 },
  { n:'Luces navideñas x100', d:'Producto en caja', p:20 },
  { n:'Árbol navideño 1.8 m', d:'Producto en caja', p:150 },
  { n:'Pack de esferas x24',  d:'Producto en caja', p:35 }
];
/* Estado mutable por cliente: chat, carrito y pedidos (se genera al abrir la conversación) */
const state = {};
function stateOf(c){
  if(!state[c.id]) state[c.id] = {
    msgs:[
      { t:'c',   d:'10/10/2026 08:05 am', x:'Buen día, necesito cotizar pesebres y luces de navidad para mi tienda.' },
      { t:'v',   d:'10/10/2026 08:07 am', x:'Buen día, claro, ¿qué cantidad y medidas necesita?' },
      { t:'c',   d:'10/10/2026 08:08 am', x:'Necesito 10 cajas de luces. Pago por transferencia y factura electrónica, por favor.' },
      { t:'v',   d:'10/10/2026 08:11 am', x:'¡Perfecto! Le genero el pedido ahora mismo.' },
      { t:'sys' },
      { t:'v',   d:'10/10/2026 08:15 am', x:'Le ha llegado un correo con el detalle de su pedido.' }
    ],
    cart:[ { n:'Luces navideñas x100', d:'Producto en caja', p:20, q:10 } ],
    orders:[
      { id:'PED-0013', f:'10/10/2026', est:'Despachado', pago:'Contado · Transferencia', comp:'Factura electrónica', items:[{n:'Luces navideñas x100',q:10,p:20}] },
      { id:'PED-0012', f:'18/09/2026', est:'Entregado',  pago:'Contado · Yape / Plin', comp:'Boleta electrónica', items:[{n:'Pesebre familiar',q:2,p:85},{n:'Pack de esferas x24',q:3,p:35}] },
      { id:'PED-0007', f:'02/09/2026', est:'Entregado',  pago:'Crédito 15 días · Transferencia', comp:'Factura electrónica', items:[{n:'Árbol navideño 1.8 m',q:2,p:150},{n:'Luces navideñas x100',q:2,p:20}] },
      { id:'PED-0003', f:'12/08/2026', est:'Anulado',    pago:'Contado · Efectivo', comp:'Boleta electrónica', items:[{n:'Pack de esferas x24',q:4,p:35}] }
    ]
  };
  return state[c.id];
}

/* ---------- 2. Utilidades ---------- */
const $ = id => document.getElementById(id);
const money = n => 's/ ' + n.toFixed(2);
const initials = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const AV = ['', 'alt1','alt2','alt3','alt4'];
const avatar = (c,sz='') => `<div class="avatar ${AV[c.id%5]}" ${sz}>${initials(c.nombre)}</div>`;
function nowStr(){                       // dd/mm/yyyy hh:mm am/pm
  const d=new Date(), p=n=>String(n).padStart(2,'0'); let h=d.getHours(); const ap=h>=12?'pm':'am'; h=h%12||12;
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(h)}:${p(d.getMinutes())} ${ap}`;
}
const kv = (ic,l,v) => `<div class="kv"><span>${icon(ic)}${l}</span><b>${esc(v)}</b></div>`;

let filter = 'Todos', query = '', current = CLIENTS[0], tab = 'pedido';
let expand = '';                       // '' | 'chat' | 'panel' (ventana expandida)
let hF = 'Todos', hQ = '', hOpen = null; // filtros del historial y pedido abierto
const ORD_STEPS = ['Pendiente','Confirmado','Despachado','Entregado'];
const ORD_BADGE = { Pendiente:'orange', Confirmado:'blue', Despachado:'amber', Entregado:'green', Anulado:'red' };
const ordTotal = o => o.items.reduce((a,i)=>a+i.p*i.q,0);

/* ---------- 3. Vista 1: filtros, lista y detalle ---------- */
function renderChips(){
  $('chips').innerHTML = ['Todos', ...Object.keys(CATS)].map(s=>`<button class="chip ${s==='Todos'?'all':'cat'} ${s===filter?'on':''}" data-f="${s}" ${s==='Todos'?'':`style="--c:${CATS[s].color};--t:${CATS[s].tint};--d:${CATS[s].dark}"`}>${s} <small>${s==='Todos'?CLIENTS.length:CLIENTS.filter(c=>c.cat===s).length}</small></button>`).join('');
  $('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>{ filter=b.dataset.f; renderChips(); renderList(); });
}
function renderList(){
  const list = CLIENTS.filter(c => (filter==='Todos'||c.cat===filter) && (c.nombre+c.empresa).toLowerCase().includes(query.toLowerCase()));
  $('clList').innerHTML = list.length ? list.map(c=>`
    <button class="cl-item ${c.id===current.id?'active':''}" data-id="${c.id}" style="--stage:${CATS[c.cat].color}">
      ${avatar(c)}
      <div class="info"><div class="row1"><b>${c.nombre}</b><time>${c.time}</time></div><p>Último mensaje de prueba...</p><span class="cat-pill sm" style="${catVars(c)}">${c.cat}</span></div>
    </button>`).join('') : `<div class="empty">${icon('search')}<div>Sin resultados</div></div>`;
  $('clList').querySelectorAll('.cl-item').forEach(b=>b.onclick=()=>{ current=CLIENTS.find(c=>c.id==b.dataset.id); renderList(); renderDetail(); });
  hydrateIcons($('clList'));
}
/* Bloques reutilizados en el detalle y en las pestañas de la conversación */
const blkInfo = c => kv('building','Empresa',c.empresa)+kv('briefcase','Cargo',c.cargo)+kv('phone','Celular',c.cel)+kv('mail','Correo',c.mail)+kv('pin','Dirección',c.dir);
const blkSeg  = c => kv('clock','Última interacción',c.ult)+kv('calendar','Próxima interacción',c.prox)+kv('funnel','Etapa de venta',c.stage)+kv('user','Responsable',c.vendedor)+kv('calendar','Primera interacción',c.prim);
const blkPref = c => kv('clock','Horario de atención',c.horario)+kv('message','Canales de atención',c.canales)+kv('package','Líneas de preferencia',c.lineas)+kv('cart','Productos de interés',c.interes)+kv('pencil','Observaciones relevantes',c.obs);

function renderDetail(){
  const c=current;
  $('clDetail').innerHTML = `
    <div class="d-head" style="${catVars(c)}">
      ${avatar(c)}
      <div><h2>${c.nombre}</h2>${catPill(c)}</div>
      <button class="btn btn-primary sp" id="btnOpen"><i data-icon="message"></i>Abrir conversación</button>
    </div>
    <div class="d-body"><div class="d-grid">
      <div class="d-col">
        <div class="box"><div class="box-h"><h3>Información detallada</h3><div class="acts"><a class="link" data-hist="info"><i data-icon="history"></i>Historial</a><a class="link" data-edit="info"><i data-icon="pencil"></i>Editar</a></div></div>
          <div class="box-b">${kv('user','Vendedor asignado',c.vendedor)}${blkInfo(c)}</div></div>
        <div class="box"><div class="box-h"><h3>Seguimiento</h3><div class="acts"><a class="link" data-hist="seg"><i data-icon="history"></i>Historial</a><a class="link" data-edit="seg"><i data-icon="pencil"></i>Editar</a></div></div><div class="box-b">${blkSeg(c)}</div></div>
      </div>
      <div class="d-col">
        <div class="stats">
          <div class="stat"><div class="n">${String(c.ventas).padStart(2,'0')}</div><small>Ventas<br>realizadas</small></div>
          <div class="stat"><div class="n">${c.antig}</div><small>año de<br>antigüedad</small></div>
        </div>
        <div class="box"><div class="box-h"><h3>Preferencias</h3><div class="acts"><a class="link" data-hist="pref"><i data-icon="history"></i>Historial</a><a class="link" data-edit="pref"><i data-icon="pencil"></i>Editar</a></div></div>
          <div class="box-b">${blkPref(c)}</div></div>
      </div>
    </div></div>`;
  hydrateIcons($('clDetail'));
  $('btnOpen').onclick = openChat;
  $('clDetail').querySelectorAll('[data-hist]').forEach(a=>a.onclick=()=>openHistory(a.dataset.hist));
  $('clDetail').querySelectorAll('[data-edit]').forEach(a=>a.onclick=()=>openEdit(a.dataset.edit));
}

/* ---------- 3b. Editar cliente + Historial de cambios ---------- */
const SELLERS = ['Juan Perez','Carlos Ramírez','María Torres'];
const ETAPAS  = ['Nuevo','En seguimiento','Por confirmar','Cerrado'];
/* Campos editables por sección: [clave, etiqueta, tipo, opciones] */
const SECTIONS = {
  info:{ title:'Información detallada', f:[['vendedor','Vendedor asignado','select',SELLERS],['empresa','Empresa'],['cargo','Cargo'],['cel','Celular','tel'],['mail','Correo','email'],['dir','Dirección'],['cat','Calificación del cliente','select',Object.keys(CATS)]] },
  seg: { title:'Seguimiento',           f:[['stage','Etapa de venta','select',ETAPAS],['prox','Próxima interacción']] },
  pref:{ title:'Preferencias',          f:[['horario','Horario de atención'],['canales','Canales de atención'],['lineas','Líneas de preferencia'],['interes','Productos de interés'],['obs','Observaciones relevantes','textarea']] }
};
const LABEL = {}; Object.values(SECTIONS).forEach(s=>s.f.forEach(([k,l])=>LABEL[k]=l));
/* Historial por cliente: se siembra con cambios de ejemplo (más reciente primero) */
function histOf(c){
  if(!c.hist){ c.hist=[
    { sec:'info', campo:'Calificación del cliente', antes:'Sin calificar', desp:c.cat, f:'12/10/2026 09:15 am', u:'María Torres' },
    { sec:'seg',  campo:'Etapa de venta', antes:'Nuevo', desp:c.stage, f:'05/10/2026 04:40 pm', u:'Juan Perez' },
    { sec:'pref', campo:'Canales de atención', antes:'Llamadas', desp:c.canales, f:'28/09/2026 11:05 am', u:'Juan Perez' },
    { sec:'info', campo:'Cargo', antes:'Asistente de compras', desp:c.cargo, f:'05/08/2026 10:20 am', u:'Administrador sigcomt' }
  ].filter(h=>h.antes!==h.desp); }
  return c.hist;
}
function openModal(html){ $('cmBox').innerHTML=html; $('cmodal').classList.add('open'); hydrateIcons($('cmBox')); }
function closeModal(){ $('cmodal').classList.remove('open'); }

function openEdit(sec){
  const c=current, S=SECTIONS[sec];
  openModal(`<form id="editForm" novalidate>
    <div class="modal-h"><h3>Editar · ${S.title}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar"><i data-icon="x"></i></button></div>
    <div class="modal-b">${S.f.map(([k,l,t,o])=>`<div class="field"><label>${l}</label>${
      t==='select' ? `<select class="select" name="${k}">${o.map(v=>`<option ${v===c[k]?'selected':''}>${v}</option>`).join('')}</select>`
      : t==='textarea' ? `<textarea class="textarea" name="${k}" rows="3">${esc(c[k]==='-'?'':c[k])}</textarea>`
      : `<input class="input" name="${k}" type="${t||'text'}" value="${esc(c[k])}">`}</div>`).join('')}
      <div class="login-err" id="eErr" hidden></div></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar cambios</button></div></form>`);
  $('cmBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  $('editForm').onsubmit = e => {
    e.preventDefault();
    const d=Object.fromEntries(new FormData($('editForm')).entries()), err=m=>{ $('eErr').textContent=m; $('eErr').hidden=false; };
    // Validaciones básicas
    if(sec==='info'){
      if(!d.empresa.trim()) return err('La empresa es obligatoria.');
      if(!/^\d{9}$/.test(d.cel.trim())) return err('El celular debe tener 9 dígitos.');
      if(!/^\S+@\S+\.\S+$/.test(d.mail.trim())) return err('Ingresa un correo válido.');
    }
    // Diferencias → entradas de historial
    const h=histOf(c); let n=0;
    S.f.forEach(([k])=>{ const nv=(d[k]||'').trim()||'-', ov=c[k]; if(nv!==ov){ h.unshift({ sec, campo:LABEL[k], antes:ov||'-', desp:nv, f:nowStr(), u:getUser().name }); c[k]=nv; n++; } });
    closeModal();
    if(!n) return toast('No hay cambios para guardar');
    renderChips(); renderList(); renderDetail(); if(!$('viewChat').hidden) renderChat();
    toast(n+(n>1?' cambios guardados':' cambio guardado'));
  };
}

let hSec='all';
function openHistory(sec='all'){
  hSec=sec; const c=current;
  const draw=()=>{
    const list=histOf(c).filter(h=>hSec==='all'||h.sec===hSec);
    $('cmBox').innerHTML=histModal({ title:'Historial · '+(hSec==='all'?'Todo':SECTIONS[hSec].title), sub:c.nombre,
      items:list.map(h=>({ field:h.campo, before:h.antes, after:h.desp, date:h.f, user:h.u })) });
    $('cmBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  };
  $('cmodal').classList.add('open'); draw();
}

/* ---------- 4. Vista 2: conversación ---------- */
function openChat(){ $('viewList').hidden=true; $('viewChat').hidden=false; tab='pedido'; renderChat(); window.scrollTo(0,0); }
function closeChat(){ expand=''; $('viewChat').hidden=true; $('viewList').hidden=false; }

function renderChat(){
  const c=current, s=stateOf(c);
  $('chatTop').innerHTML = `${avatar(c)}<h2>${c.nombre}</h2>${catPill(c)}
    <div class="sp"><button class="btn btn-ghost" id="btnBack"><i data-icon="back"></i>Atrás</button></div>`;
  const T=[['info','Información detallada'],['pref','Preferencias'],['seg','Seguimiento'],['pedido','Crear pedido']];
  $('tabs').innerHTML = T.map(([k,l])=>`<button class="tab ${tab===k?'on':''}" data-t="${k}">${l}</button>`).join('')
    + `<button class="tab right ${tab==='hist'?'on':''}" data-t="hist"><i data-icon="history"></i> Historial de pedidos</button>`;
  $('tabs').querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ tab=b.dataset.t; renderChat(); });
  $('btnBack').onclick = closeChat;
  // Ventana expandida: el chat o el panel ocupan todo el ancho
  $('chatGrid').className = 'chat-grid' + (expand ? ' exp-'+expand : '');
  $('btnExpChat').innerHTML = icon(expand==='chat' ? 'shrink' : 'expand');
  $('btnExpChat').onclick = () => { expand = expand==='chat' ? '' : 'chat'; renderChat(); };
  renderMsgs(); renderPanel(); hydrateIcons($('viewChat'));
}
function renderMsgs(){
  const s=stateOf(current);
  $('msgs').innerHTML = s.msgs.map(m=> m.t==='sys'
    ? `<div class="sys"><span class="ok">${icon('check')}Pedido creado</span><a class="link" data-view>Ver pedido</a></div>`
    : `<div class="msg ${m.t}"><div class="who"><span>${m.t==='c'?esc(current.nombre):'Vendedor '+esc(current.vendedor)}</span><span>${m.d}</span></div>${esc(m.x)}</div>`).join('');
  $('msgs').querySelectorAll('[data-view]').forEach(a=>a.onclick=()=>{ tab='hist'; hOpen=stateOf(current).orders[0].id; renderChat(); });
  $('msgs').scrollTop = $('msgs').scrollHeight;
}
function sendMsg(){
  const t=$('msgIn').value.trim(); if(!t) return;
  const s=stateOf(current); s.msgs.push({t:'v', d:nowStr(), x:t}); $('msgIn').value=''; renderMsgs();
  // Respuesta simulada del cliente para la presentación
  setTimeout(()=>{ s.msgs.push({t:'c', d:nowStr(), x:'Gracias, quedo atento.'}); if(!$('viewChat').hidden && stateOf(current)===s) renderMsgs(); }, 1400);
}

/* ---------- 5. Panel derecho (según pestaña) ---------- */
function renderPanel(){
  const c=current, s=stateOf(c), p=$('panel');
  if(tab==='info') p.innerHTML=`<div class="box-h"><h3>Información detallada</h3></div><div class="box-b">${kv('user','Vendedor asignado',c.vendedor)}${blkInfo(c)}</div>`;
  else if(tab==='pref') p.innerHTML=`<div class="box-h"><h3>Preferencias</h3></div><div class="box-b">${blkPref(c)}</div>`;
  else if(tab==='seg')  p.innerHTML=`<div class="box-h"><h3>Seguimiento</h3></div><div class="box-b">${blkSeg(c)}</div>`;
  else if(tab==='hist') renderHist(p, s);
  else renderOrder(p, s);
  // Cabecera común con botón expandir/contraer (como los íconos del Balsamiq)
  const titles={info:'Información detallada',pref:'Preferencias',seg:'Seguimiento',pedido:'Crear pedido',hist:'Historial de pedidos'};
  p.insertAdjacentHTML('afterbegin',`<div class="pane-h"><b>${titles[tab]}</b><button class="icon-btn" id="btnExpPanel" title="${expand==='panel'?'Contraer':'Expandir'}">${icon(expand==='panel'?'shrink':'expand')}</button></div>`);
  $('btnExpPanel').onclick = () => { expand = expand==='panel' ? '' : 'panel'; renderChat(); };
  hydrateIcons(p);
}
/* ---------- Historial de pedidos: KPIs, filtros, tarjetas desplegables, repetir pedido ---------- */
function renderHist(p, s){
  const all = s.orders, valid = all.filter(o=>o.est!=='Anulado');
  const sum = valid.reduce((a,o)=>a+ordTotal(o),0);
  const list = all.filter(o => (hF==='Todos'||o.est===hF) && o.id.toLowerCase().includes(hQ.toLowerCase()));
  p.innerHTML = `
    <div class="h-kpis">
      <div class="h-kpi"><small>Pedidos</small><b>${valid.length}</b></div>
      <div class="h-kpi"><small>Total comprado</small><b>${money(sum)}</b></div>
      <div class="h-kpi"><small>Ticket promedio</small><b>${money(valid.length?sum/valid.length:0)}</b></div>
    </div>
    <div class="h-tools">
      <div class="search"><i data-icon="search"></i><input class="input" id="hQ" placeholder="Buscar por N.º de pedido" value="${esc(hQ)}"></div>
      <div class="h-chips">${['Todos',...Object.keys(ORD_BADGE)].map(e=>`<button class="chip ${hF===e?'on':''}" data-hf="${e}">${e}</button>`).join('')}</div>
    </div>
    <div class="ord-list">${list.length ? list.map(o=>{
      const t=ordTotal(o), open=hOpen===o.id, cur=ORD_STEPS.indexOf(o.est);
      return `<div class="ord ${open?'open':''}">
        <button class="ord-h" data-o="${o.id}"><div><span class="id">${o.id}</span><small>${o.f}</small></div><span class="badge ${ORD_BADGE[o.est]}">${o.est}</span><div class="tot">${money(t)}</div>${icon('chevron','chev')}</button>
        ${open?`<div class="ord-b">
          ${o.est==='Anulado'?'':`<div class="steps">${ORD_STEPS.map((x,i)=>`<div class="step ${i<cur||cur===ORD_STEPS.length-1?'done':i===cur?'cur':''}">${x}</div>`).join('')}</div>`}
          <table><thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>${o.items.map(i=>`<tr><td>${i.n}</td><td>${i.q} × ${money(i.p)}</td><td>${money(i.p*i.q)}</td></tr>`).join('')}</tbody></table>
          <div class="ord-meta"><span>${icon('cart')} ${o.pago}</span><span>${icon('file')} ${o.comp}</span></div>
          <div class="ord-act"><button class="btn btn-primary btn-sm" data-rep="${o.id}">${icon('repeat')}Repetir pedido</button><button class="btn btn-ghost btn-sm" data-pdf="${o.id}">${icon('file')}Comprobante</button></div>
        </div>`:''}</div>`; }).join('') : `<div class="empty">${icon('search')}<div>Sin pedidos para este filtro</div></div>`}</div>`;
  $('hQ').oninput = e => { hQ=e.target.value; renderPanel(); $('hQ').focus(); };
  p.querySelectorAll('[data-hf]').forEach(b=>b.onclick=()=>{ hF=b.dataset.hf; renderPanel(); });
  p.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ hOpen = hOpen===b.dataset.o ? null : b.dataset.o; renderPanel(); });
  p.querySelectorAll('[data-pdf]').forEach(b=>b.onclick=()=>toast('Comprobante '+b.dataset.pdf+' (demo)'));
  // Repetir pedido: copia los productos al carrito y abre "Crear pedido"
  p.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{
    const o=all.find(x=>x.id===b.dataset.rep); s.cart=o.items.map(i=>({n:i.n,d:'Producto en caja',p:i.p,q:i.q}));
    tab='pedido'; renderChat(); toast('Productos de '+o.id+' cargados al pedido');
  });
}
function cartTotal(s){ return s.cart.reduce((a,i)=>a+i.p*i.q,0); }
function renderOrder(p, s){
  p.innerHTML = `
    <div class="total-row"><span>Total de la venta:</span><b id="totTop">${money(cartTotal(s))}</b></div>
    <details class="sec" open><summary>Datos principales ${icon('chevron')}</summary><div class="sec-b">
      <div class="field"><label>Forma de pago</label><select class="select"><option>Contado</option><option>Crédito 15 días</option><option>Crédito 30 días</option></select></div>
      <div class="field"><label>Método de pago</label><select class="select"><option>Transferencia</option><option>Efectivo</option><option>Yape / Plin</option><option>Tarjeta</option></select></div>
      <div class="field"><label>Comprobante de pago</label><select class="select"><option>Factura electrónica</option><option>Boleta electrónica</option></select></div>
      <div class="field"><label>Observaciones</label><textarea class="textarea" rows="2" placeholder="Opcional"></textarea></div>
    </div></details>
    <details class="sec"><summary>Dirección de entrega ${icon('chevron')}</summary><div class="sec-b"><input class="input" value="${esc(current.dir)}"></div></details>
    <details class="sec" open><summary>Productos ${icon('chevron')}</summary><div class="sec-b" id="prods"></div></details>
    <div class="panel-f">
      <div class="sum"><span>Total:</span><span id="totBot">${money(cartTotal(s))}</span></div>
      <button class="btn btn-primary" id="btnOrder" style="padding:14px"><i data-icon="check"></i>Crear pedido</button>
    </div>`;
  drawProducts(s);
  $('btnOrder').onclick = () => {
    if(!s.cart.length) return toast('Añade al menos un producto');
    const total=cartTotal(s);
    const sel=p.querySelectorAll('select');
    s.orders.unshift({ id:'PED-'+String(14+s.orders.length-4).padStart(4,'0'), f:nowStr().slice(0,10), est:'Pendiente', pago:sel[0].value+' · '+sel[1].value, comp:sel[2].value, items:s.cart.map(i=>({n:i.n,q:i.q,p:i.p})) });
    hOpen=s.orders[0].id;
    s.msgs.push({t:'sys'}); s.cart=[]; toast('Pedido creado correctamente'); renderChat();
  };
}
/* Lista de productos del carrito + fila para añadir */
function drawProducts(s){
  const box=$('prods');
  box.innerHTML = s.cart.map((i,ix)=>`
    <div class="prod"><div class="pi"><b>${i.n}</b><small>${i.d} · ${money(i.p)}</small></div>
      <input class="input" type="number" min="1" value="${i.q}" data-q="${ix}">
      <button class="tr" data-del="${ix}" aria-label="Quitar">${icon('trash')}</button></div>`).join('')
    + `<button class="btn btn-ghost" id="btnAdd"><i data-icon="plus"></i>Añadir producto</button>`;
  hydrateIcons(box);
  const refresh=()=>{ $('totTop').textContent=$('totBot').textContent=money(cartTotal(s)); };
  box.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{ s.cart[el.dataset.q].q=Math.max(1,+el.value||1); refresh(); });
  box.querySelectorAll('[data-del]').forEach(el=>el.onclick=()=>{ s.cart.splice(el.dataset.del,1); drawProducts(s); refresh(); });
  $('btnAdd').onclick=()=>{
    $('btnAdd').outerHTML = `<div class="addrow"><select class="select" id="selP">${CATALOG.map((x,i)=>`<option value="${i}">${x.n} · ${money(x.p)}</option>`).join('')}</select>
      <input class="input" id="qtyP" type="number" min="1" value="1"><button class="btn btn-primary btn-sm" id="okP">Agregar</button></div>`;
    $('okP').onclick=()=>{ const it=CATALOG[$('selP').value]; s.cart.push({...it,q:Math.max(1,+$('qtyP').value||1)}); drawProducts(s); refresh(); };
  };
}

/* ---------- 6. Arranque ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  renderChips(); renderList(); renderDetail();
  $('q').oninput = e=>{ query=e.target.value; renderList(); };
  $('btnSend').onclick = sendMsg;
  $('cmodal').addEventListener('click',e=>{ if(e.target===$('cmodal')) closeModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
  $('msgIn').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } });
});
