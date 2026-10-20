/* =====================================================================
   SigOne CRM · Mantenedor de Usuarios (datos demo en memoria)
   Roles: Administrador · Supervisor · Vendedor (se afinarán más adelante)
   ===================================================================== */
const $ = id => document.getElementById(id);

const ROLES = {
  'Administrador': { badge:'red',    hint:'Acceso total: usuarios, mantenedores, clientes y reportes.' },
  'Supervisor':    { badge:'blue',   hint:'Supervisa vendedores, ve toda la cartera y los reportes del equipo.' },
  'Vendedor':      { badge:'orange', hint:'Gestiona solo los clientes y pedidos que tiene asignados.' }
};
let USERS = [
  { id:1, nombre:'Administrador sigcomt', mail:'admin@sigcomt.com',      rol:'Administrador', activo:true,  acceso:'Hoy, 12:05 pm' },
  { id:2, nombre:'Juan Perez',            mail:'jperez@sigcomt.com',     rol:'Vendedor',      activo:true,  acceso:'Hoy, 10:50 am' },
  { id:3, nombre:'María Torres',          mail:'mtorres@sigcomt.com',    rol:'Supervisor',    activo:true,  acceso:'Ayer, 06:12 pm' },
  { id:4, nombre:'Carlos Ramírez',        mail:'cramirez@sigcomt.com',   rol:'Vendedor',      activo:true,  acceso:'Ayer, 04:40 pm' },
  { id:5, nombre:'Lucía Fernández',       mail:'lfernandez@sigcomt.com', rol:'Vendedor',      activo:false, acceso:'12/10/2026' },
  { id:6, nombre:'Bruno Jiménez',         mail:'bjimenez@sigcomt.com',   rol:'Supervisor',    activo:true,  acceso:'18/10/2026' }
];
const now = () => new Date().toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
// Historial inicial de ejemplo (se completa con las ediciones hechas en la sesión)
USERS.forEach(u=>u.hist=[{t:'10/10/2026 09:20',by:'Administrador sigcomt',ch:[{f:'Rol',a:'Vendedor',d:u.rol}]},{t:'01/10/2026 08:00',by:'Administrador sigcomt',ch:[{f:'Usuario',a:'—',d:'Creado'}]}]);
let editId = null;                               // null = creando, número = editando
const AV = ['','alt1','alt2','alt3','alt4'];
const initials = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

/* ---------- Filtro segmentado por rol + tarjetas de usuario ---------- */
let rolF = '';                                   // '' = todos
const closeMenus = () => document.querySelectorAll('.menu.open').forEach(m=>m.classList.remove('open'));
function renderSeg(){
  const opts=[['','Todos',USERS.length],...Object.keys(ROLES).map(r=>[r,r+'es'.slice(r.endsWith('r')?0:2),USERS.filter(u=>u.rol===r).length])];
  $('seg').innerHTML = opts.map(([v,l,n])=>`<button class="${rolF===v?'on':''}" data-r="${v}">${l}<i>${n}</i></button>`).join('');
  $('seg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ rolF=b.dataset.r; page=1; renderAll(); });
}
let page=1, size=5;                              // paginador: 5 filas por defecto
function renderGrid(){
  const q=$('q').value.toLowerCase(), only=$('onlyActive').checked;
  const list = USERS.filter(u => (u.nombre+u.mail).toLowerCase().includes(q) && (!rolF||u.rol===rolF) && (!only||u.activo));
  const pages=Math.max(1,Math.ceil(list.length/size)); if(page>pages) page=pages;
  const rows=list.slice((page-1)*size, page*size);
  $('grid').innerHTML = rows.length ? rows.map(u=>`
    <tr class="${u.activo?'':'inactive'}">
      <td><div style="display:flex;gap:12px;align-items:center"><div class="avatar ${AV[u.id%5]}" style="width:38px;height:38px;font-size:13px">${initials(u.nombre)}</div><div style="min-width:0"><b>${esc(u.nombre)}</b><br><small style="color:var(--muted)">${esc(u.mail)}</small></div></div></td>
      <td><span class="badge ${ROLES[u.rol].badge}">${icon('shield')}${u.rol}</span></td>
      <td><div style="display:flex;gap:10px;align-items:center"><button class="sw ${u.activo?'on':''}" data-sw="${u.id}" aria-label="Activar o desactivar"></button><span class="badge ${u.activo?'green':'gray'}">${u.activo?'Activo':'Inactivo'}</span></div></td>
      <td class="nw" style="color:var(--muted)">${u.acceso}</td>
      <td class="r nw"><button class="icon-btn act" data-hist="${u.id}" title="Historial" style="display:inline-grid">${icon('history')}</button><button class="icon-btn act" data-edit="${u.id}" title="Editar" style="display:inline-grid">${icon('pencil')}</button><button class="icon-btn act" data-del="${u.id}" title="Eliminar" style="display:inline-grid">${icon('trash')}</button></td>
    </tr>`).join('') : `<tr><td colspan="5" class="empty" style="padding:30px;text-align:center;color:var(--muted)">No se encontraron usuarios</td></tr>`;
  // Paginador
  const from=list.length?(page-1)*size+1:0, to=Math.min(page*size,list.length);
  const nums=Array.from({length:pages},(_,i)=>i+1).map(n=>`<button class="${n===page?'on':''}" data-p="${n}">${n}</button>`).join('');
  $('pager').innerHTML=`<div class="sz">Filas por página <select class="select" id="pgSize">${[5,10,20].map(n=>`<option ${n===size?'selected':''}>${n}</option>`).join('')}</select></div>
    <span class="info">${from}–${to} de ${list.length} usuarios</span>
    <div class="pg"><button data-p="${page-1}" ${page<=1?'disabled':''}>‹</button>${nums}<button data-p="${page+1}" ${page>=pages?'disabled':''}>›</button></div>`;
  $('pager').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ page=+b.dataset.p; renderGrid(); });
  $('pgSize').onchange=e=>{ size=+e.target.value; page=1; renderGrid(); };
  const G=$('grid');
  G.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{ const u=USERS.find(x=>x.id==b.dataset.sw); u.activo=!u.activo; renderAll(); toast(`Usuario ${u.activo?'activado':'desactivado'}`); });
  G.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(+b.dataset.edit));
  G.querySelectorAll('[data-hist]').forEach(b=>b.onclick=()=>openHist(+b.dataset.hist));
  G.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ USERS=USERS.filter(x=>x.id!=b.dataset.del); renderAll(); toast('Usuario eliminado'); });
}
function renderAll(){ renderSeg(); renderGrid(); }

