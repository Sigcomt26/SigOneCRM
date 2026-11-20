/* =====================================================================
   SigOne CRM · Formulario "Crear pedido" (compartido)
   Lo usan Conversaciones (panel derecho) y Pedidos (ventana "Nuevo pedido"),
   así el formulario es exactamente el mismo en los dos lugares.
   Requiere app.js y store.js. El carrito es un arreglo [{n,d,p,q}].
   ===================================================================== */
const catalogoProductos = () => DB.productos.filter(p=>p.activo).map(p=>({ n:p.nombre, d:(p.desc||'Producto')+(p.contenido>1?` · ${p.unidad} de ${p.contenido}`:''), p:p.precio }));
const _pfMoney = n => 'S/ ' + Number(n).toFixed(2);
const _pfTotal = cart => cart.reduce((a,i)=>a+i.p*i.q,0);
const _pfOpts = tipo => tablaVals(tipo).map(v=>`<option>${esc(v)}</option>`).join('');
const _pfId = id => document.getElementById(id);

/** HTML del formulario (datos principales, dirección de entrega, productos y total). */
function pedidoFormHTML(cart, direccion=''){
  return `
    <div class="total-row"><span>Total de la venta:</span><b id="totTop">${_pfMoney(_pfTotal(cart))}</b></div>
    <details class="sec" open><summary>Datos principales ${icon('chevron')}</summary><div class="sec-b">
      <div class="field"><label>Forma de pago</label><select class="select" id="oPago">${_pfOpts('Forma de pago')}</select></div>
      <div class="field"><label>Método de pago</label><select class="select" id="oMetodo">${_pfOpts('Método de pago')}</select></div>
      <div class="field"><label>Comprobante de pago</label><select class="select" id="oComp">${_pfOpts('Comprobante de pago')}</select></div>
      <div class="field"><label>Observaciones</label><textarea class="textarea" id="oObs" rows="2" placeholder="Opcional"></textarea></div>
    </div></details>
    <details class="sec"><summary>Dirección de entrega ${icon('chevron')}</summary><div class="sec-b"><input class="input" id="oDir" value="${esc(direccion)}"></div></details>
    <details class="sec" open><summary>Productos ${icon('chevron')}</summary><div class="sec-b" id="prods"></div></details>
    <div class="panel-f">
      <div class="o-sum"><span>Total:</span><span id="totBot">${_pfMoney(_pfTotal(cart))}</span></div>
      <button class="btn btn-primary" id="btnOrder" style="padding:14px"><i data-icon="check"></i>Crear pedido</button>
    </div>`;
}

/** Activa el formulario ya insertado en el DOM. onCreate recibe los datos (pago, metodo, comp, obs, dir, items) cuando se pulsa "Crear pedido". */
function pedidoFormBind(cart, onCreate){
  pedidoDibujarProductos(cart);
  _pfId('btnOrder').onclick = () => {
    if(!cart.length) return toast('Añade al menos un producto');
    onCreate({ pago:_pfId('oPago').value, metodo:_pfId('oMetodo').value, comp:_pfId('oComp').value, obs:_pfId('oObs').value.trim(), dir:_pfId('oDir').value.trim(),
      items:cart.map(i=>({n:i.n,q:i.q,p:i.p})) });
  };
}

/** Lista de productos del carrito + fila para añadir (catálogo = Configuración › Productos). */
function pedidoDibujarProductos(cart){
  const box=_pfId('prods'), CAT=catalogoProductos();
  box.innerHTML = cart.map((i,ix)=>`
    <div class="prod"><div class="pinfo"><b>${esc(i.n)}</b><small>${esc(i.d)} · ${_pfMoney(i.p)}</small></div>
      <input class="input" type="number" min="1" value="${i.q}" data-q="${ix}">
      <button class="tr" data-del="${ix}" aria-label="Quitar" title="Quitar">${icon('trash')}</button></div>`).join('')
    + `<button class="btn btn-ghost" id="btnAdd" type="button"><i data-icon="plus"></i>Añadir producto</button>`;
  hydrateIcons(box);
  const refresh=()=>{ _pfId('totTop').textContent=_pfId('totBot').textContent=_pfMoney(_pfTotal(cart)); };
  box.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{ cart[el.dataset.q].q=Math.max(1,+el.value||1); refresh(); });
  box.querySelectorAll('[data-del]').forEach(el=>el.onclick=()=>{ cart.splice(el.dataset.del,1); pedidoDibujarProductos(cart); refresh(); });
  _pfId('btnAdd').onclick=()=>{
    if(!CAT.length) return toast('No hay productos activos. Créalos en Configuración › Productos');
    _pfId('btnAdd').outerHTML = `<div class="addrow"><select class="select" id="selP">${CAT.map((x,i)=>`<option value="${i}">${esc(x.n)} · ${_pfMoney(x.p)}</option>`).join('')}</select>
      <input class="input" id="qtyP" type="number" min="1" value="1"><button class="btn btn-primary btn-sm" id="okP" type="button">Agregar</button></div>`;
    _pfId('okP').onclick=()=>{ const it=CAT[_pfId('selP').value], q=Math.max(1,+_pfId('qtyP').value||1), ex=cart.find(x=>x.n===it.n); if(ex) ex.q+=q; else cart.push({...it,q}); pedidoDibujarProductos(cart); refresh(); };
  };
}

