/* =====================================================================
   SigOne CRM · Configuración
   Seguridad:    Usuarios · Roles y permisos (tipo General / Vendedor)
   Mantenedores: Productos (carga masiva + eliminar) · Tipo de cliente · Clientes
   Datos en store.js (localStorage). Mismo layout que la Configuración de SigOne Suite.
   ===================================================================== */
if (!window.CFG_BLOCKED) (function(){
const $ = id => document.getElementById(id);
const AV = ['','alt1','alt2','alt3','alt4'];
const ini = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const norm = s => String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const stBadge = a => `<span class="status-badge ${a?'':'inactive'}">${a?'Activo':'Inactivo'}</span>`;
const emptyRow = (cols,msg) => `<tr><td colspan="${cols}" class="empty-cell">${msg}</td></tr>`;
const act = (cls,attr,title,ic) => `<button class="table-action table-action--${cls}" ${attr} title="${title}">${icon(ic)}</button>`;

/* ---------- Diálogo genérico ---------- */
function openDlg(html, cls='modal'){ $('dlgBox').className = cls; $('dlgBox').innerHTML = html; $('dlg').classList.add('open'); hydrateIcons($('dlgBox')); }
function closeDlg(){ $('dlg').classList.remove('open'); }
function bindClose(){ $('dlgBox').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeDlg); }
const dlgHead = (t,ic) => `<div class="modal-h"><h3>${ic?`<i class="pi pi-${ic}" style="color:var(--orange);margin-right:8px"></i>`:''}${esc(t)}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>`;

/** Confirmación genérica (eliminar, enviar, etc.) */
function confirmDlg({title, msg, ok='Confirmar', danger=false, onOk}){
  openDlg(`${dlgHead(title)}<div class="modal-b"><div class="${danger?'warn-box':''}">${danger?icon('trash'):''}<div>${msg}</div></div></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn ${danger?'btn-danger':'btn-primary'}" id="cfOk">${ok}</button></div>`);
  bindClose(); $('cfOk').onclick = ()=>{ closeDlg(); onOk(); };
}

/** Formulario genérico a partir de una lista de campos.
    campo = { k, l, t:'text|tel|email|number|select|textarea|color|toggle', opts, req, full, hint } */
function formDlg({title, ic, fields, values={}, readOnly=false, wide=false, validate, onSave}){
  const fld = f => {
    const v = values[f.k], dis = readOnly||f.disabled ? 'disabled' : '', lab = `<label>${f.l}${f.req?' <span class="req">*</span>':''}</label>`;
    let inp;
    if(f.t==='select') inp = `<select class="select" name="${f.k}" ${dis}>${(f.opts||[]).map(o=>{const [val,txt]=Array.isArray(o)?o:[o,o]; return `<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(txt)}</option>`}).join('')}</select>`;
    else if(f.t==='textarea') inp = `<textarea class="textarea" name="${f.k}" rows="3" ${dis}>${esc(v==='-'||v==null?'':v)}</textarea>`;
    else if(f.t==='toggle') inp = `<label class="toggle-switch"><input type="checkbox" name="${f.k}" ${v!==false&&v!=='Inactivo'?'checked':''} ${dis}><span class="track"></span><span class="tlabel">Activo</span></label>`;
    else if(f.t==='color') inp = `<div class="swatches" data-color="${f.k}">${['#16A34A','#3B6FE0','#E39B0B','#F47920','#DC2626','#8A92A6','#7C3AED','#0891B2'].map(c=>`<button type="button" style="background:${c}" data-c="${c}" class="${(v||'').toLowerCase()===c.toLowerCase()?'on':''}" ${dis} aria-label="${c}"></button>`).join('')}<input type="color" name="${f.k}" value="${v||'#8A92A6'}" ${dis}></div>`;
    else inp = `<input class="input" name="${f.k}" type="${f.t||'text'}" value="${esc(v==null||v==='-'?'':v)}" ${f.ph?`placeholder="${esc(f.ph)}"`:''} ${f.t==='number'?`min="${f.min??0}" step="${f.step??0.01}"`:''} ${dis}>`;
    return `<div class="field ${f.full?'full':''}">${lab}${inp}${f.hint?`<div class="role-hint">${f.hint}</div>`:''}</div>`;
  };
  openDlg(`<form id="frm" novalidate>${dlgHead(title,ic)}<div class="modal-b"><div class="form-grid">${fields.map(fld).join('')}</div><div class="login-err" id="frmErr" hidden></div></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>${readOnly?'Cerrar':'Cancelar'}</button>${readOnly?'':`<button class="btn btn-primary" type="submit">${icon('check')}Guardar</button>`}</div></form>`, 'modal'+(wide?' wide':''));
  bindClose();
  $('dlgBox').querySelectorAll('[data-color]').forEach(w=>{
    const inp = w.querySelector('input[type=color]');
    w.querySelectorAll('button').forEach(b=>b.onclick=()=>{ inp.value=b.dataset.c; w.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); });
    inp.oninput = ()=>w.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
  });
  $('frm').onsubmit = e => {
    e.preventDefault(); if(readOnly) return;
    const d = {}; fields.forEach(f=>{ const el=$('frm').elements[f.k]; d[f.k] = f.t==='toggle' ? el.checked : (el.value||'').trim(); });
    const err = m => { $('frmErr').textContent=m; $('frmErr').hidden=false; };
    const miss = fields.find(f=>f.req && !d[f.k] && f.t!=='toggle');
    if(miss) return err(`Completa el campo "${miss.l}".`);
    const bad = validate && validate(d); if(bad) return err(bad);
    onSave(d); closeDlg();
  };
  if(!readOnly){ const first = $('frm').querySelector('input:not([type=color]):not([type=checkbox]),select'); if(first) first.focus(); }
}

/* ---------- Paginador reutilizable ---------- */
const PG = {};                                           // { [id]: {page,size} }
function pager(id, el, total, label, redraw){
  const s = PG[id] = PG[id] || {page:1,size:PAGE_DEFAULT};
  const [a,b] = renderPager(el, s, total, label, redraw);
  return DBslice => DBslice.slice(a, b);
}
const resetPage = id => { if(PG[id]) PG[id].page = 1; };

/* Propaga un cambio de nombre a los registros que lo referencian */
function renombrar(coleccion, campo, antes, despues){ if(antes===despues) return; DB[coleccion].forEach(x=>{ if(x[campo]===antes) x[campo]=despues; }); }

/* =====================================================================
   1) USUARIOS
   ===================================================================== */
