/* =====================================================================
   SigOne CRM · Datos compartidos entre páginas (prototipo, sin backend)
   Se guarda en localStorage para que lo creado en Configuración (usuarios,
   productos, tipos de cliente…) aparezca en Conversaciones y Pedidos.
   Para volver a los datos de ejemplo:  resetDB()  en la consola del navegador.
   ===================================================================== */
const DB_KEY = 'sigone_crm_db_v2';

/* ---------- Permisos: árbol de menús y acciones ---------- */
const PERM_ACTS = ['ver','crear','editar','anular'];
const PERM_TREE = [
  { key:'ops',  label:'Operaciones',  items:[['inicio','Inicio · Dashboard',['ver']],['conversaciones','Conversaciones',['ver','crear','editar']],['pedidos','Pedidos',['ver','crear','editar']],['cartera','Cartera de clientes',['ver','crear','editar']],['metas','Metas de vendedores',['ver','crear','editar']]] },
  { key:'seg',  label:'Seguridad',    items:[['seg-usuarios','Usuarios',['ver','crear','editar']],['seg-roles','Roles y permisos',['ver','crear','editar']]] },
  { key:'mant', label:'Mantenedores', items:[['mant-productos','Productos'],['mant-tipocliente','Tipo de cliente',['ver','crear','editar']],['mant-clientes','Clientes',['ver','crear','editar']],['mant-tablas','Tablas generales',['ver','crear','editar']]] }
];
/* Tercer valor de cada ítem = acciones que aplican a ese menú (las demás se muestran en gris) */
const permApplies = (k,a) => { for(const g of PERM_TREE){ const it=g.items.find(i=>i[0]===k); if(it) return !it[2] || it[2].includes(a); } return true; };
const PERM_KEYS = PERM_TREE.flatMap(g=>g.items.map(i=>i[0]));
const ROLE_TIPOS = ['General','Vendedor'];
/* Alcance de datos del rol: 'todos' = ve lo de todos los usuarios · 'propio' = solo lo suyo (sus clientes y pedidos) */
const ALCANCES = [['todos','Todos los usuarios (ve todo de todos)'],['propio','Solo lo suyo (sus clientes y pedidos)']];
const rolAlcance = r => (r && r.alcance) || (r && r.tipo==='Vendedor' ? 'propio' : 'todos');
const _p = (v,c,e,a) => ({ver:v,crear:c,editar:e,anular:a});
function defaultPerms(kind){
  const o = {};
  PERM_KEYS.forEach(k=>{
    if(kind==='full') o[k]=_p(1,1,1,1);
    else if(kind==='supervisor'){
      if(k==='seg-usuarios'||k==='seg-roles') o[k]=_p(1,0,0,0);
      else if(k.startsWith('seg-')) o[k]=_p(1,1,1,0);
      else o[k]=_p(1,1,1,0);
    } else { // vendedor
      if(k==='conversaciones') o[k]=_p(1,1,1,0);
      else if(k==='pedidos') o[k]=_p(1,1,1,0);
      else if(k==='inicio'||k==='metas') o[k]=_p(1,0,0,0);
      else o[k]=_p(0,0,0,0);
    }
  });
  return o;
}

/* ---------- Nombre visible del cliente ----------
   El cliente es la EMPRESA (razón social). Si es persona natural (sin empresa) se muestra su nombre.
   "nombre" guarda el contacto (o la persona natural). */
const _hayEmp = c => !!(c && c.empresa && c.empresa!=='-');
const clienteNombre = c => c ? (_hayEmp(c) ? c.empresa : (c.nombre||'—')) : '—';
const clienteContacto = c => _hayEmp(c) ? (c.nombre||'') : 'Persona natural';

/** Metas mensuales por vendedor (Metas › Asignar metas): ventas (S/) y número de pedidos. */
function metasDemo(){
  const base = { 'Juan Perez':[70000,200], 'Carlos Ramírez':[60000,180], 'Lucía Fernández':[50000,140] };
  let id = 0;
  return [['Octubre 2026',1],['Septiembre 2026',.93],['Agosto 2026',.9]].flatMap(([periodo,f])=>Object.entries(base).map(([vendedor,[v,p]])=>
    ({ id:++id, vendedor, periodo, metaVentas:Math.round(v*f/1000)*1000, metaPedidos:Math.round(p*f/5)*5 })));
}

