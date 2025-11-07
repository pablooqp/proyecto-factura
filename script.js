document.addEventListener("DOMContentLoaded", () => {
  const productosContainer = document.getElementById("productosContainer");
  const formFactura = document.getElementById("facturaForm");
  const formMargen = document.getElementById("margenForm");

  let productos = [];

  // Renderizar productos en una tabla
  function renderProductos() {
    if (productos.length === 0) {
      productosContainer.innerHTML = "";
      return;
    }
      let html = "";
      productos.forEach((p, i) => {
        html += `<section class="producto-section">
          <div class="field">
            <label>Nombre</label>
            <input type="text" value="${p.nombre}" data-index="${i}" data-key="nombre" required>
          </div>
          <div class="field">
            <label>Valor Neto Total</label>
            <input type="number" step="0.01" value="${p.valorNeto}" data-index="${i}" data-key="valorNeto" required>
          </div>
          <div class="field">
            <label>ILA (%)</label>
            <input type="number" step="0.001" value="${p.ilaPorcentaje * 100}" data-index="${i}" data-key="ilaPorcentaje" required>
          </div>
          <div class="field">
            <label>Cantidad</label>
            <input type="number" value="${p.cantidad}" data-index="${i}" data-key="cantidad" required>
          </div>
          <button type="button" class="remove-btn" data-index="${i}">Eliminar</button>
          <hr>
        </section>`;
      });
    productosContainer.innerHTML = html;
  }

  document.getElementById("agregarProducto").addEventListener("click", () => {
  productos.push({ nombre: "", valorNeto: 0, ilaPorcentaje: 0, cantidad: 1 });
  renderProductos();
  });

  productosContainer.addEventListener("input", (e) => {
  const index = e.target.dataset.index;
  const key = e.target.dataset.key;
  let value = e.target.value;
  if (key === "ilaPorcentaje") value = parseFloat(value) / 100;
  else if (key === "valorNeto" || key === "cantidad") value = parseFloat(value);
  productos[index][key] = value;
  });

  productosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const index = e.target.dataset.index;
      productos.splice(index, 1);
      renderProductos();
    }
  });

  // ===== FUNCIONES ORIGINALES =====
  function calcularDetalleFactura(productos, transporteTotal, ivaPorcentaje, subtotal, ivaTotalFactura) {
    const totalValorNeto = productos.reduce((acc, p) => acc + p.valorNeto, 0);

    const baseImponibleTotal = productos.reduce(
      (acc, p) => acc + p.valorNeto + p.valorNeto * p.ilaPorcentaje,
      0
    ) + transporteTotal;

    return productos.map(p => {
      const proporcion = (p.valorNeto + p.valorNeto * p.ilaPorcentaje) / baseImponibleTotal;
      const transporteAsignado = transporteTotal * proporcion;
      const ila = p.valorNeto * p.ilaPorcentaje;
      const baseIva = p.valorNeto + transporteAsignado + ila;
      const ivaAsignado = ivaTotalFactura * (baseIva / baseImponibleTotal);
      const totalConImpuestos = baseIva + ivaAsignado;
      const cantidad = p.cantidad ?? 1;
      const totalPorUnidad = totalConImpuestos / cantidad;
      const ivaPorcentajeBase = (ivaAsignado / baseIva) * 100;
      const ivaPorcentajeTotal = (ivaAsignado / totalConImpuestos) * 100;

      return {
        nombre: p.nombre,
        cantidad,
        valorNeto: p.valorNeto,
        transporteAsignado: Math.round(transporteAsignado),
        ila: Math.round(ila),
        ivaAsignado: Math.round(ivaAsignado),
        totalConImpuestos: Math.round(totalConImpuestos),
        totalPorUnidad: Math.round(totalPorUnidad),
        ivaPorcentajeBase: ivaPorcentajeBase.toFixed(2) + "%",
        ivaPorcentajeTotal: ivaPorcentajeTotal.toFixed(2) + "%"
      };
    });
  }

  function calcularMargenReal({
    precioVentaConIVA,
    costoCompraNeto,
    ivaCompraRealPorcentaje = 13.88,
    ivaVentaPorcentaje = 19
  }) {
    const ivaCompraReal = ivaCompraRealPorcentaje / 100;
    const ivaVenta = ivaVentaPorcentaje / 100;
    const precioVentaNeto = precioVentaConIVA / (1 + ivaVenta);
    const ivaVentaMonto = precioVentaConIVA - precioVentaNeto;
    const ivaCompraMonto = costoCompraNeto * ivaCompraReal;
    const ivaPagar = ivaVentaMonto - ivaCompraMonto;
    const margenNeto = precioVentaNeto - costoCompraNeto;
    const margenPorcentaje = (margenNeto / precioVentaNeto) * 100;
    const margenRealFinal = margenNeto - ivaPagar;
    const margenRealPorcentaje = (margenRealFinal / precioVentaNeto) * 100;

    return {
      precioVentaConIVA,
      precioVentaNeto: Math.round(precioVentaNeto),
      costoCompraNeto,
      ivaCompraRealPorcentaje,
      ivaVentaPorcentaje,
      ivaCompraMonto: Math.round(ivaCompraMonto),
      ivaVentaMonto: Math.round(ivaVentaMonto),
      ivaPagar: Math.round(ivaPagar),
      margenNeto: Math.round(margenNeto),
      margenPorcentaje: margenPorcentaje.toFixed(2) + "%",
      margenRealFinal: Math.round(margenRealFinal),
      margenRealPorcentaje: margenRealPorcentaje.toFixed(2) + "%"
    };
  }

  // Mostrar tabla genérica
  function mostrarTabla(id, data) {
    if (!data || (Array.isArray(data) && !data.length)) return;
    let html = "<div class=\"table-responsive\"><table><tr>";
    const firstRow = Array.isArray(data) ? data[0] : data;
    Object.keys(firstRow).forEach(k => html += `<th>${k}</th>`);
    html += "</tr>";

    // Columnas a formatear como CLP
    const clpCols = [
      "valorNeto",
      "transporteAsignado",
      "ila",
      "ivaAsignado",
      "totalConImpuestos",
      "totalPorUnidad"
    ];
    const formatoCLP = v => typeof v === "number" ? v.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }) : v;

    if (Array.isArray(data)) {
      data.forEach(row => {
        html += "<tr>";
        Object.entries(row).forEach(([k, v]) => {
          if (clpCols.includes(k)) {
            html += `<td>${formatoCLP(v)}</td>`;
          } else {
            html += `<td>${v}</td>`;
          }
        });
        html += "</tr>";
      });
    } else {
      html += "<tr>";
      Object.entries(data).forEach(([k, v]) => {
        if (clpCols.includes(k)) {
          html += `<td>${formatoCLP(v)}</td>`;
        } else {
          html += `<td>${v}</td>`;
        }
      });
      html += "</tr>";
    }

    html += "</table></div>";
    document.getElementById(id).innerHTML = html;
  }

  // ===== EVENTOS =====
  formFactura.addEventListener("submit", e => {
    e.preventDefault();
    if (productos.length === 0) {
      alert("Agrega al menos un producto antes de calcular.");
      return;
    }

    const transporteTotal = parseFloat(document.getElementById("transporteTotal").value);
    const ivaPorcentaje = parseFloat(document.getElementById("ivaPorcentaje").value) / 100;
    const subtotal = parseFloat(document.getElementById("subtotal").value);
    const ivaTotalFactura = parseFloat(document.getElementById("ivaTotalFactura").value);

    const resultado = calcularDetalleFactura(productos, transporteTotal, ivaPorcentaje, subtotal, ivaTotalFactura);
    mostrarTabla("resultadosFactura", resultado);
  });

  formMargen.addEventListener("submit", e => {
    e.preventDefault();
    const data = {
      precioVentaConIVA: parseFloat(document.getElementById("precioVentaConIVA").value),
      costoCompraNeto: parseFloat(document.getElementById("costoCompraNeto").value),
      ivaCompraRealPorcentaje: parseFloat(document.getElementById("ivaCompraRealPorcentaje").value),
      ivaVentaPorcentaje: parseFloat(document.getElementById("ivaVentaPorcentaje").value),
    };

    const resultado = calcularMargenReal(data);
    mostrarTabla("resultadoMargen", resultado);
  });
});