/* ---------- Modal crear / editar ---------- */
function openModal(id=null){
  editId = id; const u = USERS.find(x=>x.id===id);
  $('mTitle').textContent = u ? 'Editar usuario' : 'Nuevo usuario';
  $('fNom').value = u?u.nombre:''; $('fMail').value = u?u.mail:''; $('fRolSel').value = u?u.rol:'Vendedor'; $('fEstSel').value = u&&!u.activo?'0':'1';
  $('mErr').hidden = true; updateHint(); $('modal').classList.add('open'); $('fNom').focus();
}
const closeModal = () => $('modal').classList.remove('open');
const updateHint = () => $('roleHint').textContent = ROLES[$('fRolSel').value].hint;

document.addEventListener('DOMContentLoaded',()=>{
  renderAll();
  ['q','onlyActive'].forEach(i=>$(i).addEventListener('input',()=>{ page=1; renderGrid(); }));
  $('btnNew').onclick = ()=>openModal();
  document.addEventListener('click', closeMenus);
  $('mClose').onclick = $('mCancel').onclick = closeModal;
  $('modal').addEventListener('click',e=>{ if(e.target===$('modal')) closeModal(); });
  $('fRolSel').onchange = updateHint;
  $('uForm').addEventListener('submit',e=>{
    e.preventDefault();
    const nombre=$('fNom').value.trim(), mail=$('fMail').value.trim();
    if(!nombre || !/^\S+@\S+\.\S+$/.test(mail)){ $('mErr').hidden=false; return; }
    const data = { nombre, mail, rol:$('fRolSel').value, activo:$('fEstSel').value==='1' };
    if(editId){
      const u=USERS.find(x=>x.id===editId), LBL={nombre:'Nombre',mail:'Correo',rol:'Rol',activo:'Estado'};
      // Guarda solo los campos que cambiaron (antes → después) en el historial
      const ch=Object.keys(LBL).filter(k=>u[k]!==data[k]).map(k=>({f:LBL[k],a:k==='activo'?(u[k]?'Activo':'Inactivo'):u[k],d:k==='activo'?(data[k]?'Activo':'Inactivo'):data[k]}));
      Object.assign(u,data); if(ch.length) (u.hist=u.hist||[]).unshift({t:now(),by:'Administrador sigcomt',ch});
      toast(ch.length?'Usuario actualizado':'Sin cambios'); }
    else { USERS.push({ id:Math.max(0,...USERS.map(u=>u.id))+1, acceso:'Nunca', hist:[{t:now(),by:'Administrador sigcomt',ch:[{f:'Usuario',a:'—',d:'Creado'}]}], ...data }); toast('Usuario creado'); }
    closeModal(); renderAll();
  });
});


/* ---------- Modal Historial de cambios del usuario ---------- */
function openHist(id){
  const u=USERS.find(x=>x.id===id);
  $('hTitle').textContent='Historial · '+u.nombre;
  $('hBody').innerHTML = u.hist.length ? '<div class="tl">'+u.hist.map(h=>`<div class="tl-i"><span class="tl-d"></span><div style="flex:1"><b>${esc(h.by)}</b> <small>· ${h.t}</small>${h.ch.map(c=>`<div class="tl-v"><small>${c.f}:</small> <s>${esc(c.a)}</s> <span class="arrow">${icon('chevron')}</span> <b>${esc(c.d)}</b></div>`).join('')}</div></div>`).join('')+'</div>' : '<div class="empty">Sin cambios registrados</div>';
  $('hModal').classList.add('open');
}
document.addEventListener('DOMContentLoaded',()=>{
  $('hClose').onclick=$('hOk').onclick=()=>$('hModal').classList.remove('open');
  $('hModal').addEventListener('click',e=>{ if(e.target===$('hModal')) $('hModal').classList.remove('open'); });
});