/** Contenido por unidad: cuántas unidades trae cada Caja / Paquete / Docena (1 si se vende por unidad). */
const _CONT = { 'PRD-001':6, 'PRD-002':10, 'PRD-004':24, 'PRD-008':12 };
const normProd = p => { if(p.contenido==null) p.contenido = _CONT[p.cod] || (p.unidad==='Docena'?12:1); return p; };

/* ---------- Datos iniciales ---------- */
const CLI_BASE = { vendedor:'Juan Perez', canales:'Conversaciones de whatsapp', horario:'En la mañana a partir de las 08:00 am', lineas:'Productos navideños', interes:'Pesebres, luces de navidad', obs:'-', estado:'Activo', docTipo:'RUC' };
/** 25 clientes de ejemplo para la cartera (los 3 últimos quedan sin asignar). */
function clientesDemo(startId){
  const EMP = ['Comercial Lima Norte','Importaciones Pacífico','Grupo Inca Retail','Ferretería El Sol','Ilumina Perú SAC','Decoraciones Rímac','Navidad Express','Casa Hogar Surco','Mercado Mayorista Sur','Tiendas Miraflores','Corporación Quispe','Boutique Navideña','Ventas del Centro','Hogar & Estilo','Luces del Norte','Almacenes Callao','Proveedora Chorrillos','Mega Fiestas SAC','Regalos Premium','Bazar San Isidro','Comercial Barranco','Detalles Lince','Importadora Oriente','Tiendas La Molina','Distribuciones Ate'];
  const CON = ['Carla Mendoza','Jorge Salinas','Diana Rojas','Hugo Paredes','Elena Cárdenas','Víctor Soto','Natalia Ríos','Óscar Delgado','Pilar Aguirre','Raúl Campos','Silvia Luna','Mario Vargas','Teresa Ochoa','Iván Zegarra','Gloria Bravo','Felipe Núñez','Karen Valdez','Julio Espinoza','Mónica Tapia','Adrián Cueva','Lorena Peralta','Sergio Mejía','Úrsula Cabrera','Daniel Ponce','Rocío Alarcón'];
  const VEN = ['Juan Perez','Carlos Ramírez','Lucía Fernández'], CATS = ['Alto valor','Regular','En seguimiento','Sin calificar'], ETA = ['Nuevo','En seguimiento','Por confirmar','Cerrado'], CIU = ['Lima','Arequipa','Trujillo','Cusco','Piura'];
  return EMP.map((e,i)=>{
    const libre = i>=22, slug = e.toLowerCase().normalize('NFD').replace(/[^a-z]/g,'');
    return { id:startId+i, ...CLI_BASE, nombre:CON[i], empresa:e, cargo:['Compras','Gerente','Administrador','Jefe de compras'][i%4],
      docNum:'20'+String(600000000+i*104729).padStart(9,'0'), cel:'9'+String(10000000+i*23757).slice(0,8), mail:`contacto@${slug.slice(0,14)}.pe`, dir:CIU[i%5],
      vendedor: libre?'':VEN[i%3], cat: libre?'Sin calificar':CATS[(i*7)%4], stage: libre?'Nuevo':ETA[i%4], time:'Ayer, 05:00 pm',
      ult:'—', prox:'—', prim:`${String(1+(i*5)%27).padStart(2,'0')}/0${1+i%9}/2026`, ventas:0, antig:'00' };
  });
}
function seedDB(){
  const base = CLI_BASE;
  const T = (tipo,list)=>list.map(([n,d])=>({tipo,n,d,activo:true}));
  const tablas = [
    ...T('Tipo de documento',[['DNI','Documento Nacional de Identidad'],['RUC','Registro Único de Contribuyentes'],['CE','Carné de extranjería'],['Pasaporte','Pasaporte']]),
    ...T('Prioridad',[['Alta','Se atiende primero'],['Media','Atención estándar'],['Baja','Atención cuando haya disponibilidad']]),
    ...T('Etapa de venta',[['Nuevo','Cliente recién registrado'],['En seguimiento','Conversación en curso'],['Por confirmar','A la espera de confirmación'],['Cerrado','Venta concretada']]),
    ...T('Forma de pago',[['Contado','Pago al contado'],['Crédito 15 días','Crédito a 15 días'],['Crédito 30 días','Crédito a 30 días']]),
    ...T('Método de pago',[['Transferencia','Transferencia bancaria'],['Efectivo','Pago en efectivo'],['Yape / Plin','Billetera digital'],['Tarjeta','Tarjeta de crédito o débito']]),
    ...T('Comprobante de pago',[['Factura electrónica','Con RUC'],['Boleta electrónica','Con DNI']]),
    ...T('Unidad de medida',[['Unidad','Unidad'],['Caja','Caja'],['Paquete','Paquete'],['Docena','12 unidades']]),
    ...T('Línea de producto',[['Navidad','Productos navideños'],['Decoración','Decoración del hogar'],['Hogar','Artículos para el hogar']])
  ].map((r,i)=>({ id:i+1, cod:'TG-'+String(i+1).padStart(2,'0'), ...r }));
  const prod = (cod,nombre,desc,unidad,precio,linea)=>({ id:0, cod, nombre, desc, unidad, precio, linea, activo:true });
  const productos = [
    prod('PRD-001','Pesebre familiar','Producto en caja','Caja',85,'Navidad'),
    prod('PRD-002','Luces navideñas x100','Producto en caja','Caja',20,'Navidad'),
    prod('PRD-003','Árbol navideño 1.8 m','Producto en caja','Caja',150,'Navidad'),
    prod('PRD-004','Pack de esferas x24','Producto en caja','Paquete',35,'Navidad'),
    prod('PRD-005','Guirnalda dorada 2 m','Producto en bolsa','Unidad',12,'Decoración'),
    prod('PRD-006','Corona navideña 40 cm','Producto en caja','Unidad',48,'Decoración'),
    prod('PRD-007','Santa Claus decorativo','Producto en caja','Unidad',65,'Navidad'),
    prod('PRD-008','Cinta decorativa 10 m','Producto en bolsa','Docena',54,'Decoración')
  ].map((p,i)=>normProd({...p,id:i+1}));
  const mk = (id,o)=>({ id, ...base, ...o });
  const clientes = [
    mk(1,{ nombre:'Andrea Paredes', cat:'Alto valor',     stage:'Por confirmar',  time:'Ayer, 05:00 pm', empresa:'Sigcomt S.A.C.',         docNum:'20512345678', cargo:'Administrador',   cel:'999383211', mail:'bjimenez@sigcomt.com', dir:'Lima',     ult:'19/10/2026 10:50 am', prox:'29/10/2026 10:50 am', prim:'01/07/2026', ventas:20, antig:'01' }),
    mk(2,{ nombre:'Luis Quispe', cat:'Regular',        stage:'En seguimiento', time:'Ayer, 05:00 pm', empresa:'Distribuidora Andina',   docNum:'20498765432', cargo:'Compras',         cel:'987654321', mail:'compras@andina.pe',    dir:'Arequipa', ult:'18/10/2026 04:20 pm', prox:'25/10/2026 09:00 am', prim:'12/03/2026', ventas:8,  antig:'01', vendedor:'Carlos Ramírez', lineas:'Decoración', interes:'Árboles navideños' }),
    mk(3,{ nombre:'Marco Salazar Rojas', cat:'Sin calificar',  stage:'Nuevo',          time:'Ayer, 05:00 pm', empresa:'',       docNum:'45678901', docTipo:'DNI', cargo:'Independiente', cel:'955112233', mail:'gerencia@bazarlo.pe',  dir:'Lima',     ult:'17/10/2026 11:10 am', prox:'22/10/2026 03:00 pm', prim:'15/10/2026', ventas:0,  antig:'00', vendedor:'Lucía Fernández', horario:'Por la tarde, de 02:00 a 06:00 pm', interes:'Luces de navidad' }),
    mk(4,{ nombre:'Patricia Vega', cat:'Alto valor',     stage:'Cerrado',        time:'Ayer, 05:00 pm', empresa:'Comercial Pacífico',     docNum:'20601234567', cargo:'Jefe de compras', cel:'944778899', mail:'jcompras@pacifico.pe', dir:'Trujillo', ult:'12/10/2026 09:30 am', prox:'—',                  prim:'20/01/2025', ventas:34, antig:'02', lineas:'Productos navideños, hogar', interes:'Esferas, guirnaldas', obs:'Prefiere factura electrónica' }),
    mk(5,{ nombre:'Marta Huamán', cat:'En seguimiento', stage:'En seguimiento', time:'Ayer, 05:00 pm', empresa:'Regalos & Más E.I.R.L.', docNum:'20587654321', cargo:'Propietaria',     cel:'933445566', mail:'ventas@regalosymas.pe',dir:'Cusco',    ult:'16/10/2026 06:45 pm', prox:'27/10/2026 10:00 am', prim:'03/05/2026', ventas:5,  antig:'01', vendedor:'Carlos Ramírez', canales:'Llamadas y whatsapp', interes:'Pesebres' })
  ];
  clientes.push(...clientesDemo(clientes.length+1));
  const it = (n,q,p)=>({n,q,p});
  const ped = (id,clienteId,vendedor,fecha,est,pago,metodo,comp,items,obs='')=>({ id, clienteId, vendedor, fecha, est, pago, metodo, comp, items, obs, envFecha: est==='Enviado'?fecha+' 12:00':'' });
  const pedidos = [
    ped('PED-0013',1,'Juan Perez',     '2026-10-10','Enviado',  'Contado','Transferencia','Factura electrónica',[it('Luces navideñas x100',10,20)]),
    ped('PED-0012',1,'Juan Perez',     '2026-09-18','Enviado',  'Contado','Yape / Plin','Boleta electrónica',[it('Pesebre familiar',2,85),it('Pack de esferas x24',3,35)]),
    ped('PED-0007',1,'Juan Perez',     '2026-09-02','Enviado',  'Crédito 15 días','Transferencia','Factura electrónica',[it('Árbol navideño 1.8 m',2,150),it('Luces navideñas x100',2,20)]),
    ped('PED-0014',2,'Carlos Ramírez', '2026-10-19','Pendiente','Crédito 30 días','Transferencia','Factura electrónica',[it('Árbol navideño 1.8 m',4,150),it('Guirnalda dorada 2 m',10,12)]),
    ped('PED-0015',3,'Lucía Fernández','2026-10-20','Pendiente','Contado','Efectivo','Boleta electrónica',[it('Luces navideñas x100',5,20)]),
    ped('PED-0016',4,'Juan Perez',     '2026-10-21','Pendiente','Contado','Transferencia','Factura electrónica',[it('Pack de esferas x24',12,35),it('Corona navideña 40 cm',6,48)]),
    ped('PED-0011',5,'Carlos Ramírez', '2026-09-25','Enviado',  'Contado','Yape / Plin','Boleta electrónica',[it('Pesebre familiar',3,85)])
  ];
  const roles = [
    { id:1, nombre:'Administrador', tipo:'General',  alcance:'todos',  desc:'Acceso total: seguridad, mantenedores, conversaciones y pedidos.', activo:true, perms:defaultPerms('full') },
    { id:2, nombre:'Supervisor',    tipo:'General',  alcance:'todos',  desc:'Ve toda la cartera y los pedidos del equipo; mantenedores sin eliminar.', activo:true, perms:defaultPerms('supervisor') },
    { id:3, nombre:'Vendedor',      tipo:'Vendedor', alcance:'propio', desc:'Gestiona sus clientes y ve solo sus propios pedidos.', activo:true, perms:defaultPerms('vendedor') }
  ];
  const U = (id,nombre,mail,rol,area,celular)=>({ id,nombre,mail,rol,area,celular,activo:true });
  const users = [
    U(1,'Administrador sigcomt','admin@sigcomt.com','Administrador','Gerencia','900000001'),
    U(2,'Juan Perez','jperez@sigcomt.com','Vendedor','Ventas','900000002'),
    U(3,'María Torres','mtorres@sigcomt.com','Supervisor','Ventas','900000003'),
    U(4,'Carlos Ramírez','cramirez@sigcomt.com','Vendedor','Ventas','900000004'),
    U(5,'Lucía Fernández','lfernandez@sigcomt.com','Vendedor','Ventas','900000005'),
    U(6,'Bruno Jiménez','bjimenez@sigcomt.com','Supervisor','Ventas','900000006')
  ];
  const tiposCliente = [
    { id:1, nombre:'Sin calificar',  desc:'Cliente nuevo, aún no evaluado',            prioridad:'Baja',  color:'#8A92A6', activo:true },
    { id:2, nombre:'Alto valor',     desc:'Alto potencial o volumen de compra',        prioridad:'Alta',  color:'#16A34A', activo:true },
    { id:3, nombre:'Regular',        desc:'Cliente con actividad estándar',            prioridad:'Media', color:'#3B6FE0', activo:true },
    { id:4, nombre:'En seguimiento', desc:'Cliente en proceso de reactivación',        prioridad:'Media', color:'#E39B0B', activo:true }
  ];
  return { v:2, tablas, productos, clientes, pedidos, roles, users, tiposCliente, metas:metasDemo() };
}

