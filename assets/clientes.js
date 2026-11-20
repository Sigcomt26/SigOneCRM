/* =====================================================================
   SigOne CRM · Gestión de Clientes (datos de ejemplo, sin backend)
   Vista 1: lista + detalle.  Vista 2: conversación + panel (Crear pedido).
   ===================================================================== */

/* ---------- 1. Datos: vienen de store.js (los administra Configuración) ---------- */
/* Tipo de cliente → color fuerte / fondo suave / texto oscuro (se configura en Mantenedores › Tipo de cliente) */
const catVars = c => { const k=tipoColors(c.cat); return `--c:${k.color};--t:${k.tint};--d:${k.dark}`; };
const catPill = c => `<span class="cat-pill" style="${catVars(c)}">${esc(c.cat)}</span>`;
const ME = currentUser();
/* Clientes visibles: tipo "Vendedor" ve solo los suyos · "General" ve todos. Orden: prioridad del tipo de cliente */
const misClientes = () => DB.clientes.filter(c=>c.estado==='Activo' && (ME.alcance==='todos'||c.vendedor===ME.name))
  .sort((a,b)=>prioRank((tipoCliente(a.cat)||{}).prioridad)-prioRank((tipoCliente(b.cat)||{}).prioridad)||a.id-b.id);
const catalog = catalogoProductos;
/* Estado por cliente (solo en esta sesión): chat y carrito. Los pedidos viven en DB.pedidos */
const state = {};
function stateOf(c){
  if(!state[c.id]){
    const luces = catalog().find(x=>x.n==='Luces navideñas x100');
    state[c.id] = {
      msgs:[
        { t:'c',   d:'10/10/2026 08:05 am', x:'Buen día, necesito cotizar pesebres y luces de navidad para mi tienda.' },
        { t:'v',   d:'10/10/2026 08:07 am', x:'Buen día, claro, ¿qué cantidad y medidas necesita?' },
        { t:'c',   d:'10/10/2026 08:08 am', x:'Necesito 10 cajas de luces. Pago por transferencia y factura electrónica, por favor.' },
        { t:'v',   d:'10/10/2026 08:11 am', x:'¡Perfecto! Le genero el pedido ahora mismo.' },
        ...(ordersOf(c).length ? [{ t:'sys', id:ordersOf(c)[0].id },{ t:'v', d:'10/10/2026 08:15 am', x:'Le ha llegado un correo con el detalle de su pedido.' }] : [])
      ],
      cart: luces ? [{ ...luces, q:10 }] : []
    };
  }
  return state[c.id];
}
const ordersOf = c => DB.pedidos.filter(p=>p.clienteId===c.id).sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.id.localeCompare(a.id));

/* ---------- 2. Utilidades ---------- */
const $ = id => document.getElementById(id);
const money = n => 'S/ ' + Number(n).toFixed(2);
const initials = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const AV = ['', 'alt1','alt2','alt3','alt4'];
const avatar = (c,sz='') => `<div class="avatar ${AV[c.id%5]}" ${sz}>${initials(clienteNombre(c))}</div>`;
const nowStr = ahoraStr;                 // dd/mm/yyyy hh:mm am/pm
const kv = (ic,l,v) => `<div class="kv"><span>${icon(ic)}${l}</span><b>${esc(v)}</b></div>`;

let filter = 'Todos', query = '', current = misClientes()[0] || null, tab = 'pedido';
let expand = '';                       // '' | 'chat' | 'panel' (ventana expandida)
let hF = 'Todos', hQ = '', hOpen = null; // filtros del historial y pedido abierto
/* Etapas del pedido: nace Pendiente y pasa a Enviado cuando viaja al sistema de ventas */
const ORD_BADGE = { Pendiente:'orange', Enviado:'green' };
const ordTotal = pedTotal;

