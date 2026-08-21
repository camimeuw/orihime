function buildGaleriaHTML(imagenes, nombre, ultimaHTML) {
  if (!imagenes.length) {
    return `<div class="detalle-galeria">${ultimaHTML}<div class="detalle-placeholder">sin foto</div></div>`;
  }

  const principal = `<img src="${imagenes[0]}" alt="${nombre}" decoding="async" class="detalle-img-principal" id="detalle-img-principal">`;
  if (imagenes.length === 1) {
    return `<div class="detalle-galeria">${ultimaHTML}${principal}</div>`;
  }

  const miniaturas = imagenes
    .map(
      (src, i) =>
        `<img src="${src}" alt="${nombre} foto ${i + 1}" loading="lazy" decoding="async" class="detalle-miniatura${i === 0 ? ' miniatura-activa' : ''}" data-src="${src}">`
    )
    .join('');

  return `<div class="detalle-galeria">${ultimaHTML}${principal}<div class="detalle-miniaturas">${miniaturas}</div></div>`;
}

function activarGaleria() {
  document.querySelectorAll('.detalle-miniatura').forEach((mini) => {
    mini.addEventListener('click', () => {
      document.getElementById('detalle-img-principal').src = mini.dataset.src;
      document.querySelectorAll('.detalle-miniatura').forEach((m) => m.classList.remove('miniatura-activa'));
      mini.classList.add('miniatura-activa');
    });
  });
}

function buildFichaDetalleHTML(producto) {
  const nombre = producto.nombre || 'pieza';
  const numero = producto.id || '';

  return `
    ${buildGaleriaHTML(imagenesDeProducto(producto), nombre, buildUltimaHTML(producto))}
    <div class="detalle-info">
      <p class="ficha-numero">pieza n.º ${numero}</p>
      <h1 class="detalle-nombre">${nombre}</h1>
      ${producto.categoria ? `<p class="detalle-categoria">${producto.categoria}</p>` : ''}
      ${buildTagsHTML(producto)}
      ${buildPrecioHTML(producto)}
      ${buildMedidasHTML(producto)}
      <a href="medidas.html" class="medidas-link">¿cómo tomarme las medidas?</a>
      <div class="ficha-acciones ficha-acciones-detalle">
        ${buildBotonCarritoHTML(producto)}
      </div>
    </div>`;
}

function renderRelacionadas(productos, actual) {
  const seccion = document.getElementById('relacionadas-seccion');
  const lista = document.getElementById('relacionadas-lista');
  if (!actual.categoria) return;

  const relacionadas = productos
    .filter((p) => p.id !== actual.id && (p.categoria || '').toLowerCase() === actual.categoria.toLowerCase())
    .slice(0, 3);

  if (!relacionadas.length) return;

  lista.innerHTML = relacionadas.map((producto, indice) => buildFichaHTML(producto, indice)).join('');
  seccion.hidden = false;
}

async function cargarDetalle() {
  const estado = document.getElementById('detalle-estado');
  const contenedor = document.getElementById('detalle-contenido');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    estado.textContent = 'no se especificó qué pieza mostrar.';
    return;
  }

  try {
    const productos = await fetchProductos();
    const producto = productos.find((p) => p.id === id);

    if (!producto) {
      estado.textContent = 'no encontramos esa pieza — puede que ya se haya vendido.';
      return;
    }

    estado.remove();
    contenedor.innerHTML = buildFichaDetalleHTML(producto);
    activarGaleria();
    document.title = `${producto.nombre || 'pieza'} — orihime`;
    renderRelacionadas(productos, producto);
  } catch (error) {
    estado.textContent = 'no se pudo conectar con el catálogo. revisá la conexión con la hoja.';
  }
}

cargarDetalle();