let DB;
/* Datos guardados con una versión anterior: completa el alcance de cada rol y retira el rol de prueba "Supervisor de pedidos" */
function migrarDB(d){
  if(!d.metas) d.metas = metasDemo();
  d.productos.forEach(normProd);
  d.roles = d.roles.filter(r=>r.nombre!=='Supervisor de pedidos');
  d.users = d.users.filter(u=>u.rol!=='Supervisor de pedidos');
  // El cliente es la empresa: los "Cliente 1…5" de ejemplo pasan a tener nombre de contacto real (el 3 es persona natural)
  const REN = { 'Cliente 1':'Andrea Paredes','Cliente 2':'Luis Quispe','Cliente 3':'Marco Salazar Rojas','Cliente 4':'Patricia Vega','Cliente 5':'Marta Huamán' };
  d.clientes.forEach(c=>{ if(REN[c.nombre]){ if(c.nombre==='Cliente 3'){ c.empresa=''; c.docTipo='DNI'; c.docNum='45678901'; c.cargo='Independiente'; } c.nombre=REN[c.nombre]; } });
  if(d.clientes.length<10) d.clientes.push(...clientesDemo(Math.max(0,...d.clientes.map(c=>c.id))+1));   // cartera de ejemplo
  d.roles.forEach(r=>{
    if(!r.alcance) r.alcance = rolAlcance(r);
    if(r.perms['seg-tablas']){ r.perms['mant-tablas'] = r.perms['seg-tablas']; delete r.perms['seg-tablas']; }   // Tablas generales pasó a Mantenedores
  });
  return d;
}
function loadDB(){
  try { const raw = localStorage.getItem(DB_KEY); if(raw){ const d = JSON.parse(raw); if(d && d.v===2) return migrarDB(d); } } catch(e){}
  return seedDB();
}
function saveDB(){ try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch(e){} }
function resetDB(){ try { localStorage.removeItem(DB_KEY); } catch(e){} DB = seedDB(); saveDB(); location.reload(); }
DB = loadDB();
const nextId = list => Math.max(0, ...list.map(x=>x.id)) + 1;

