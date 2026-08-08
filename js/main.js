const CONFIG = {
  WHATSAPP_NUMBER: '5490000000000',
  SHEET_ID: 'PEGA_ACA_EL_ID_DE_TU_GOOGLE_SHEET',
  SHEET_GID: '0',
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

function buildDetalleHTML(producto) {
  const partes = [producto.medidas, producto.detalles].filter(Boolean);
  if (!partes.length) return '';
  return `<p class="ficha-detalle">${partes.join(' — ')}</p>`;
}

function buildFichaHTML(producto) {
  const nombre = producto.nombre || 'pieza';
  const numero = producto.id || '';
  const mensaje = encodeURIComponent(`Hola! Quiero comprar la pieza n.º ${numero} (${nombre})`);
  const imagenHTML = producto.imagen
    ? `<img src="${producto.imagen}" alt="${nombre}" loading="lazy" class="ficha-img">`
    : `<div class="ficha-placeholder">sin foto</div>`;

  return `
    <div class="ficha-producto" data-categoria="${(producto.categoria || '').toLowerCase()}">
      ${imagenHTML}
      <p class="ficha-nombre">${nombre}</p>
      <p class="ficha-numero">pieza n.º ${numero}</p>
      ${buildTagsHTML(producto)}
      ${buildPrecioHTML(producto)}
      ${buildDetalleHTML(producto)}
      <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${mensaje}" class="btn-comprar" target="_blank" rel="noopener">comprar</a>
    </div>`;
}

function renderCategorias(productos, onSelect) {
  const contenedor = document.getElementById('categorias-lista');
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];
  if (!categorias.length) {
    contenedor.innerHTML = '';
    return;
  }

  const chips = ['todas', ...categorias];
  contenedor.innerHTML = chips
    .map((cat, i) => `<button class="chip${i === 0 ? ' chip-activo' : ''}" data-categoria="${cat.toLowerCase()}">${cat}</button>`)
    .join('');

  contenedor.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      contenedor.querySelectorAll('.chip').forEach((b) => b.classList.remove('chip-activo'));
      btn.classList.add('chip-activo');
      onSelect(btn.dataset.categoria);
    });
  });
}

function renderProductos(productos) {
  const grid = document.getElementById('productos-lista');
  grid.innerHTML = productos.map(buildFichaHTML).join('');
}

function filtrarPorCategoria(productos, categoria) {
  if (categoria === 'todas') return productos;
  return productos.filter((p) => (p.categoria || '').toLowerCase() === categoria);
}

async function cargarCatalogo() {
  const estado = document.getElementById('catalogo-estado');
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.SHEET_GID}`;

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('no se pudo leer la hoja');
    const texto = await respuesta.text();
    const filas = parseCSV(texto);
    const productos = rowsToProducts(filas).filter((p) => (p.disponible || 'si').toLowerCase() !== 'no');

    if (!productos.length) {
      estado.textContent = 'todavía no hay piezas cargadas en el archivo.';
      return;
    }

    estado.remove();
    renderCategorias(productos, (categoria) => {
      renderProductos(filtrarPorCategoria(productos, categoria));
    });
    renderProductos(productos);
  } catch (error) {
    estado.textContent = 'no se pudo conectar con el catálogo. revisá la conexión con la hoja.';
  }
}

cargarCatalogo();