/* =====================================================================
   Ventana "Nuevo pedido" (módulo Pedidos) con el diseño SigOne:
   cabecera con ícono, pasos numerados y dos columnas (datos | productos + total).
   Usa los mismos ids que pedidoFormHTML para reutilizar pedidoFormBind.
   ===================================================================== */
function pedidoModalHTML(cart, direccion, clienteSelect){
  return `
    <div class="modal-h"><h3 class="rd-title"><span class="rd-tile np-tile">${icon('cart')}</span>
      <span>Nuevo pedido<small class="np-sub">Registra el pedido del cliente y envíalo al sistema de ventas</small></span></h3>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-b np-body">
      <div class="np-main">
        <section class="np-step">
          <div class="np-st"><b class="n">1</b><b>Cliente</b></div>
          <div class="field"><label>Cliente <span class="req">*</span></label>${clienteSelect}</div>
          <div class="np-cli" id="npCliInfo"></div>
        </section>
        <section class="np-step">
          <div class="np-st"><b class="n">2</b><b>Datos del pedido</b></div>
          <div class="grid-2">
            <div class="field"><label>Forma de pago</label><select class="select" id="oPago">${_pfOpts('Forma de pago')}</select></div>
            <div class="field"><label>Método de pago</label><select class="select" id="oMetodo">${_pfOpts('Método de pago')}</select></div>
          </div>
          <div class="field"><label>Comprobante de pago</label><select class="select" id="oComp">${_pfOpts('Comprobante de pago')}</select></div>
          <div class="field"><label>Dirección de entrega</label><div class="input-icon"><i class="pi pi-map-marker ic"></i><input class="input" id="oDir" value="${esc(direccion)}"></div></div>
          <div class="field"><label>Observaciones</label><textarea class="textarea" id="oObs" rows="2" placeholder="Opcional"></textarea></div>
        </section>
      </div>
      <aside class="np-side">
        <div class="np-st"><b class="n">3</b><b>Productos</b></div>
        <div class="np-prods" id="prods"></div>
        <div class="np-total"><span>Total de la venta</span><b id="totTop">${_pfMoney(_pfTotal(cart))}</b><small>Precios en soles · el pedido se crea en estado <em>Pendiente</em></small></div>
      </aside>
    </div>
    <div class="modal-f np-foot"><div class="o-sum"><span>Total:</span><span id="totBot">${_pfMoney(_pfTotal(cart))}</span></div>
      <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
      <button type="button" class="btn btn-primary" id="btnOrder">${icon('check')}Crear pedido</button></div>`;
}

/** Resumen del pedido recién creado / por enviar (cabecera + cuerpo). Lo usan Pedidos y Conversaciones. */
function pedidoCreadoHTML(ped, recien, cliente){
  const tot = ped.items.reduce((a,i)=>a+i.p*i.q,0), n = ped.items.length;
  return `
    <div class="modal-h"><h3 class="rd-title"><span class="rd-tile ${recien?'np-ok':'np-tile'}">${icon(recien?'check':'send')}</span>
      <span>${recien?'Pedido creado':'Enviar pedido'}<small class="np-sub">${ped.id}${cliente?' · '+esc(clienteNombre(cliente)):''}</small></span></h3>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-b">
      <div class="np-sum">
        <div><span>N.º de pedido</span><b>${ped.id}</b></div>
        <div><span>Estado</span><span class="badge orange">Pendiente</span></div>
        <div><span>Productos</span><b>${n} ${n===1?'producto':'productos'}</b></div>
        <div><span>Total</span><b class="np-amt">${_pfMoney(tot)}</b></div>
      </div>
      <div class="np-q">${icon('send')}<p><b>¿Deseas enviarlo ahora?</b> Si lo envías, viaja al sistema de ventas y pasa a <b>Enviado</b>. Si no, se mantiene como pendiente y podrás enviarlo después desde <b>Pedidos</b>.</p></div>
    </div>`;
}