/* ---------- Sesión y permisos ---------- */
function currentUser(){
  const s = getUser();                                   // { name, role } de la sesión (app.js)
  const du = DB.users.find(u=>u.nombre===s.name || (s.mail && u.mail===s.mail));
  const rolName = du ? du.rol : s.role;
  const rol = DB.roles.find(r=>r.nombre===rolName) || DB.roles.find(r=>r.nombre==='Vendedor');
  return { id: du?du.id:0, name:s.name, role:rol?rol.nombre:rolName, tipo: rol?rol.tipo:'Vendedor', alcance: rol?rolAlcance(rol):'propio' };
}
function can(key, act='ver'){
  const u = currentUser(), rol = DB.roles.find(r=>r.nombre===u.role);
  if(!rol || !rol.activo) return false;
  return !!(rol.perms[key] && rol.perms[key][act]);
}
const canConfig = () => PERM_KEYS.filter(k=>k.startsWith('seg-')||k.startsWith('mant-')).some(k=>can(k));
/** Si el usuario no tiene permiso "ver" en la página, muestra aviso y detiene la carga. */
function guardPage(key){
  if(can(key)) return true;
  document.addEventListener('DOMContentLoaded',()=>{
    document.body.innerHTML = '<div style="max-width:420px;margin:12vh auto;text-align:center;font-family:\'DM Sans\',sans-serif"><h2 style="font-family:\'Sora\',sans-serif;margin-bottom:10px">Acceso restringido</h2><p style="color:#64748b;margin-bottom:18px">Tu rol no tiene permiso para ver esta sección.</p><a class="btn btn-primary" style="display:inline-flex" href="inicio.html">Volver al inicio</a></div>';
  });
  window.PAGE_BLOCKED = true; return false;
}

