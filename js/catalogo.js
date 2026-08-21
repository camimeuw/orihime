const CONFIG = {
  WHATSAPP_NUMBER: '5492314552379',
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTXR5HDNFBf4DG_4FANIXUfHsLzDUspupM68yHky2UEW7lRPRwmrVDrCoTM7lz6PegvQggL-6UDNj6/pub?output=csv',
};

document.querySelectorAll('.nav-archivo a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

const footerWhatsapp = document.getElementById('btn-whatsapp-footer');
if (footerWhatsapp) {
  footerWhatsapp.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function rowsToProducts(rows) {
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const item = {};
    headers.forEach((key, i) => {
      item[key] = (cells[i] || '').trim();
    });
    return item;
  });
}

function imagenesDeProducto(producto) {
  return [producto.imagen, producto.imagen2, producto.imagen3].filter(Boolean);
}

function formatPrecio(valor) {
  const numero = parseFloat(String(valor).replace(',', '.'));
  if (isNaN(numero)) return null;
  return numero.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function buildPrecioHTML(producto) {
  const precio = parseFloat(String(producto.precio).replace(',', '.'));
  const descuento = parseFloat(String(producto.descuento).replace(',', '.').replace('%', ''));
  if (isNaN(precio)) return '';

  if (descuento > 0) {
    const final = precio * (1 - descuento / 100);
    return `
      <p class="ficha-precio">
        <span class="precio-original">${formatPrecio(precio)}</span>
        <span class="precio-final">${formatPrecio(final)}</span>
        <span class="precio-desc-tag">-${descuento}%</span>
      </p>`;
  }
  return `<p class="ficha-precio"><span class="precio-final">${formatPrecio(precio)}</span></p>`;
}

function buildTagsHTML(producto) {
  const tags = [];
  if (producto.talle) tags.push(`<span class="tag">talle ${producto.talle}</span>`);
  if (producto.color) tags.push(`<span class="tag">${producto.color}</span>`);
  if (!tags.length) return '';
  return `<div class="ficha-tags">${tags.join('')}</div>`;
}

function buildMedidasHTML(producto) {
  const partes = [producto.medidas, producto.detalles].filter(Boolean);
  if (!partes.length) return '';
  return `<p class="ficha-detalle">${partes.join(' — ')}</p>`;
}

function buildUltimaHTML(producto) {
  if (String(producto.stock).trim() !== '1') return '';
  return `<span class="badge-ultima">última pieza</span>`;
}

function buildFichaHTML(producto, indice) {
  const nombre = producto.nombre || 'pieza';
  const numero = producto.id || '';
  const imagenes = imagenesDeProducto(producto);
  const imagenHTML = imagenes.length
    ? `<img src="${imagenes[0]}" alt="${nombre}" loading="lazy" decoding="async" class="ficha-img">`
    : `<div class="ficha-placeholder">sin foto</div>`;

  return `
    <div class="ficha-producto" data-categoria="${(producto.categoria || '').toLowerCase()}" style="--i:${indice || 0}">
      <a href="pieza.html?id=${encodeURIComponent(numero)}" class="ficha-link">
        ${buildUltimaHTML(producto)}
        ${imagenHTML}
        <p class="ficha-nombre">${nombre}</p>
        <p class="ficha-numero">pieza n.º ${numero}</p>
        ${buildTagsHTML(producto)}
        ${buildPrecioHTML(producto)}
        ${buildMedidasHTML(producto)}
      </a>
      <div class="ficha-acciones">
        ${buildBotonCarritoHTML(producto)}
      </div>
    </div>`;
}

function estaDisponible(producto) {
  const valor = (producto.disponible || 'si').trim().toLowerCase();
  return !valor.startsWith('no');
}

async function fetchProductos() {
  const respuesta = await fetch(CONFIG.SHEET_CSV_URL);
  if (!respuesta.ok) throw new Error('no se pudo leer la hoja');
  const texto = await respuesta.text();
  const filas = parseCSV(texto);
  return rowsToProducts(filas).filter(estaDisponible);
}