function fillRoleFilter(){ $('uRol').innerHTML = '<option value="">Todos</option>'+DB.roles.map(r=>`<option>${esc(r.nombre)}</option>`).join(''); }
function renderUsuarios(){
  const q=$('uQ').value.toLowerCase(), rf=$('uRol').value, ef=$('uEst').value;
  const list = DB.users.filter(u=>(u.nombre+u.mail).toLowerCase().includes(q) && (!rf||u.rol===rf) && (!ef||String(u.activo?1:0)===ef));
  $('uCount').textContent = `${list.length} registros`;
  const slice = pager('u',$('uPager'),list.length,'usuarios',renderUsuarios)(list), off = (PG.u.page-1)*PG.u.size;
  const ed = can('seg-usuarios','editar');
  $('uGrid').innerHTML = slice.length ? slice.map((u,i)=>{
    const rol = DB.roles.find(r=>r.nombre===u.rol);
    return `<tr class="${u.activo?'':'inactive'}">
      <td class="nw" style="color:var(--muted)">${off+i+1}</td>
      <td><div style="display:flex;gap:12px;align-items:center"><div class="avatar ${AV[u.id%5]}" style="width:28px;height:28px;font-size:11px">${ini(u.nombre)}</div><div style="min-width:0"><b>${esc(u.nombre)}</b><br><small style="color:var(--muted)">${esc(u.mail)}</small></div></div></td>
      <td class="nw">${esc(u.celular||'—')}</td><td class="nw">${esc(u.area||'—')}</td>
      <td><span class="badge ${rol&&rol.tipo==='Vendedor'?'orange':'blue'}">${icon('shield')}${esc(u.rol)}</span></td>
      <td>${stBadge(u.activo)}</td>
      <td class="r nw">${act('view',`data-v="${u.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${u.id}"`,'Editar','pencil')+act('lock',`data-r="${u.id}"`,'Restablecer contraseña','lock'):''}</td></tr>`;
  }).join('') : emptyRow(7,'No se encontraron usuarios');
  $('uGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>usuarioForm(+b.dataset.v,true));
  $('uGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>usuarioForm(+b.dataset.e));
  $('uGrid').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>resetPass(+b.dataset.r));
}
function usuarioForm(id=null, ro=false){
  const u = DB.users.find(x=>x.id===id);
  const roles = DB.roles.filter(r=>r.activo||(u&&u.rol===r.nombre)).map(r=>[r.nombre,`${r.nombre} (${r.tipo})`]);
  formDlg({ title: ro?'Ver usuario':u?'Editar usuario':'Nuevo usuario', ic:'user', readOnly:ro,
    values: u?{...u}:{ rol:roles[0]&&roles[0][0], activo:true },
    fields:[ {k:'nombre',l:'Nombre completo',req:1,full:1,ph:'Ej. Juan Perez'},{k:'mail',l:'Correo electrónico',t:'email',req:1,ph:'usuario@sigcomt.com'},{k:'celular',l:'Celular',t:'tel'},
      {k:'area',l:'Área'},{k:'rol',l:'Rol',t:'select',opts:roles,req:1,hint:'El alcance del rol decide si ve los clientes y pedidos de todos o solo los suyos.'},{k:'activo',l:'Estado',t:'toggle'} ],
    validate: d => !/^\S+@\S+\.\S+$/.test(d.mail) ? 'Ingresa un correo válido.'
      : d.celular && !/^\d{9}$/.test(d.celular) ? 'El celular debe tener 9 dígitos.'
      : DB.users.some(x=>x.id!==id && x.mail.toLowerCase()===d.mail.toLowerCase()) ? 'Ya existe un usuario con ese correo.' : '',
    onSave: d => {
      if(u){ renombrar('clientes','vendedor',u.nombre,d.nombre); renombrar('pedidos','vendedor',u.nombre,d.nombre); Object.assign(u,d); toast('Usuario actualizado'); }
      else { DB.users.push({ id:nextId(DB.users), ...d }); toast('Usuario creado'); }
      saveDB(); renderUsuarios();
    } });
}
function resetPass(id){
  const u = DB.users.find(x=>x.id===id);
  openDlg(`${dlgHead('Restablecer contraseña')}<div class="modal-b"><p style="color:var(--muted);font-size:13px">Se enviará un enlace de restablecimiento al correo de <b>${esc(u.nombre)}</b>.</p><div class="field"><label>Correo</label><input class="input" value="${esc(u.mail)}" disabled></div></div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-primary" id="rpOk">${icon('send')}Enviar enlace</button></div>`);
  bindClose(); $('rpOk').onclick = ()=>{ closeDlg(); toast(`Enlace enviado a ${u.mail}`); };
}

/* =====================================================================
   2) ROLES Y PERMISOS  (tipo de rol: General | Vendedor)
   ===================================================================== */
function renderRoles(){
  const q=$('rQ').value.toLowerCase(), tf=$('rTipo').value, ef=$('rEst').value;
  const list = DB.roles.filter(r=>r.nombre.toLowerCase().includes(q) && (!tf||r.tipo===tf) && (!ef||String(r.activo?1:0)===ef));
  $('rCount').textContent = `${list.length} registros`;
  const ed = can('seg-roles','editar');
  const slice = pager('r',$('rPager'),list.length,'roles',renderRoles)(list);
  $('rGrid').innerHTML = slice.length ? slice.map(r=>{
    const n = DB.users.filter(u=>u.rol===r.nombre).length;
    return `<tr><td><span class="role-name">${esc(r.nombre)}</span></td>
      <td><span class="badge ${r.tipo==='Vendedor'?'orange':'blue'}">${r.tipo}</span></td>
      <td><span class="badge ${rolAlcance(r)==='todos'?'green':'gray'}">${icon(rolAlcance(r)==='todos'?'users':'user')}${rolAlcance(r)==='todos'?'Ve todo de todos':'Solo lo suyo'}</span></td>
      <td><span class="description-text">${esc(r.desc||'—')}</span></td>
      <td><span class="users-badge">${n} ${n===1?'usuario':'usuarios'}</span></td>
      <td>${stBadge(r.activo)}</td>
      <td class="r nw">${act('view',`data-v="${r.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${r.id}"`,'Editar','pencil'):''}</td></tr>`;
  }).join('') : emptyRow(7,'No se encontraron roles');
  $('rGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>rolForm(+b.dataset.v,'view'));
  $('rGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>rolForm(+b.dataset.e,'edit'));
}
function rolForm(id, mode){            // mode: create | view | edit
  const orig = DB.roles.find(r=>r.id===id), ro = mode==='view';
  const R = orig ? { ...orig, perms: JSON.parse(JSON.stringify(orig.perms)) } : { nombre:'', tipo:'General', desc:'', activo:true, perms:defaultPerms('supervisor') };
  const dis = ro?'disabled':'';
  const titles = { create:'Nuevo rol', view:'Ver rol', edit:'Editar rol' };
  openDlg(`<div class="modal-h"><h3 class="rd-title"><span class="rd-tile">${icon('shield')}</span>${titles[mode]}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-b">
      <div class="grid-2">
        <div class="field"><label>Nombre del rol <span class="req">*</span></label><input class="input" id="rdNombre" value="${esc(R.nombre)}" ${dis}></div>
        <div class="field"><label>Tipo de usuario <span class="req">*</span></label><select class="select" id="rdTipo" ${dis}>${ROLE_TIPOS.map(t=>`<option ${t===R.tipo?'selected':''}>${t}</option>`).join('')}</select></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Descripción</label><input class="input" id="rdDesc" value="${esc(R.desc)}" ${dis}><div class="role-hint" id="rdHint"></div></div>
        <div class="field"><label>Estado</label><label class="toggle-switch"><input type="checkbox" id="rdEstado" ${R.activo?'checked':''} ${dis}><span class="track"></span><span class="tlabel">Activo</span></label></div>
      </div>
      <div class="field"><label>Alcance de los datos <span class="req">*</span></label><select class="select" id="rdAlcance" ${dis}>${ALCANCES.map(([v,l])=>`<option value="${v}" ${v===rolAlcance(R)?'selected':''}>${l}</option>`).join('')}</select>
        <div class="role-hint" id="rdAlcHint"></div></div>
      <div class="perm-section-title">Permisos del rol <small>(heredados según Tipo de Usuario)</small></div>
      <div class="perm-toolbar"><span class="perm-count" id="permCount"></span>
        ${ro?'':`<div class="perm-actions"><button type="button" class="btn btn-ghost btn-sm" id="rdAll">Marcar todo</button><button type="button" class="btn btn-ghost btn-sm" id="rdNone">Quitar todo</button><button type="button" class="btn btn-ghost btn-sm perm-reset" id="rdDef">${icon('refresh')}Restablecer defaults</button></div>`}</div>
      <div class="perm-tree"><div class="perm-tree-head"><span>Submenú</span><span>Ver</span><span>Crear</span><span>Editar</span><span>Anular</span></div>
        <div class="perm-malla"><span class="bar"></span>Malla de aplicaciones</div><div id="permBody"></div></div>
      <p class="perm-foot-note">Las acciones en gris no aplican a ese submenú.</p>
      <div class="login-err" id="rdErr" hidden></div>
    </div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>${ro?'Cerrar':'Cancelar'}</button>${ro?'':`<button type="button" class="btn btn-primary" id="rdSave">${icon('check')}Guardar</button>`}</div>`, 'modal role-dialog');
  bindClose();
  const hint = () => $('rdHint').textContent = $('rdTipo').value==='Vendedor' ? 'Vendedor: aparece en las listas de vendedores (clientes y pedidos asignables).' : '';
  const draw = () => {
    let on=0,total=0;
    $('permBody').innerHTML = PERM_TREE.map(g=>{
      let gOn=0, gTot=0;
      const rows = g.items.map(([k,label])=>`<div class="perm-item-row"><span>${esc(label)}</span>${PERM_ACTS.map(a=>{
        const ap = permApplies(k,a); if(!ap) R.perms[k][a]=0; if(ap) gTot++; if(R.perms[k][a]) gOn++;
        return `<label class="perm-pill ${ap?'':'na'}"><input type="checkbox" ${R.perms[k][a]?'checked':''} ${ro||!ap?'disabled':''} data-k="${k}" data-a="${a}"><span>${a[0].toUpperCase()+a.slice(1)}</span></label>`; }).join('')}</div>`).join('');
      on+=gOn; total+=gTot;
      return `<div class="perm-group"><div class="perm-group-row" data-tg><input type="checkbox" ${gOn===gTot?'checked':''} ${ro?'disabled':''} data-g="${g.key}" data-part="${gOn>0&&gOn<gTot?1:0}" onclick="event.stopPropagation()"><b>${g.label}</b><span class="pg-count">${gOn}/${gTot}</span><i class="pi pi-chevron-down pg-chev"></i></div>${rows}</div>`;
    }).join('');
    $('permCount').textContent = `${on} / ${total} permisos`;
    $('permBody').querySelectorAll('[data-part="1"]').forEach(c=>c.indeterminate=true);
    $('permBody').querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{ R.perms[c.dataset.k][c.dataset.a]=c.checked?1:0; draw(); });
    $('permBody').querySelectorAll('[data-g]').forEach(c=>c.onchange=()=>{ PERM_TREE.find(g=>g.key===c.dataset.g).items.forEach(([k])=>PERM_ACTS.forEach(a=>{ if(permApplies(k,a)) R.perms[k][a]=c.checked?1:0; })); draw(); });
    $('permBody').querySelectorAll('[data-tg]').forEach(r=>r.onclick=()=>r.closest('.perm-group').classList.toggle('collapsed'));
  };
  const alcHint = () => $('rdAlcHint').textContent = $('rdAlcance').value==='todos'
    ? 'Verá los clientes y pedidos de todos los vendedores (supervisión).' : 'Verá únicamente sus propios clientes y pedidos.';
  hint(); alcHint(); draw();
  if(ro) return;
  $('rdAlcance').onchange = alcHint;
  $('rdTipo').onchange = () => { hint(); $('rdAlcance').value = $('rdTipo').value==='Vendedor' ? 'propio' : 'todos'; alcHint(); };  // sugerencia, se puede cambiar
  $('rdAll').onclick  = ()=>{ PERM_KEYS.forEach(k=>PERM_ACTS.forEach(a=>R.perms[k][a]=permApplies(k,a)?1:0)); draw(); };
  $('rdNone').onclick = ()=>{ PERM_KEYS.forEach(k=>PERM_ACTS.forEach(a=>R.perms[k][a]=0)); draw(); };
  $('rdDef').onclick  = ()=>{ R.perms = defaultPerms($('rdTipo').value==='Vendedor'?'vendedor':'supervisor'); draw(); toast('Permisos restablecidos según el tipo de rol'); };
  $('rdSave').onclick = ()=>{
    const nombre = $('rdNombre').value.trim(), err = m => { $('rdErr').textContent=m; $('rdErr').hidden=false; };
    if(!nombre) return err('Ingresa el nombre del rol.');
    if(DB.roles.some(r=>r.id!==id && r.nombre.toLowerCase()===nombre.toLowerCase())) return err('Ya existe un rol con ese nombre.');
    const data = { nombre, tipo:$('rdTipo').value, alcance:$('rdAlcance').value, desc:$('rdDesc').value.trim(), activo:$('rdEstado').checked, perms:R.perms };
    if(orig){ renombrar('users','rol',orig.nombre,nombre); Object.assign(orig,data); toast('Rol actualizado'); }
    else { DB.roles.push({ id:nextId(DB.roles), ...data }); toast('Rol creado'); }
    saveDB(); closeDlg(); fillRoleFilter(); renderRoles(); renderUsuarios();
  };
}

/* =====================================================================
   3) TABLAS GENERALES
   ===================================================================== */
const TABLA_REF = {            // dónde se usa cada tabla (para propagar renombres)
  'Tipo de documento':['clientes','docTipo'], 'Prioridad':['tiposCliente','prioridad'], 'Etapa de venta':['clientes','stage'],
  'Unidad de medida':['productos','unidad'], 'Línea de producto':['productos','linea']
};
function renderTablas(){
  const q=$('tQ').value.toLowerCase(), tf=$('tTipo').value, ef=$('tEst').value;
  const list = DB.tablas.filter(t=>(t.n+t.d+t.cod).toLowerCase().includes(q) && (!tf||t.tipo===tf) && (!ef||String(t.activo?1:0)===ef));
  $('tCount').textContent = `${list.length} registros`;
  const slice = pager('t',$('tPager'),list.length,'registros',renderTablas)(list), ed = can('mant-tablas','editar');
  $('tGrid').innerHTML = slice.length ? slice.map(t=>`<tr class="${t.activo?'':'inactive'}"><td><strong class="table-code">${t.cod}</strong></td><td><strong>${esc(t.n)}</strong></td><td><span class="type-badge">${esc(t.tipo)}</span></td><td>${esc(t.d)}</td><td>${stBadge(t.activo)}</td>
    <td class="r nw">${act('view',`data-v="${t.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${t.id}"`,'Editar','pencil'):''}</td></tr>`).join('') : emptyRow(6,'No se encontraron registros');
  $('tGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>tablaForm(+b.dataset.v,true));
  $('tGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>tablaForm(+b.dataset.e));
}
function tablaForm(id=null, ro=false){
  const t = DB.tablas.find(x=>x.id===id);
  formDlg({ title: ro?'Ver registro':t?'Editar tabla general':'Nueva tabla general', ic:'table', readOnly:ro,
    values: t?{...t}:{ tipo:$('tTipo').value||TIPOS_TABLA[0], activo:true },
    fields:[ {k:'tipo',l:'Tipo de tabla',t:'select',opts:TIPOS_TABLA,req:1,full:1,disabled:!!t},{k:'n',l:'Nombre',req:1,ph:'Ej. Transferencia'},{k:'activo',l:'Estado',t:'toggle'},{k:'d',l:'Descripción',full:1} ],
    validate: d => DB.tablas.some(x=>x.id!==id && x.tipo===(t?t.tipo:d.tipo) && norm(x.n)===norm(d.n)) ? 'Ya existe ese valor en la tabla.' : '',
    onSave: d => {
      if(t){ const ref=TABLA_REF[t.tipo]; if(ref) renombrar(ref[0],ref[1],t.n,d.n); t.n=d.n; t.d=d.d; t.activo=d.activo; toast('Registro actualizado'); }
      else { DB.tablas.push({ id:nextId(DB.tablas), cod:'TG-'+String(nextId(DB.tablas)).padStart(2,'0'), ...d }); toast('Registro creado'); }
      saveDB(); fillFilters(); renderTablas();
    } });
}

/* =====================================================================
   4) PRODUCTOS  (carga masiva por código + eliminar con checkbox)
   ===================================================================== */
const selProd = new Set();
function renderProductos(){
  const q=$('pQ').value.toLowerCase(), lf=$('pLinea').value, ef=$('pEst').value;
  const list = DB.productos.filter(p=>(p.cod+p.nombre).toLowerCase().includes(q) && (!lf||p.linea===lf) && (!ef||String(p.activo?1:0)===ef));
  $('pCount').textContent = `${list.length} registros`;
  const slice = pager('p',$('pPager'),list.length,'productos',renderProductos)(list);
  const ed = can('mant-productos','editar'), del = can('mant-productos','anular');
  $('pGrid').innerHTML = slice.length ? slice.map(p=>`<tr class="${p.activo?'':'inactive'}">
    <td>${del?`<input type="checkbox" class="chk" data-s="${p.id}" ${selProd.has(p.id)?'checked':''} aria-label="Seleccionar ${esc(p.nombre)}">`:''}</td>
    <td><strong class="table-code">${esc(p.cod)}</strong></td><td><strong>${esc(p.nombre)}</strong><br><small style="color:var(--muted)">${esc(p.desc||'')}</small></td>
    <td>${p.linea?`<span class="type-badge">${esc(p.linea)}</span>`:'—'}</td><td class="nw">${esc(p.unidad)}${p.contenido>1?` <small style="color:var(--muted)">× ${p.contenido}</small>`:''}</td><td class="r nw"><b>${moneyFmt(p.precio)}</b></td><td>${stBadge(p.activo)}</td>
    <td class="r nw">${act('view',`data-v="${p.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${p.id}"`,'Editar','pencil'):''}</td></tr>`).join('') : emptyRow(8,'No se encontraron productos');
  $('pGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>productoForm(+b.dataset.v,true));
  $('pGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>productoForm(+b.dataset.e));
  $('pGrid').querySelectorAll('[data-s]').forEach(c=>c.onchange=()=>{ c.checked?selProd.add(+c.dataset.s):selProd.delete(+c.dataset.s); updSel(list); });
  $('pAll').onchange = e => { slice.forEach(p=>e.target.checked?selProd.add(p.id):selProd.delete(p.id)); renderProductos(); };
  $('pAll').checked = slice.length>0 && slice.every(p=>selProd.has(p.id)); $('pAll').hidden = !del;
  updSel(list);
}
function updSel(){
  [...selProd].forEach(id=>{ if(!DB.productos.some(p=>p.id===id)) selProd.delete(id); });
  $('pBar').hidden = !selProd.size;
  $('pSel').innerHTML = `<b>${selProd.size}</b> ${selProd.size===1?'producto seleccionado':'productos seleccionados'}`;
}
function productoForm(id=null, ro=false){
  const p = DB.productos.find(x=>x.id===id);
  formDlg({ title: ro?'Ver producto':p?'Editar producto':'Nuevo producto', ic:'box', readOnly:ro, wide:true,
    values: p?{...p}:{ unidad:tablaVals('Unidad de medida')[0], linea:'', activo:true, precio:'', contenido:1 },
    fields:[ {k:'cod',l:'Código',req:1,ph:'PRD-009'},{k:'nombre',l:'Nombre',req:1},{k:'desc',l:'Descripción',full:1},
      {k:'linea',l:'Línea',t:'select',opts:[['','— Sin línea —'],...tablaVals('Línea de producto')]},{k:'unidad',l:'Unidad de medida',t:'select',opts:tablaVals('Unidad de medida'),req:1},
      {k:'contenido',l:'Contenido por unidad',t:'number',min:1,step:1,req:1,hint:'Cuántas unidades trae cada Caja, Paquete o Docena (1 si se vende por unidad).'},
      {k:'precio',l:'Precio de venta (S/)',t:'number',req:1},{k:'activo',l:'Estado',t:'toggle'} ],
    validate: d => !(parseFloat(d.precio)>=0) ? 'El precio debe ser un número mayor o igual a 0.'
      : !(Number.isInteger(+d.contenido) && +d.contenido>=1) ? 'El contenido por unidad debe ser un número entero mayor o igual a 1.'
      : DB.productos.some(x=>x.id!==id && norm(x.cod)===norm(d.cod)) ? 'Ya existe un producto con ese código.' : '',
    onSave: d => {
      d.precio = parseFloat(d.precio); d.contenido = parseInt(d.contenido,10);
      if(p){ Object.assign(p,d); toast('Producto actualizado'); } else { DB.productos.push({ id:nextId(DB.productos), ...d }); toast('Producto creado'); }
      saveDB(); renderProductos();
    } });
}
function eliminarProductos(){
  const ids = [...selProd], nombres = DB.productos.filter(p=>ids.includes(p.id)).map(p=>p.nombre);
  confirmDlg({ title:'Eliminar productos', danger:true, ok:`Eliminar ${ids.length}`,
    msg:`¿Seguro que deseas eliminar <b>${ids.length}</b> ${ids.length===1?'producto':'productos'}?<br><small>${nombres.slice(0,5).map(esc).join(', ')}${nombres.length>5?` y ${nombres.length-5} más`:''}</small><br>Esta acción no se puede deshacer. Los pedidos ya creados conservan su detalle.`,
    onOk: ()=>{ DB.productos = DB.productos.filter(p=>!selProd.has(p.id)); selProd.clear(); saveDB(); renderProductos(); toast(`${ids.length} ${ids.length===1?'producto eliminado':'productos eliminados'}`); } });
}

/* --- Carga masiva: el match es por CÓDIGO. Solo agrega o actualiza; nunca borra. --- */
const COLS = { 'codigo':'cod', 'nombre':'nombre', 'descripcion':'desc', 'unidad':'unidad', 'precio':'precio', 'linea':'linea', 'estado':'estado',
  'contenido por unidad':'contenido', 'contenido':'contenido', 'cantidad por unidad':'contenido', 'unidades por paquete':'contenido' };
const NOMBRE_COL = { cod:'Código', nombre:'Nombre', desc:'Descripción', unidad:'Unidad', precio:'Precio', linea:'Línea', estado:'Estado', contenido:'Contenido por unidad' };
const listaCode = a => a.length ? a.map(x=>`<code>${esc(x)}</code>`).join(' ') : '<i>(sin valores)</i>';
/** Columnas que debe traer el Excel: nombre · obligatoria · qué contiene · ejemplo. */
const columnasCarga = () => [
  ['Código','Sí','Identifica al producto. Si el código ya existe se <b>actualiza</b>; si no existe se <b>agrega</b>.','PRD-009'],
  ['Nombre','Sí, en nuevos','Nombre comercial del producto.','Pesebre familiar'],
  ['Descripción','No','Texto libre.','Producto en caja'],
  ['Línea','No','Debe existir en Tablas generales › Línea de producto: '+listaCode(tablaVals('Línea de producto')),'Navidad'],
  ['Unidad','Sí, en nuevos','Debe existir en Tablas generales › Unidad de medida: '+listaCode(tablaVals('Unidad de medida')),'Caja'],
  ['Contenido por unidad','No','Cuántas unidades trae cada Caja, Paquete o Docena. Número entero ≥ 1 (vacío = 1; Docena = 12).','24'],
  ['Precio','Sí, en nuevos','Precio de venta en soles, número ≥ 0 (punto o coma decimal).','85.50'],
  ['Estado','No','<code>Activo</code> o <code>Inactivo</code> (vacío = Activo).','Activo']
];
const filaEjemploCarga = () => ({ 'Código':'EJEMPLO', 'Nombre':'Producto de ejemplo (borra esta fila)', 'Descripción':'Producto en caja', 'Línea':tablaVals('Línea de producto')[0]||'', 'Unidad':tablaVals('Unidad de medida')[0]||'Unidad', 'Contenido por unidad':24, 'Precio':25.5, 'Estado':'Activo' });
function cargarExcelJS(){
  if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
  return new Promise((res,rej)=>{
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
    s.onload = ()=>res(window.ExcelJS); s.onerror = ()=>rej(new Error('No se pudo cargar la librería de Excel'));
    document.head.appendChild(s);
  });
}
/** Plantilla de carga con el formato de los reportes SigOne: título sobre franja ámbar, encabezados ámbar con borde negro y listas desplegables. */
async function plantillaProductosXlsx(){
  const E = await cargarExcelJS(), wb = new E.Workbook(), ws = wb.addWorksheet('Productos', { views:[{ showGridLines:false, state:'frozen', ySplit:4 }] });
  const AMBAR = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFC000' } }, NEGRO = { argb:'FF000000' };
  const cols = [['Código',16],['Nombre',32],['Descripción',34],['Línea',20],['Unidad',16],['Contenido por unidad',22],['Precio',14],['Estado',14]];
  ws.columns = cols.map(([,w])=>({ width:w }));
  // Título (franja ámbar)
  ws.mergeCells('A1:H2'); ws.getRow(1).height = 22; ws.getRow(2).height = 22;
  const t = ws.getCell('A1'); t.value = 'PLANTILLA DE CARGA DE PRODUCTOS';
  t.font = { name:'Calibri', size:20, bold:true, color:NEGRO }; t.alignment = { horizontal:'center', vertical:'middle' };
  for(let r=1;r<=2;r++) for(let c=1;c<=8;c++) ws.getCell(r,c).fill = AMBAR;
  // Indicaciones
  ws.mergeCells('A3:H3'); const n = ws.getCell('A3');
  n.value = 'Completa los productos desde la fila 5 y borra la fila de ejemplo. Código obligatorio; Nombre, Unidad y Precio son obligatorios en productos nuevos. Si el código ya existe, el producto se actualiza.';
  n.font = { name:'Calibri', size:10, italic:true, color:{ argb:'FF595959' } }; n.alignment = { vertical:'middle', wrapText:true }; ws.getRow(3).height = 30;
  // Encabezados
  const h = ws.getRow(4); h.height = 21;
  cols.forEach(([nombre],i)=>{ const c = h.getCell(i+1); c.value = nombre; c.fill = AMBAR; c.font = { name:'Calibri', size:12, bold:true, color:NEGRO };
    c.alignment = { horizontal:'center', vertical:'middle' }; c.border = { top:{style:'medium',color:NEGRO}, bottom:{style:'medium',color:NEGRO}, left:{style:'medium',color:NEGRO}, right:{style:'medium',color:NEGRO} }; });
  // Fila de ejemplo + filas en blanco con borde fino
  const ej = Object.values(filaEjemploCarga());
  for(let r=5;r<=64;r++){
    const row = ws.getRow(r);
    for(let c=1;c<=8;c++){
      const cell = row.getCell(c);
      if(r===5){ cell.value = ej[c-1]; cell.font = { name:'Calibri', size:11, italic:true, color:{ argb:'FF7F7F7F' } }; }
      else cell.font = { name:'Calibri', size:11 };
      cell.border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
      cell.alignment = { vertical:'middle', horizontal:(c===6||c===7)?'right':'left' };
    }
    row.getCell(7).numFmt = '#,##0.00';
    // listas desplegables con los valores de Tablas generales
    const lista = (col, vals) => { if(vals.length) row.getCell(col).dataValidation = { type:'list', allowBlank:true, formulae:[`"${vals.join(',')}"`], showErrorMessage:true, errorTitle:'Valor no válido', error:'Elige un valor de la lista (Configuración › Tablas generales).' }; };
    lista(4, tablaVals('Línea de producto')); lista(5, tablaVals('Unidad de medida')); lista(8, ['Activo','Inactivo']);
    row.getCell(6).dataValidation = { type:'whole', operator:'greaterThanOrEqual', formulae:[1], allowBlank:true, showErrorMessage:true, errorTitle:'Contenido no válido', error:'Ingresa un número entero mayor o igual a 1.' };
    row.getCell(7).dataValidation = { type:'decimal', operator:'greaterThanOrEqual', formulae:[0], allowBlank:true, showErrorMessage:true, errorTitle:'Precio no válido', error:'Ingresa un número mayor o igual a 0.' };
  }
  const buf = await wb.xlsx.writeBuffer();
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf],{ type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = 'Plantilla de carga de Productos.xlsx'; a.click(); URL.revokeObjectURL(a.href);
}
function cargaMasiva(){
  let plan = null;
  openDlg(`${dlgHead('Carga masiva de productos','upload')}
    <div class="modal-b">
      <div>
        <div class="upl-step"><div><b class="n">1</b><b>Columnas del Excel</b> <small style="color:var(--muted)">· la primera fila del archivo debe tener estos encabezados</small></div>
          <button type="button" class="btn btn-ghost btn-sm" id="tplBtn" title="Descargar un Excel de ejemplo con las columnas">${icon('download')}Descargar plantilla</button></div>
        <div class="upl-guide" style="margin-top:10px"><table><thead><tr><th>Columna</th><th>Obligatoria</th><th>Qué debe contener</th><th>Ejemplo</th></tr></thead>
          <tbody>${columnasCarga().map(([c,o,d,e])=>`<tr><td class="nw"><b>${c}</b></td><td class="nw">${o}</td><td>${d}</td><td class="nw">${esc(e)}</td></tr>`).join('')}</tbody></table></div>
        <small style="color:var(--muted);display:block;margin-top:8px">El archivo <b>nunca elimina</b> productos: solo agrega los nuevos y actualiza los que ya existen.</small>
      </div>
      <div>
        <div class="upl-step"><div><b class="n">2</b><b>Sube tu archivo</b></div></div>
        <div class="upl-drop" style="margin-top:10px"><input type="file" id="bkFile" accept=".xlsx,.xls,.csv"><small style="color:var(--muted)">Excel (.xlsx, .xls) o CSV</small></div>
      </div>
      <div id="bkOut"></div>
    </div>
    <div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-primary" id="bkGo" disabled>${icon('check')}Cargar productos</button></div>`, 'modal upl-big');
  bindClose();
  const pinta = () => {
    $('bkOut').innerHTML = resumenCarga(plan);
    $('bkOut').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{ plan.vista=b.dataset.v; pinta(); });
    const n = plan.nuevos+plan.upd; $('bkGo').disabled = !n; $('bkGo').innerHTML = `${icon('check')}${n?`Cargar ${n} ${n===1?'producto':'productos'}`:'Cargar productos'}`;
  };
  $('tplBtn').onclick = async () => {
    try { await plantillaProductosXlsx(); toast('Plantilla descargada'); }
    catch(err){                                           // sin internet no se puede armar el Excel con formato: se baja una versión simple
      const r = await descargarExcel('Plantilla de carga de Productos',[ filaEjemploCarga() ],'Productos');
      toast(r==='xlsx'?'Plantilla descargada':'Plantilla descargada (CSV sin formato)');
    }
  };
  $('bkFile').onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    $('bkOut').innerHTML = '<p style="color:var(--muted)">Leyendo archivo…</p>'; $('bkGo').disabled = true;
    try { plan = planCarga(await leerExcel(f,'Código')); plan.vista = plan.errs ? 'err' : 'todos'; pinta(); $('bkOut').scrollIntoView({ block:'start', behavior:'smooth' }); }
    catch(err){ plan=null; $('bkOut').innerHTML = `<div class="upl-err">${esc(err.message||'No se pudo leer el archivo')}</div>`; }
  };
  $('bkGo').onclick = () => {
    if(!plan) return;
    plan.rows.filter(r=>!r.err).forEach(r=>{
      if(r.accion==='Actualizar') Object.assign(DB.productos.find(p=>p.id===r.id), r.data);
      else DB.productos.push({ id:nextId(DB.productos), ...r.data });
    });
    saveDB(); closeDlg(); renderProductos();
    toast(`Carga completada: ${plan.nuevos} nuevos, ${plan.upd} actualizados${plan.errs?`, ${plan.errs} con error (no se cargaron)`:''}`);
  };
}
function planCarga(raw){
  raw = raw.filter(r=>Object.values(r).some(v=>String(v).trim()!=='') && norm(r['Código']??r['Codigo']??'')!=='ejemplo');   // se ignoran las filas vacías y la fila de ejemplo de la plantilla
  if(!raw.length) throw new Error('El archivo no tiene filas con datos.');
  const heads = Object.keys(raw[0]), mapa = {}, extra = [];
  heads.forEach(h=>{ const c = COLS[norm(h)]; if(c) mapa[h]=c; else extra.push(h); });
  const tiene = new Set(Object.values(mapa));
  if(!tiene.has('cod')) throw new Error('No se encontró la columna "Código". Revisa los encabezados o descarga la plantilla.');
  const faltan = ['nombre','unidad','precio'].filter(c=>!tiene.has(c)).map(c=>NOMBRE_COL[c]);
  const unidades = tablaVals('Unidad de medida'), lineas = tablaVals('Línea de producto'), vistos = new Map();
  const rows = raw.map((r,i)=>{
    const o = {}; heads.forEach(h=>{ if(mapa[h]) o[mapa[h]] = String(r[h]).trim(); });
    const fila = i+2, err = [];
    if(!o.cod) err.push('Falta el código');
    else if(vistos.has(norm(o.cod))) err.push(`Código repetido (ya está en la fila ${vistos.get(norm(o.cod))})`);
    else vistos.set(norm(o.cod), fila);
    const prev = o.cod ? DB.productos.find(p=>norm(p.cod)===norm(o.cod)) : null, nuevo = !prev;
    // Nombre / unidad / precio: obligatorios solo al crear; al actualizar, si vienen vacíos se conserva lo que ya tenía
    if(!o.nombre && nuevo) err.push('Falta el nombre');
    let unidad = prev?prev.unidad:'';
    if(o.unidad){ unidad = unidades.find(u=>norm(u)===norm(o.unidad)); if(!unidad) err.push(`La unidad "${o.unidad}" no existe en Tablas generales`); }
    else if(nuevo) err.push('Falta la unidad');
    let precio = prev?prev.precio:NaN;
    if(o.precio!==undefined && o.precio!==''){ precio = parseFloat(String(o.precio).replace(',','.')); if(!(precio>=0)) err.push(`Precio inválido "${o.precio}"`); }
    else if(nuevo) err.push('Falta el precio');
    let linea = prev?prev.linea:'';
    if(o.linea){ linea = lineas.find(l=>norm(l)===norm(o.linea)); if(linea===undefined) err.push(`La línea "${o.linea}" no existe en Tablas generales`); }
    let contenido = prev&&prev.contenido ? prev.contenido : (norm(unidad)==='docena'?12:1);
    if(o.contenido!==undefined && o.contenido!==''){ const n = Number(String(o.contenido).replace(',','.')); if(Number.isInteger(n)&&n>=1) contenido = n; else err.push(`Contenido por unidad inválido "${o.contenido}" (entero ≥ 1)`); }
    let activo = prev?prev.activo:true;
    if(o.estado){ if(/^(activo|1|si|sí)$/i.test(o.estado)) activo = true; else if(/^(inactivo|0|no)$/i.test(o.estado)) activo = false; else err.push(`Estado "${o.estado}" no válido (Activo o Inactivo)`); }
    return { fila, accion: nuevo?'Agregar':'Actualizar', id:prev&&prev.id, err:err.join(' · '),
      data:{ cod:o.cod, nombre:o.nombre||(prev&&prev.nombre)||'', desc:o.desc!==undefined?o.desc:(prev?prev.desc:''), linea:linea||'', unidad:unidad||'', contenido, precio, activo } };
  });
  return { rows, faltan, extra, vista:'todos',
    nuevos:rows.filter(r=>!r.err&&r.accion==='Agregar').length, upd:rows.filter(r=>!r.err&&r.accion==='Actualizar').length, errs:rows.filter(r=>r.err).length };
}
function resumenCarga(p){
  const ok = p.nuevos+p.upd, vista = p.vista||'todos';
  const filas = p.rows.filter(r=>vista==='err'?r.err:vista==='ok'?!r.err:true);
  return `<div class="upl-sum"><div><b style="color:var(--green)">${p.nuevos}</b><small>Nuevos</small></div><div><b style="color:var(--blue)">${p.upd}</b><small>Se actualizan</small></div><div><b style="color:var(--red)">${p.errs}</b><small>Con error</small></div></div>
    ${p.faltan.length?`<div class="upl-warn"><b>Faltan columnas en el archivo:</b> ${p.faltan.join(', ')}. Los productos nuevos no se podrán cargar sin ellas.</div>`:''}
    ${p.extra.length?`<div class="upl-warn">Columnas no reconocidas (se ignoran): ${p.extra.map(esc).join(', ')}.</div>`:''}
    ${p.errs?`<div class="upl-err">Hay <b>${p.errs} ${p.errs===1?'fila con error':'filas con error'}</b>: no se cargará${p.errs===1?'':'n'}. ${ok?`Las otras ${ok} sí se cargarán.`:'Corrige el archivo y vuelve a subirlo.'}</div>`:''}
    <div class="upl-chips">${[['todos','Todas',p.rows.length],['ok','Se cargarán',ok],['err','Con error',p.errs]].map(([v,l,n])=>`<button type="button" data-v="${v}" class="${vista===v?'on':''}">${l} (${n})</button>`).join('')}</div>
    <div class="upl-tbl"><table><thead><tr><th>Fila</th><th>Resultado</th><th>Código</th><th>Nombre</th><th>Línea</th><th>Unidad</th><th class="num">Contenido</th><th class="num">Precio</th><th>Observación</th></tr></thead>
      <tbody>${filas.map(r=>`<tr class="${r.err?'bad':''}"><td>${r.fila}</td><td><span class="badge ${r.err?'red':r.accion==='Agregar'?'green':'blue'}">${r.err?'Error':r.accion}</span></td>
        <td><b>${esc(r.data.cod||'—')}</b></td><td>${esc(r.data.nombre||'—')}</td><td>${esc(r.data.linea||'—')}</td><td>${esc(r.data.unidad||'—')}</td>
        <td class="num">${r.data.contenido||'—'}</td><td class="num">${isNaN(r.data.precio)?'—':moneyFmt(r.data.precio)}</td><td class="obs">${esc(r.err)}</td></tr>`).join('')||`<tr><td colspan="9" class="empty-cell">No hay filas en esta vista</td></tr>`}</tbody></table></div>`;
}

/* =====================================================================
   5) TIPO DE CLIENTE  (nombre · descripción · prioridad desde Tablas generales · color)
   ===================================================================== */
function renderTipos(){
  const q=$('cQ').value.toLowerCase(), pf=$('cPrio').value, ef=$('cEst').value;
  const list = DB.tiposCliente.filter(t=>(t.nombre+t.desc).toLowerCase().includes(q) && (!pf||t.prioridad===pf) && (!ef||String(t.activo?1:0)===ef))
    .sort((a,b)=>prioRank(a.prioridad)-prioRank(b.prioridad));
  $('cCount').textContent = `${list.length} registros`;
  const ed = can('mant-tipocliente','editar');
  const slice = pager('c',$('cPager'),list.length,'tipos',renderTipos)(list);
  $('cGrid').innerHTML = slice.length ? slice.map(t=>{ const n = DB.clientes.filter(c=>c.cat===t.nombre).length;
    return `<tr class="${t.activo?'':'inactive'}"><td><span class="tipo-pill" style="--c:${t.color}">${esc(t.nombre)}</span></td><td>${esc(t.desc||'—')}</td>
      <td><span class="type-badge">${esc(t.prioridad)}</span></td><td><span class="dot" style="--c:${t.color}"></span><code>${t.color.toUpperCase()}</code></td>
      <td><span class="users-badge">${n} ${n===1?'cliente':'clientes'}</span></td><td>${stBadge(t.activo)}</td>
      <td class="r nw">${act('view',`data-v="${t.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${t.id}"`,'Editar','pencil'):''}</td></tr>`; }).join('') : emptyRow(7,'No se encontraron tipos de cliente');
  $('cGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>tipoForm(+b.dataset.v,true));
  $('cGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>tipoForm(+b.dataset.e));
}
function tipoForm(id=null, ro=false){
  const t = DB.tiposCliente.find(x=>x.id===id);
  formDlg({ title: ro?'Ver tipo de cliente':t?'Editar tipo de cliente':'Nuevo tipo de cliente', ic:'star', readOnly:ro,
    values: t?{...t}:{ prioridad:tablaVals('Prioridad')[0], color:'#3B6FE0', activo:true },
    fields:[ {k:'nombre',l:'Nombre',req:1,ph:'Ej. Alto valor'},{k:'prioridad',l:'Prioridad',t:'select',opts:tablaVals('Prioridad'),req:1,hint:'Valores de Tablas generales. Los clientes de mayor prioridad se listan primero en Conversaciones.'},
      {k:'desc',l:'Descripción',full:1},{k:'color',l:'Color',t:'color'},{k:'activo',l:'Estado',t:'toggle'} ],
    validate: d => DB.tiposCliente.some(x=>x.id!==id && norm(x.nombre)===norm(d.nombre)) ? 'Ya existe un tipo con ese nombre.'
      : (!d.activo && t && DB.clientes.some(c=>c.cat===t.nombre && c.estado==='Activo')) ? 'Hay clientes activos con este tipo: reasígnalos antes de desactivarlo.' : '',
    onSave: d => {
      if(t){ renombrar('clientes','cat',t.nombre,d.nombre); Object.assign(t,d); toast('Tipo de cliente actualizado'); }
      else { DB.tiposCliente.push({ id:nextId(DB.tiposCliente), ...d }); toast('Tipo de cliente creado'); }
      saveDB(); fillFilters(); renderTipos();
    } });
}

/* =====================================================================
   6) CLIENTES  (maestro; cada cambio genera historial)
   ===================================================================== */
function renderClientes(){
  const q=$('kQ').value.toLowerCase(), tf=$('kTipo').value, ef=$('kEst').value;
  const list = DB.clientes.filter(c=>(c.nombre+c.empresa+c.docNum).toLowerCase().includes(q) && (!tf||c.cat===tf) && (!ef||String(c.estado==='Activo'?1:0)===ef));
  $('kCount').textContent = `${list.length} registros`;
  const slice = pager('k',$('kPager'),list.length,'clientes',renderClientes)(list), ed = can('mant-clientes','editar');
  $('kGrid').innerHTML = slice.length ? slice.map(c=>`<tr class="${c.estado==='Activo'?'':'inactive'}">
    <td class="nw"><div style="display:flex;gap:12px;align-items:center"><div class="avatar ${AV[c.id%5]}" style="width:28px;height:28px;font-size:11px">${ini(clienteNombre(c))}</div><div style="min-width:0"><b>${esc(clienteNombre(c))}</b></div></div></td>
    <td class="nw">${esc(c.docTipo)}</td><td class="nw">${esc(c.docNum)}</td>
    <td class="nw"><b>${esc(c.nombre)}</b><br><small style="color:var(--muted)">${esc(c.cel)} · ${esc(c.mail)}</small></td>
    <td class="nw"><span class="tipo-pill" style="--c:${(tipoCliente(c.cat)||{}).color||'#8A92A6'}">${esc(c.cat)}</span></td><td>${stBadge(c.estado==='Activo')}</td>
    <td class="r nw">${act('view',`data-v="${c.id}"`,'Ver','eye')}${ed?act('edit',`data-e="${c.id}"`,'Editar','pencil')+(c.estado==='Activo'?act('delete',`data-x="${c.id}"`,'Anular cliente','ban'):act('ok',`data-x="${c.id}"`,'Activar cliente','check')):''}</td></tr>`).join('') : emptyRow(7,'No se encontraron clientes');
  $('kGrid').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>clienteForm(+b.dataset.v,true));
  $('kGrid').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>clienteForm(+b.dataset.e));
  $('kGrid').querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{
    const c = DB.clientes.find(x=>x.id===+b.dataset.x), anular = c.estado==='Activo';
    confirmDlg({ title: anular?'Anular cliente':'Activar cliente', ok: anular?'Anular':'Activar', danger: anular,
      msg: anular ? `¿Anular a <b>${esc(clienteNombre(c))}</b>? Dejará de aparecer en Conversaciones y Cartera; sus pedidos se conservan.` : `¿Activar nuevamente a <b>${esc(clienteNombre(c))}</b>?`,
      onOk: ()=>{ aplicarCambiosCliente(c,'info',{ estado: anular?'Inactivo':'Activo' }); renderClientes(); toast(anular?'Cliente anulado':'Cliente activado'); } });
  });
}
function clienteForm(id=null, ro=false){
  const c = DB.clientes.find(x=>x.id===id), S = clienteSections().info;
  // La asignación de vendedor se hace fuera de Configuración (Cartera), por eso no se edita aquí
  const fields = S.f.filter(([k])=>k!=='vendedor').map(([k,l,t,opts])=>({ k, l, t:t==='select'?'select':(t||'text'), opts, req:['nombre','docNum','cel','mail','cat'].includes(k), full:k==='dir' }));
  formDlg({ title: ro?'Ver cliente':c?'Editar cliente':'Nuevo cliente', ic:'users', readOnly:ro, wide:true, fields,
    values: c?{...c}:{ docTipo:'RUC', estado:'Activo', cat:(tiposActivos()[0]||{}).nombre },
    validate: d => (d.docTipo==='RUC' && !String(d.empresa||'').trim()) ? 'Ingresa la empresa (cliente con RUC).' : !/^\d{9}$/.test(d.cel) ? 'El celular debe tener 9 dígitos.' : !/^\S+@\S+\.\S+$/.test(d.mail) ? 'Ingresa un correo válido.'
      : (d.docTipo==='RUC'&&!/^\d{11}$/.test(d.docNum)) ? 'El RUC debe tener 11 dígitos.' : (d.docTipo==='DNI'&&!/^\d{8}$/.test(d.docNum)) ? 'El DNI debe tener 8 dígitos.'
      : DB.clientes.some(x=>x.id!==id && x.docNum===d.docNum && x.docTipo===d.docTipo) ? 'Ya existe un cliente con ese documento.' : '',
    onSave: d => {
      if(c){ const n = aplicarCambiosCliente(c,'info',d); toast(n?`${n} ${n===1?'cambio guardado':'cambios guardados'} en el historial`:'No hay cambios para guardar'); }
      else { nuevoCliente(d); toast(currentUser().alcance==='propio' ? 'Cliente creado y asignado a ti' : 'Cliente creado (queda sin asignar; se asigna en Cartera)'); }       // queda sin asignar
      saveDB(); renderClientes();
    } });
}

/* =====================================================================
   Filtros, navegación y arranque
   ===================================================================== */
function fillFilters(){
  const keep = (id,html)=>{ const el=$(id), v=el.value; el.innerHTML=html; el.value=[...el.options].some(o=>o.value===v)?v:''; };
  const opts = (first,list)=>`<option value="">${first}</option>`+list.map(x=>`<option>${esc(x)}</option>`).join('');
  keep('tTipo', opts('Todos',TIPOS_TABLA)); keep('pLinea', opts('Todas',tablaVals('Línea de producto')));
  keep('cPrio', opts('Todas',tablaVals('Prioridad'))); keep('kTipo', opts('Todos',DB.tiposCliente.map(t=>t.nombre)));
}
const SECTIONS = {
  'sec-usuarios':   { render:()=>{ resetPage('u'); renderUsuarios(); } },
  'sec-roles':      { render:()=>{ resetPage('r'); renderRoles(); } },
  'sec-tablas':     { render:()=>{ resetPage('t'); renderTablas(); } },
  'sec-productos':  { render:()=>{ resetPage('p'); renderProductos(); } },
  'sec-tipocliente':{ render:()=>{ resetPage('c'); renderTipos(); } },
  'sec-clientes':   { render:()=>{ resetPage('k'); renderClientes(); } }
};
function showSection(id){ document.querySelectorAll('.cfg-section').forEach(s=>s.hidden = s.id!==id); }

document.addEventListener('DOMContentLoaded',()=>{
  const u = currentUser();
  $('userHost').innerHTML = userMenuHTML(u,[{href:'inicio.html',icon:'back',label:'Volver al CRM'}]); bindUserMenu();
  const shell = $('configShell'), toggle = ()=>shell.classList.toggle('is-collapsed');
  $('btnMenu').onclick = toggle; $('btnMenuMobile').onclick = toggle;
  fillRoleFilter(); fillFilters();

  // Menú lateral: solo se ven las opciones con permiso "ver"
  const links = [...document.querySelectorAll('#cfgNav .menu-link')];
  links.forEach(a=>{ if(!can(a.dataset.perm)) a.hidden = true; });
  document.querySelectorAll('#cfgNav .menu-section').forEach(s=>{ s.hidden = ![...s.querySelectorAll('.menu-link')].some(a=>!a.hidden); });
  const go = a => {
    links.forEach(x=>x.classList.toggle('active',x===a)); showSection(a.dataset.cfg);
    $('tbTitle').textContent = `${a.dataset.grp} › ${a.dataset.title}`; SECTIONS[a.dataset.cfg].render();
    try{ sessionStorage.setItem('cfg_last',a.dataset.cfg); }catch(e){}
  };
  links.forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); go(a); }));
  let last = null; try{ last = sessionStorage.getItem('cfg_last'); }catch(e){}
  const first = links.find(a=>!a.hidden && a.dataset.cfg===last) || links.find(a=>!a.hidden); if(first) go(first);

  // Botones "Nuevo" según permiso "crear"
  const bind = (id,perm,fn)=>{ const b=$(id); if(!can(perm,'crear')) b.hidden=true; else b.onclick=fn; };
  bind('uNew','seg-usuarios',()=>usuarioForm()); bind('rNew','seg-roles',()=>rolForm(null,'create')); bind('tNew','mant-tablas',()=>tablaForm());
  bind('pNew','mant-productos',()=>productoForm()); bind('pBulk','mant-productos',cargaMasiva);
  bind('cNew','mant-tipocliente',()=>tipoForm()); bind('kNew','mant-clientes',()=>clienteForm());
  $('pDel').onclick = eliminarProductos;

  // Filtros: se aplican al escribir/cambiar y al pulsar "Filtrar"
  const wire = (form, ids, resetId, fn) => {
    $(form).addEventListener('submit',e=>{ e.preventDefault(); if(resetId) resetPage(resetId); fn(); });
    ids.forEach(i=>$(i).addEventListener('input',()=>{ if(resetId) resetPage(resetId); fn(); }));
  };
  wire('uFilters',['uQ','uRol','uEst'],'u',renderUsuarios); wire('rFilters',['rQ','rTipo','rEst'],'r',renderRoles); wire('tFilters',['tQ','tTipo','tEst'],'t',renderTablas);
  wire('pFilters',['pQ','pLinea','pEst'],'p',renderProductos); wire('cFilters',['cQ','cPrio','cEst'],'c',renderTipos); wire('kFilters',['kQ','kTipo','kEst'],'k',renderClientes);

  $('dlg').addEventListener('click',e=>{ if(e.target===$('dlg')) closeDlg(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDlg(); });
});
})();