/* ---------- Tablas generales, tipos de cliente, vendedores ---------- */
const TIPOS_TABLA = ['Tipo de documento','Prioridad','Etapa de venta','Forma de pago','Método de pago','Comprobante de pago','Unidad de medida','Línea de producto'];
const tablaVals = tipo => DB.tablas.filter(t=>t.tipo===tipo && t.activo).map(t=>t.n);
const tiposActivos = () => DB.tiposCliente.filter(t=>t.activo);
const prioRank = nombre => { const l = tablaVals('Prioridad'); const i = l.indexOf(nombre); return i<0 ? 99 : i; };
const tipoCliente = nombre => DB.tiposCliente.find(t=>t.nombre===nombre);
const vendedores = () => DB.users.filter(u=>{ const r=DB.roles.find(x=>x.nombre===u.rol); return u.activo && r && r.tipo==='Vendedor'; }).map(u=>u.nombre);
/** Colores derivados del color del tipo de cliente: fuerte, fondo suave y texto oscuro. */
const tipoColors = nombre => { const c = (tipoCliente(nombre)||{}).color || '#8A92A6'; return { color:c, tint:`color-mix(in srgb, ${c} 14%, #fff)`, dark:`color-mix(in srgb, ${c} 68%, #000)` }; };

/* ---------- Fechas ---------- */
const _pad = n => String(n).padStart(2,'0');
function ahoraStr(){ const d=new Date(); let h=d.getHours(); const ap=h>=12?'pm':'am'; h=h%12||12; return `${_pad(d.getDate())}/${_pad(d.getMonth()+1)}/${d.getFullYear()} ${_pad(h)}:${_pad(d.getMinutes())} ${ap}`; }
const hoyISO = () => { const d=new Date(); return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`; };
/** "dd/mm/yyyy hh:mm am|pm" ⇄ valor de <input type="datetime-local"> (yyyy-mm-ddThh:mm). Si el texto no es una fecha, devuelve ''. */
function dtToInput(s){
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(s||'').trim()); if(!m) return '';
  let h = +m[4]%12; if(m[6].toLowerCase()==='pm') h+=12;
  return `${m[3]}-${m[2]}-${m[1]}T${_pad(h)}:${m[5]}`;
}
function dtFromInput(v){
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v||''); if(!m) return '';
  let h = +m[4]; const ap = h>=12?'pm':'am'; h = h%12||12;
  return `${m[3]}/${m[2]}/${m[1]} ${_pad(h)}:${m[5]} ${ap}`;
}
const fmtFecha = iso => { const [y,m,d]=(iso||'').slice(0,10).split('-'); return d?`${d}/${m}/${y}`:''; };

/* ---------- Clientes: secciones editables + historial de cambios ----------
   Se usa igual desde Conversaciones y desde el mantenedor de Clientes: cada
   cambio en la información o en las preferencias queda registrado. */
function clienteSections(){
  return {
    info:{ title:'Información detallada', f:[
      ['nombre','Contacto / persona natural'],['docTipo','Tipo de documento','select',tablaVals('Tipo de documento')],['docNum','Número de documento'],
      ['vendedor','Vendedor asignado','select',vendedores()],['empresa','Empresa (cliente)'],['cargo','Cargo'],['cel','Celular','tel'],['mail','Correo','email'],['dir','Dirección'],
      ['cat','Tipo de cliente','select',tiposActivos().map(t=>t.nombre)],['estado','Estado','select',['Activo','Inactivo']] ] },
    seg: { title:'Seguimiento',   f:[['stage','Etapa de venta','select',tablaVals('Etapa de venta')],['prox','Próxima interacción']] },
    pref:{ title:'Preferencias',  f:[['horario','Horario de atención'],['canales','Canales de atención'],['lineas','Líneas de preferencia'],['interes','Productos de interés'],['obs','Observaciones relevantes','textarea']] }
  };
}
function clienteLabels(){ const L={}; Object.values(clienteSections()).forEach(s=>s.f.forEach(([k,l])=>L[k]=l)); return L; }
function histOf(c){
  if(!c.hist){ c.hist=[
    { sec:'info', campo:'Tipo de cliente', antes:'Sin calificar', desp:c.cat, f:'12/10/2026 09:15 am', u:'María Torres' },
    { sec:'seg',  campo:'Etapa de venta', antes:'Nuevo', desp:c.stage, f:'05/10/2026 04:40 pm', u:'Juan Perez' },
    { sec:'pref', campo:'Canales de atención', antes:'Llamadas', desp:c.canales, f:'28/09/2026 11:05 am', u:'Juan Perez' },
    { sec:'info', campo:'Cargo', antes:'Asistente de compras', desp:c.cargo, f:'05/08/2026 10:20 am', u:'Administrador sigcomt' },
    ...(c.vendedor ? [{ sec:'cartera', campo:'Asignación de vendedor', antes:'Sin asignar', desp:c.vendedor, f:(c.prim||'01/07/2026')+' 09:30 am', u:'María Torres' }] : []),
    { sec:'info', campo:'Creación del cliente', antes:'—', desp:'Cliente registrado', f:(c.prim||'01/07/2026')+' 09:00 am', u:'Administrador sigcomt' }
  ].filter(h=>h.antes!==h.desp); }
  return c.hist;
}
/** Aplica los cambios de una sección al cliente y registra cada campo modificado en su historial. Devuelve cuántos cambió. */
function aplicarCambiosCliente(c, sec, datos){
  const S = clienteSections()[sec], L = clienteLabels(), h = histOf(c); let n = 0;
  S.f.forEach(([k])=>{
    if(!(k in datos)) return;
    const nv = String(datos[k]??'').trim()||'-', ov = c[k]==null||c[k]===''?'-':String(c[k]);
    if(nv!==ov){ h.unshift({ sec, campo: k==='estado' ? (nv==='Inactivo'?'Cliente anulado':'Cliente activado') : L[k], antes:ov, desp:nv, f:ahoraStr(), u:currentUser().name }); c[k]=nv; n++; }
  });
  if(n) saveDB();
  return n;
}
function nuevoCliente(d){
  const c = { id:nextId(DB.clientes), nombre:'', cat:(tiposActivos()[0]||{}).nombre||'', stage:'Nuevo', time:'Hoy', empresa:'', docTipo:'RUC', docNum:'', cargo:'-', cel:'', mail:'', dir:'-',
    vendedor:'', estado:'Activo', ult:'—', prox:'—', prim:fmtFecha(hoyISO()), ventas:0, antig:'00', horario:'-', canales:'-', lineas:'-', interes:'-', obs:'-', ...d };
  // Si lo crea un vendedor (alcance "solo lo suyo") queda asignado a él; solo Supervisor / Administrador asignan o reasignan desde Cartera.
  const me = currentUser(), f = ahoraStr();
  if(!d.vendedor && me.alcance==='propio') c.vendedor = me.name;
  c.hist = [{ sec:'info', campo:'Creación del cliente', antes:'—', desp:'Cliente registrado', f, u:me.name }];
  if(c.vendedor) c.hist.unshift({ sec:'cartera', campo:'Asignación automática de vendedor', antes:'Sin asignar', desp:c.vendedor, f, u:me.name });
  DB.clientes.push(c); saveDB(); return c;
}

/* ---------- Pedidos ---------- */
const pedTotal = p => p.items.reduce((a,i)=>a+i.p*i.q,0);
const moneyFmt = n => 'S/ ' + Number(n).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
function nuevoPedido(d){
  const n = Math.max(0, ...DB.pedidos.map(p=>parseInt(p.id.replace(/\D/g,''),10)||0)) + 1;
  const p = { id:'PED-'+String(n).padStart(4,'0'), fecha:hoyISO(), est:'Pendiente', envFecha:'', obs:'', ...d };
  DB.pedidos.unshift(p); saveDB(); return p;
}
/** Pedidos que el usuario puede ver según el alcance de su rol: "todos" → todos · "propio" → solo los suyos. */
function pedidosVisibles(){
  const u = currentUser();
  return u.alcance==='todos' ? DB.pedidos : DB.pedidos.filter(p=>p.vendedor===u.name);
}
/** Envío al otro sistema (SigOne Ventas). Aquí iría la llamada real a la API; en el prototipo solo simula la espera. */
function enviarPedidoExterno(p){ return new Promise(res=>setTimeout(()=>res({ok:true, ref:'SVC-'+p.id}), 650)); }
async function enviarPedidos(ids){
  let ok = 0;
  for(const id of ids){
    const p = DB.pedidos.find(x=>x.id===id); if(!p || p.est!=='Pendiente') continue;
    const r = await enviarPedidoExterno(p);
    if(r.ok){ p.est='Enviado'; p.envFecha=ahoraStr(); p.envPor=currentUser().name; ok++; }
  }
  saveDB(); return ok;
}

/* ---------- Excel (SheetJS se carga solo cuando hace falta) ---------- */
function cargarXLSX(){
  if(window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res,rej)=>{
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = ()=>res(window.XLSX); s.onerror = ()=>rej(new Error('No se pudo cargar la librería de Excel (¿sin internet?)'));
    document.head.appendChild(s);
  });
}
/** Descarga filas (array de objetos) como .xlsx; si no hay librería, cae a .csv compatible con Excel. */
async function descargarExcel(nombre, filas, hoja='Datos'){
  try {
    const X = await cargarXLSX(), ws = X.utils.json_to_sheet(filas), wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, hoja); X.writeFile(wb, nombre+'.xlsx'); return 'xlsx';
  } catch(e){
    const cols = Object.keys(filas[0]||{}), q = v => '"'+String(v??'').replace(/"/g,'""')+'"';
    const csv = '﻿'+[cols.map(q).join(';'), ...filas.map(r=>cols.map(c=>q(r[c])).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download = nombre+'.csv'; a.click(); URL.revokeObjectURL(a.href); return 'csv';
  }
}
/** Lee la primera hoja de un .xlsx/.xls/.csv y devuelve array de objetos (claves = encabezados). */
async function leerExcel(file, claveEncabezado){
  const X = await cargarXLSX();
  // CSV: se lee como texto UTF-8 (si no, SheetJS lo toma como ANSI y rompe las tildes); Excel: binario
  const wb = /\.csv$/i.test(file.name) ? X.read(await file.text(),{type:'string'}) : X.read(await file.arrayBuffer(),{type:'array'});
  const ws = wb.Sheets[wb.SheetNames[0]];
  if(!claveEncabezado) return X.utils.sheet_to_json(ws, { defval:'' });
  // Con título o texto antes de la tabla: la fila de encabezados es la primera que contiene la columna clave (ej. "Código")
  const n = v => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const filas = X.utils.sheet_to_json(ws, { header:1, defval:'' });
  const h = filas.findIndex(f=>f.some(c=>n(c)===n(claveEncabezado)));
  if(h<0) return X.utils.sheet_to_json(ws, { defval:'' });
  const heads = filas[h].map(String);
  return filas.slice(h+1).map(f=>Object.fromEntries(heads.map((k,i)=>[k,f[i]??'']).filter(([k])=>k!=='')));
}
