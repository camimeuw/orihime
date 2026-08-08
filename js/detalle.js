function buildGaleriaHTML(imagenes, nombre) {
  if (!imagenes.length) {
    return `<div class="detalle-galeria"><div class="detalle-placeholder">sin foto</div></div>`;
  }

  const principal = `<img src="${imagenes[0]}" alt="${nombre}" class="detalle-img-principal" id="detalle-img-principal">`;
  if (imagenes.length === 1) {
    return `<div class="detalle-galeria">${principal}</div>`;
  }

  const miniaturas = imagenes
    .map(
      (src, i) =>
        `<img src="${src}" alt="${nombre} foto ${i + 1}" class="detalle-miniatura${i === 0 ? ' miniatura-activa' : ''}" data-src="${src}">`
    )
    .join('');

  return `<div class="detalle-galeria">${principal}<div class="detalle-miniaturas">${miniaturas}</div></div>`;
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
  const mensaje = encodeURIComponent(`Hola! Quiero comprar la pieza n.º ${numero} (${nombre})`);

  return `
    ${buildGaleriaHTML(imagenesDeProducto(producto), nombre)}
    <div class="detalle-info">
      <p class="ficha-numero">pieza n.º ${numero}</p>
      <h1 class="detalle-nombre">${nombre}</h1>
      ${producto.categoria ? `<p class="detalle-categoria">${producto.categoria}</p>` : ''}
      ${buildTagsHTML(producto)}
      ${buildPrecioHTML(producto)}
      ${buildMedidasHTML(producto)}
      <div class="ficha-acciones ficha-acciones-detalle">
        ${buildBotonCarritoHTML(producto)}
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${mensaje}" class="btn-comprar btn-comprar-grande" target="_blank" rel="noopener">comprar por whatsapp</a>
      </div>
    </div>`;
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
  } catch (error) {
    estado.textContent = 'no se pudo conectar con el catálogo. revisá la conexión con la hoja.';
  }
}

cargarDetalle();