/* ---------- 3. Vista 1: filtros, lista y detalle ---------- */
function renderChips(){
  const mine = misClientes(), tipos = tiposActivos().sort((a,b)=>prioRank(a.prioridad)-prioRank(b.prioridad));
  if(filter!=='Todos' && !tipos.some(t=>t.nombre===filter)) filter='Todos';
  $('chips').innerHTML = [{nombre:'Todos'}, ...tipos].map(t=>{ const s=t.nombre, k=tipoColors(s);
    return `<button class="chip ${s==='Todos'?'all':'cat'} ${s===filter?'on':''}" data-f="${esc(s)}" ${s==='Todos'?'':`style="--c:${k.color};--t:${k.tint};--d:${k.dark}" title="Prioridad ${esc(t.prioridad)}"`}>${esc(s)} <small>${s==='Todos'?mine.length:mine.filter(c=>c.cat===s).length}</small></button>`; }).join('');
  $('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>{ filter=b.dataset.f; renderChips(); renderList(); });
}
function renderList(){
  const list = misClientes().filter(c => (filter==='Todos'||c.cat===filter) && (c.nombre+c.empresa).toLowerCase().includes(query.toLowerCase()));
  $('clList').innerHTML = list.length ? list.map(c=>`
    <button class="cl-item ${current&&c.id===current.id?'active':''}" data-id="${c.id}" style="--stage:${tipoColors(c.cat).color}">
      ${avatar(c)}
      <div class="info"><div class="row1"><b>${esc(clienteNombre(c))}</b><time>${c.time}</time></div><p>Último mensaje de prueba...</p><span class="cat-pill sm" style="${catVars(c)}">${esc(c.cat)}</span></div>
    </button>`).join('') : `<div class="empty">${icon('search')}<div>Sin resultados</div></div>`;
  $('clList').querySelectorAll('.cl-item').forEach(b=>b.onclick=()=>{ current=DB.clientes.find(c=>c.id==b.dataset.id); renderList(); renderDetail(); });
  hydrateIcons($('clList'));
}
/* Bloques reutilizados en el detalle y en las pestañas de la conversación */
const blkInfo = c => kv('building','Empresa',_hayEmp(c)?c.empresa:'Persona natural')+kv('user','Contacto',c.nombre)+kv('briefcase','Cargo',c.cargo)+kv('phone','Celular',c.cel)+kv('mail','Correo',c.mail)+kv('pin','Dirección',c.dir);
const blkSeg  = c => kv('clock','Última interacción',c.ult)+kv('calendar','Próxima interacción',c.prox)+kv('funnel','Etapa de venta',c.stage)+kv('user','Responsable',c.vendedor)+kv('calendar','Primera interacción',c.prim);
const blkPref = c => kv('clock','Horario de atención',c.horario)+kv('message','Canales de atención',c.canales)+kv('package','Líneas de preferencia',c.lineas)+kv('cart','Productos de interés',c.interes)+kv('pencil','Observaciones relevantes',c.obs);

function renderDetail(){
  const c=current;
  if(!c){ $('clDetail').innerHTML=`<div class="empty">${icon('users')}<div>No tienes clientes asignados</div></div>`; hydrateIcons($('clDetail')); return; }
  const ed=can('conversaciones','editar');
  $('clDetail').innerHTML = `
    <div class="d-head" style="${catVars(c)}">
      ${avatar(c)}
      <div><h2>${esc(clienteNombre(c))}</h2>${catPill(c)}</div>
      <button class="btn btn-primary sp" id="btnOpen"><i data-icon="message"></i>Abrir conversación</button>
    </div>
    <div class="d-body"><div class="d-grid">
      <div class="d-col">
        <div class="box"><div class="box-h"><h3>Información detallada</h3><div class="acts"><a class="link" data-hist="info"><i data-icon="history"></i>Historial</a>${ed?'<a class="link" data-edit="info"><i data-icon="pencil"></i>Editar</a>':''}</div></div>
          <div class="box-b">${kv('user','Vendedor asignado',c.vendedor)}${blkInfo(c)}</div></div>
        <div class="box"><div class="box-h"><h3>Seguimiento</h3><div class="acts"><a class="link" data-hist="seg"><i data-icon="history"></i>Historial</a>${ed?'<a class="link" data-edit="seg"><i data-icon="pencil"></i>Editar</a>':''}</div></div><div class="box-b">${blkSeg(c)}</div></div>
      </div>
      <div class="d-col">
        <div class="stats">
          <div class="stat"><div class="n">${String(c.ventas).padStart(2,'0')}</div><small>Ventas<br>realizadas</small></div>
          <div class="stat"><div class="n">${c.antig}</div><small>año de<br>antigüedad</small></div>
        </div>
        <div class="box"><div class="box-h"><h3>Preferencias</h3><div class="acts"><a class="link" data-hist="pref"><i data-icon="history"></i>Historial</a>${ed?'<a class="link" data-edit="pref"><i data-icon="pencil"></i>Editar</a>':''}</div></div>
          <div class="box-b">${blkPref(c)}</div></div>
      </div>
    </div></div>`;
  hydrateIcons($('clDetail'));
  $('btnOpen').onclick = openChat;
  $('clDetail').querySelectorAll('[data-hist]').forEach(a=>a.onclick=()=>openHistory(a.dataset.hist));
  $('clDetail').querySelectorAll('[data-edit]').forEach(a=>a.onclick=()=>openEdit(a.dataset.edit));
}

/* ---------- 3b. Editar cliente + Historial de cambios ---------- */
/* Secciones editables e historial de cambios: viven en store.js (clienteSections, histOf, aplicarCambiosCliente) */
function openModal(html){ $('cmBox').className='modal'; $('cmBox').innerHTML=html; $('cmodal').classList.add('open'); hydrateIcons($('cmBox')); }
function closeModal(){ $('cmodal').classList.remove('open'); $('cmBox').className='modal'; }

const splitList = v => (!v||v==='-') ? [] : String(v).split(/\s*,\s*/).filter(Boolean);
const FECHA_HORA = ['horario','prox'];                 // campos con fecha y hora
function openEdit(sec){
  const c=current, S0=clienteSections()[sec], S={ ...S0, f:S0.f.filter(x=>!['estado','vendedor'].includes(x[0])) };   // el estado se cambia en Configuración › Clientes y el vendedor se asigna en Cartera
  const control = ([k,l,t,o]) =>
      FECHA_HORA.includes(k) ? dpHTML(k, dtToInput(c[k]), {time:true})
    : k==='lineas'  ? msHTML(k, tablaVals('Línea de producto'), splitList(c[k]), 'Seleccionar líneas')
    : k==='interes' ? msHTML(k, catalogoProductos().map(x=>x.n), splitList(c[k]), 'Seleccionar productos')
    : t==='select'  ? `<select class="select" name="${k}">${o.map(v=>`<option ${v===c[k]?'selected':''}>${v}</option>`).join('')}</select>`
    : t==='textarea'? `<textarea class="textarea" name="${k}" rows="3">${esc(c[k]==='-'?'':c[k])}</textarea>`
    : `<input class="input" name="${k}" type="${t||'text'}" value="${esc(c[k])}">`;
  openModal(`<form id="editForm" novalidate>
    <div class="modal-h"><h3>Editar · ${S.title}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar"><i data-icon="x"></i></button></div>
    <div class="modal-b"><div class="form-cols">${S.f.map(f=>`<div class="field ${['dir','obs'].includes(f[0])?'full':''}"><label>${f[1]}</label>${control(f)}</div>`).join('')}</div>
      <div class="login-err" id="eErr" hidden></div></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar cambios</button></div></form>`);
  $('cmBox').className = 'modal edit-wide';
  msBind($('cmBox')); dpBind($('cmBox'));
  $('cmBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  $('editForm').onsubmit = e => {
    e.preventDefault();
    const d=Object.fromEntries(new FormData($('editForm')).entries()), err=m=>{ $('eErr').textContent=m; $('eErr').hidden=false; };
    // Validaciones básicas
    if(sec==='info'){
      if(d.docTipo==='RUC' && !d.empresa.trim()) return err('La empresa es obligatoria para clientes con RUC.');
      if(!/^\d{9}$/.test(d.cel.trim())) return err('El celular debe tener 9 dígitos.');
      if(!/^\S+@\S+\.\S+$/.test(d.mail.trim())) return err('Ingresa un correo válido.');
    }
    // Fecha y hora → texto "dd/mm/aaaa hh:mm am". Si estaba con un texto antiguo y no se eligió fecha, se deja como estaba.
    FECHA_HORA.forEach(k=>{ if(k in d){ const v=dtFromInput(d[k]); if(v) d[k]=v; else if(!dtToInput(c[k])) delete d[k]; } });
    // Cada campo modificado genera una entrada en el historial del cliente (store.js)
    const n = aplicarCambiosCliente(c, sec, d);
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
    $('cmBox').innerHTML=histModal({ title:'Historial · '+(hSec==='all'?'Todo':clienteSections()[hSec].title), sub:clienteNombre(c),
      items:list.map(h=>({ field:h.campo, before:h.antes, after:h.desp, date:h.f, user:h.u })) });
    $('cmBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  };
  $('cmodal').classList.add('open'); draw();
}

/* ---------- 4. Vista 2: conversación ---------- */
function openChat(){ if(!current) return; $('viewList').hidden=true; $('viewChat').hidden=false; tab='pedido'; renderChat(); window.scrollTo(0,0); }
function closeChat(){ expand=''; $('viewChat').hidden=true; $('viewList').hidden=false; }

function renderChat(){
  const c=current, s=stateOf(c);
  $('chatTop').innerHTML = `${avatar(c)}<h2>${esc(clienteNombre(c))}</h2>${catPill(c)}
    <div class="sp"><button class="btn btn-ghost" id="btnBack"><i data-icon="back"></i>Atrás</button></div>`;
  if(tab==='pedido' && !can('pedidos','crear')) tab='info';
  const T=[['info','Información detallada'],['pref','Preferencias'],['seg','Seguimiento'],...(can('pedidos','crear')?[['pedido','Crear pedido']]:[])];
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
    ? `<div class="sys"><span class="ok">${icon('check')}Pedido creado</span><a class="link" data-view="${m.id||''}">Ver pedido</a></div>`
    : `<div class="msg ${m.t}"><div class="who"><span>${m.t==='c'?esc(current.nombre):'Vendedor '+esc(current.vendedor)}</span><span>${m.d}</span></div>${esc(m.x)}</div>`).join('');
  $('msgs').querySelectorAll('[data-view]').forEach(a=>a.onclick=()=>{ tab='hist'; hOpen=a.dataset.view||ordersOf(current)[0].id; renderChat(); });
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
/* ---------- Historial de pedidos: KPIs, filtros, tarjetas desplegables, enviar pendientes, repetir pedido ---------- */
function renderHist(p, s){
  const all = ordersOf(current);
  const sum = all.reduce((a,o)=>a+ordTotal(o),0);
  const list = all.filter(o => (hF==='Todos'||o.est===hF) && o.id.toLowerCase().includes(hQ.toLowerCase()));
  const canSend = can('pedidos','editar');
  p.innerHTML = `
    <div class="h-kpis">
      <div class="h-kpi"><small>Pedidos</small><b>${all.length}</b></div>
      <div class="h-kpi"><small>Total comprado</small><b>${money(sum)}</b></div>
      <div class="h-kpi"><small>Ticket promedio</small><b>${money(all.length?sum/all.length:0)}</b></div>
    </div>
    <div class="h-tools">
      <div class="search"><i data-icon="search"></i><input class="input" id="hQ" placeholder="Buscar por N.º de pedido" value="${esc(hQ)}"></div>
      <div class="h-chips">${['Todos',...Object.keys(ORD_BADGE)].map(e=>`<button class="chip ${hF===e?'on':''}" data-hf="${e}">${e}</button>`).join('')}</div>
    </div>
    <div class="ord-list">${list.length ? list.map(o=>{
      const t=ordTotal(o), open=hOpen===o.id;
      return `<div class="ord ${open?'open':''}">
        <button class="ord-h" data-o="${o.id}"><div><span class="id">${o.id}</span><small>${fmtFecha(o.fecha)}</small></div><span class="badge ${ORD_BADGE[o.est]}">${o.est}</span><div class="tot">${money(t)}</div>${icon('chevron','chev')}</button>
        ${open?`<div class="ord-b">
          <table><thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>${o.items.map(i=>`<tr><td>${esc(i.n)}</td><td>${i.q} × ${money(i.p)}</td><td>${money(i.p*i.q)}</td></tr>`).join('')}</tbody></table>
          <div class="ord-meta"><span>${icon('cart')} ${esc(o.pago)} · ${esc(o.metodo)}</span><span>${icon('file')} ${esc(o.comp)}</span>${o.est==='Enviado'&&o.envFecha?`<span>${icon('send')} Enviado el ${esc(o.envFecha.includes('-')?fmtFecha(o.envFecha):o.envFecha)}</span>`:''}</div>
          <div class="ord-act">${o.est==='Pendiente'&&canSend?`<button class="btn btn-primary btn-sm" data-send="${o.id}">${icon('send')}Enviar pedido</button>`:''}<button class="btn btn-ghost btn-sm" data-rep="${o.id}">${icon('repeat')}Repetir pedido</button><button class="btn btn-ghost btn-sm" data-pdf="${o.id}">${icon('file')}Comprobante</button></div>
        </div>`:''}</div>`; }).join('') : `<div class="empty">${icon('search')}<div>Sin pedidos para este filtro</div></div>`}</div>`;
  $('hQ').oninput = e => { hQ=e.target.value; renderPanel(); $('hQ').focus(); };
  p.querySelectorAll('[data-hf]').forEach(b=>b.onclick=()=>{ hF=b.dataset.hf; renderPanel(); });
  p.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ hOpen = hOpen===b.dataset.o ? null : b.dataset.o; renderPanel(); });
  p.querySelectorAll('[data-pdf]').forEach(b=>b.onclick=()=>toast('Comprobante '+b.dataset.pdf+' (demo)'));
  p.querySelectorAll('[data-send]').forEach(b=>b.onclick=()=>askSend(DB.pedidos.find(x=>x.id===b.dataset.send), false));
  // Repetir pedido: copia los productos al carrito y abre "Crear pedido"
  p.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{
    if(!can('pedidos','crear')) return toast('Tu rol no puede crear pedidos');
    const o=all.find(x=>x.id===b.dataset.rep); s.cart=o.items.map(i=>({n:i.n,d:'Producto',p:i.p,q:i.q}));
    tab='pedido'; renderChat(); toast('Productos de '+o.id+' cargados al pedido');
  });
}
const cartTotal = s => s.cart.reduce((a,i)=>a+i.p*i.q,0);
function renderOrder(p, s){
  p.innerHTML = pedidoFormHTML(s.cart, current.dir);          // mismo formulario que Pedidos › Nuevo pedido (pedido-form.js)
  pedidoFormBind(s.cart, d => {
    // El pedido nace "Pendiente"; enseguida se pregunta si se envía al otro sistema
    const ped = nuevoPedido({ clienteId:current.id, vendedor:current.vendedor, pago:d.pago, metodo:d.metodo, comp:d.comp, obs:d.obs, dirEntrega:d.dir, items:d.items });
    hOpen=ped.id; s.msgs.push({t:'sys', id:ped.id}); s.cart=[]; hF='Todos'; renderChat();
    askSend(ped, true);
  });
}
/* Modal "¿Enviar pedido?": Enviar → viaja al otro sistema (queda Enviado) · Ahora no → se mantiene Pendiente */
function askSend(ped, recien){
  openModal(`${pedidoCreadoHTML(ped, recien, current)}
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Ahora no</button><button type="button" class="btn btn-primary" id="sendNow"><i data-icon="send"></i>Enviar pedido</button></div>`);
  $('cmBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{ closeModal(); if(recien) toast('Pedido '+ped.id+' guardado como pendiente'); });
  $('sendNow').onclick = async () => {
    if(!can('pedidos','editar')) return toast('Tu rol no puede enviar pedidos');
    $('sendNow').disabled = true; $('sendNow').textContent = 'Enviando…';
    await enviarPedidos([ped.id]); closeModal(); toast('Pedido '+ped.id+' enviado correctamente');
    if(!$('viewChat').hidden) renderChat();
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
