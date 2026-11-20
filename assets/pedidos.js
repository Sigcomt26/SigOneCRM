/* =====================================================================
   SigOne CRM · Pedidos
   - Usuario con rol tipo "General": ve TODOS los pedidos.
   - Usuario con rol tipo "Vendedor": ve solo SUS pedidos.
   - Filtro por estado (Pendiente / Enviado) y rango de fechas, envío masivo de pendientes y descarga a Excel.
   ===================================================================== */
if (guardPage('pedidos')) (function(){
const $ = id => document.getElementById(id);
const ME = currentUser(), esVendedor = ME.alcance === 'propio';
const BADGE = { Pendiente:'orange', Enviado:'green' };
let page = 1, size = PAGE_DEFAULT;
const sel = new Set();
const clienteDe = p => DB.clientes.find(c=>c.id===p.clienteId);
const pedCliente = p => { const c = clienteDe(p); return c ? clienteNombre(c)+' '+c.nombre : '—'; };   // texto de búsqueda

function visibles(){ return pedidosVisibles(); }                 // ya filtrado por tipo de rol (store.js)
function filtrados(){
  const q=$('q').value.toLowerCase(), v=$('fVend').value, e=$('fEst').value, d=$('fDesde').value, h=$('fHasta').value;
  return visibles().filter(p=>(!e||p.est===e) && (!v||p.vendedor===v) && (!d||p.fecha>=d) && (!h||p.fecha<=h)
    && (p.id+' '+pedCliente(p)).toLowerCase().includes(q))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.id.localeCompare(a.id));
}
function render(){
  const list = filtrados(), canSend = can('pedidos','editar');
  const pages = Math.max(1,Math.ceil(list.length/size)); if(page>pages) page=pages;
  const rows = list.slice((page-1)*size, page*size);
  [...sel].forEach(id=>{ const p=DB.pedidos.find(x=>x.id===id); if(!p||p.est!=='Pendiente') sel.delete(id); });
  $('count').textContent = `${list.length} registros`;
  $('grid').innerHTML = rows.length ? rows.map(p=>`<tr>
    <td>${(()=>{ const ok=p.est==='Pendiente'&&canSend; return `<input type="checkbox" class="chk" data-s="${p.id}" ${sel.has(p.id)?'checked':''} ${ok?'':'disabled'} title="${ok?'Seleccionar para enviar':p.est==='Enviado'?'Ya fue enviado':'Tu rol no puede enviar pedidos'}" aria-label="Seleccionar ${p.id}">`; })()}</td>
    <td><strong class="table-code">${p.id}</strong></td><td class="nw">${fmtFecha(p.fecha)}</td>
    <td><b>${esc(clienteNombre(clienteDe(p)))}</b><br><small style="color:var(--muted)">${esc(clienteDe(p)?clienteContacto(clienteDe(p)):'')}</small></td>
    <td class="nw">${esc(p.vendedor)}</td><td class="nw">${esc(p.pago)}<br><small style="color:var(--muted)">${esc(p.metodo)}</small></td>
    <td class="num"><b>${moneyFmt(pedTotal(p))}</b></td><td><span class="badge ${BADGE[p.est]}">${p.est}</span></td>
    <td class="r nw"><button class="table-action table-action--view" data-v="${p.id}" title="Ver detalle" aria-label="Ver detalle">${icon('eye')}</button>${(()=>{ const ok=p.est==='Pendiente'&&canSend; return `<button class="table-action table-action--send" data-send="${p.id}" ${ok?'':'disabled'} title="${ok?'Enviar pedido':p.est==='Enviado'?'Ya fue enviado':'Tu rol no puede enviar pedidos'}" aria-label="Enviar pedido">${icon('send')}</button>`; })()}</td></tr>`).join('')
    : `<tr><td colspan="9" class="empty-cell">No se encontraron pedidos</td></tr>`;
  // Paginador
  renderPager($('pager'), { get page(){return page}, set page(v){page=v}, get size(){return size}, set size(v){size=v} }, list.length, 'pedidos', render);
  // Selección masiva (solo pendientes de la página)
  const pend = rows.filter(p=>p.est==='Pendiente');
  $('chkAll').checked = pend.length>0 && pend.every(p=>sel.has(p.id)); $('chkAll').disabled = !pend.length || !canSend; $('chkAll').title = pend.length&&canSend ? 'Seleccionar los pendientes de la página' : 'No hay pedidos pendientes en esta página';
  $('chkAll').onchange = e => { pend.forEach(p=>e.target.checked?sel.add(p.id):sel.delete(p.id)); render(); };
  $('grid').querySelectorAll('[data-s]').forEach(c=>c.onchange=()=>{ c.checked?sel.add(c.dataset.s):sel.delete(c.dataset.s); updBar(); $('chkAll').checked = pend.every(p=>sel.has(p.id)); });
  $('grid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>detalle(b.dataset.v));
  $('grid').querySelectorAll('[data-send]:not([disabled])').forEach(b=>b.onclick=()=>confirmarEnvio([b.dataset.send]));
  updBar(); hydrateIcons();
}
function updBar(){
  $('bar').hidden = !sel.size;
  $('selTxt').innerHTML = `<b>${sel.size}</b> ${sel.size===1?'pedido pendiente seleccionado':'pedidos pendientes seleccionados'} · ${moneyFmt([...sel].reduce((a,id)=>a+pedTotal(DB.pedidos.find(p=>p.id===id)),0))}`;
}

/* ---------- Diálogos ---------- */
function openDlg(html){ $('dlgBox').className = 'modal'; $('dlgBox').innerHTML = html; $('dlg').classList.add('open'); hydrateIcons($('dlgBox')); $('dlgBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeDlg); }
function closeDlg(){ $('dlg').classList.remove('open'); }
function detalle(id){
  const p = DB.pedidos.find(x=>x.id===id), c = clienteDe(p) || {};
  openDlg(`<div class="modal-h"><h3>Pedido ${p.id}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-b">
      <div class="det-meta"><div><span>Cliente</span><br><b>${esc(clienteNombre(c))}</b>${c.id?` · <small style="color:var(--muted)">${esc(clienteContacto(c))}</small>`:''}</div><div><span>Vendedor</span><br><b>${esc(p.vendedor)}</b></div>
        <div><span>Fecha</span><br><b>${fmtFecha(p.fecha)}</b></div><div><span>Estado</span><br><span class="badge ${BADGE[p.est]}">${p.est}</span>${p.est==='Enviado'&&p.envFecha?` <small style="color:var(--muted)">${esc(p.envFecha.includes('-')?fmtFecha(p.envFecha):p.envFecha)}</small>`:''}</div>
        <div><span>Pago</span><br><b>${esc(p.pago)} · ${esc(p.metodo)}</b></div><div><span>Comprobante</span><br><b>${esc(p.comp)}</b></div></div>
      <table class="det-items"><thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>${p.items.map(i=>`<tr><td>${esc(i.n)}</td><td>${i.q} × ${moneyFmt(i.p)}</td><td>${moneyFmt(i.p*i.q)}</td></tr>`).join('')}</tbody></table>
      <div style="text-align:right;font-size:18px;font-weight:800;margin-top:8px">Total: ${moneyFmt(pedTotal(p))}</div>
      ${p.obs?`<p style="color:var(--muted);margin-top:8px">Obs.: ${esc(p.obs)}</p>`:''}
    </div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cerrar</button>${p.est==='Pendiente'&&can('pedidos','editar')?`<button type="button" class="btn btn-primary" id="dSend">${icon('send')}Enviar pedido</button>`:''}</div>`);
  const b = $('dSend'); if(b) b.onclick = ()=>{ closeDlg(); confirmarEnvio([p.id]); };
}
function confirmarEnvio(ids){
  const ps = ids.map(id=>DB.pedidos.find(p=>p.id===id)).filter(p=>p&&p.est==='Pendiente');
  if(!ps.length) return toast('No hay pedidos pendientes para enviar');
  const total = ps.reduce((a,p)=>a+pedTotal(p),0);
  openDlg(`<div class="modal-h"><h3>Enviar ${ps.length===1?'pedido '+ps[0].id:ps.length+' pedidos'}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-b"><p>Se ${ps.length===1?'enviará':'enviarán'} <b>${ps.length}</b> ${ps.length===1?'pedido':'pedidos'} por un total de <b>${moneyFmt(total)}</b> al sistema de ventas.</p>
      <p style="color:var(--muted)">${ps.length>1?ps.map(p=>p.id).join(', ')+'. ':''}Una vez enviados pasan al estado <b>Enviado</b> y ya no se pueden volver a enviar.</p></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-primary" id="goSend">${icon('send')}Enviar</button></div>`);
  $('goSend').onclick = async () => {
    $('goSend').disabled = true; $('goSend').textContent = 'Enviando…';
    const n = await enviarPedidos(ps.map(p=>p.id));
    ps.forEach(p=>sel.delete(p.id)); closeDlg(); render(); toast(`${n} ${n===1?'pedido enviado':'pedidos enviados'} correctamente`);
  };
}

/* ---------- Nuevo pedido (mismo formulario que Conversaciones › Crear pedido) ---------- */
function nuevoPedidoForm(){
  if(!can('pedidos','crear')) return toast('Tu rol no puede crear pedidos');
  const cls = DB.clientes.filter(c=>c.estado==='Activo' && (ME.alcance==='todos'||c.vendedor===ME.name)).sort((a,b)=>clienteNombre(a).localeCompare(clienteNombre(b)));
  if(!cls.length) return toast('No tienes clientes asignados para crear pedidos');
  const cart = [];
  // Ventana con el diseño SigOne (pedido-form.js › pedidoModalHTML): cliente · datos del pedido · productos y total
  const selCli = `<select class="select" id="npCli">${cls.map(c=>`<option value="${c.id}">${esc(clienteNombre(c))}${_hayEmp(c)?' · '+esc(c.nombre):''}</option>`).join('')}</select>`;
  openDlg(pedidoModalHTML(cart, '', selCli));
  $('dlgBox').className = 'modal np-modal';
  const cli = () => DB.clientes.find(c=>c.id===+$('npCli').value) || {};
  // Datos de referencia del cliente elegido (vendedor, celular y tipo) y su dirección como dirección de entrega
  const pintarCliente = () => { const c = cli();
    $('npCliInfo').innerHTML = `<span>${icon('user')}${esc(c.vendedor||'Sin asignar')}</span><span>${icon('phone')}${esc(c.cel||'—')}</span><span>${icon('star')}${esc(c.cat||'—')}</span>`;
    $('oDir').value = c.dir && c.dir!=='-' ? c.dir : ''; };
  pintarCliente(); hydrateIcons($('dlgBox'));
  $('npCli').onchange = pintarCliente;
  pedidoFormBind(cart, d => {
    const c = DB.clientes.find(x=>x.id===+$('npCli').value);
    // Nace "Pendiente"; enseguida se pregunta si se envía al sistema de ventas
    const ped = nuevoPedido({ clienteId:c.id, vendedor:c.vendedor||ME.name, pago:d.pago, metodo:d.metodo, comp:d.comp, obs:d.obs, dirEntrega:d.dir, items:d.items });
    page = 1; render(); preguntarEnvio(ped);
  });
}
function preguntarEnvio(ped){
  openDlg(`${pedidoCreadoHTML(ped, true, clienteDe(ped))}
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Ahora no</button>${can('pedidos','editar')?`<button type="button" class="btn btn-primary" id="npSend">${icon('send')}Enviar pedido</button>`:''}</div>`);
  const b = $('npSend'); if(b) b.onclick = async () => { b.disabled=true; b.textContent='Enviando…'; await enviarPedidos([ped.id]); closeDlg(); render(); toast('Pedido '+ped.id+' enviado correctamente'); };
}

/* ---------- Excel: exporta lo que se ve con los filtros actuales ---------- */
async function descargar(){
  const list = filtrados(); if(!list.length) return toast('No hay pedidos para descargar');
  const filas = list.map(p=>({ 'N.º pedido':p.id, 'Fecha':fmtFecha(p.fecha), 'Cliente':clienteNombre(clienteDe(p)), 'Contacto':clienteDe(p)?clienteContacto(clienteDe(p)):'', 'Vendedor':p.vendedor,
    'Forma de pago':p.pago, 'Método de pago':p.metodo, 'Comprobante':p.comp, 'Productos':p.items.map(i=>`${i.n} x${i.q}`).join('; '), 'Total (S/)':+pedTotal(p).toFixed(2), 'Estado':p.est,
    'Fecha de envío':p.est==='Enviado'?(p.envFecha.includes('-')?fmtFecha(p.envFecha):p.envFecha):'' }));
  const r = await descargarExcel('pedidos_'+hoyISO(), filas, 'Pedidos');
  toast(r==='xlsx' ? `Excel descargado (${filas.length} pedidos)` : `Descargado como CSV (${filas.length} pedidos)`);
}

document.addEventListener('DOMContentLoaded',()=>{
  // Alcance según el tipo de rol
  $('scope').innerHTML = esVendedor ? `${icon('user')} Estás viendo <b>solo tus pedidos</b> (alcance del rol: solo lo suyo).` : `${icon('users')} Estás viendo <b>los pedidos de todos los vendedores</b> (alcance del rol: todos los usuarios).`;
  $('vendWrap').hidden = esVendedor;
  $('fVend').innerHTML = '<option value="">Todos</option>'+[...new Set(DB.pedidos.map(p=>p.vendedor))].sort().map(v=>`<option>${esc(v)}</option>`).join('');
  $('filters').addEventListener('submit',e=>{ e.preventDefault(); page=1; render(); });
  ['q','fVend','fEst','fDesde','fHasta'].forEach(i=>$(i).addEventListener('input',()=>{ page=1; render(); }));
  $('btnXls').onclick = descargar;
  $('btnNew').hidden = !can('pedidos','crear'); $('btnNew').onclick = nuevoPedidoForm;
  $('btnSendSel').onclick = ()=>confirmarEnvio([...sel]);
  $('dlg').addEventListener('click',e=>{ if(e.target===$('dlg')) closeDlg(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDlg(); });
  render();
});
})();
