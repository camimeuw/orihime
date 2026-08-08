function buildFichaHTML(producto) {
  const nombre = producto.nombre || 'pieza';
  const numero = producto.id || '';
  const imagenes = imagenesDeProducto(producto);
  const imagenHTML = imagenes.length
    ? `<img src="${imagenes[0]}" alt="${nombre}" loading="lazy" class="ficha-img">`
    : `<div class="ficha-placeholder">sin foto</div>`;
  const mensaje = encodeURIComponent(`Hola! Quiero comprar la pieza n.º ${numero} (${nombre})`);

  return `
    <div class="ficha-producto" data-categoria="${(producto.categoria || '').toLowerCase()}">
      <a href="pieza.html?id=${encodeURIComponent(numero)}" class="ficha-link">
        ${imagenHTML}
        <p class="ficha-nombre">${nombre}</p>
        <p class="ficha-numero">pieza n.º ${numero}</p>
        ${buildTagsHTML(producto)}
        ${buildPrecioHTML(producto)}
        ${buildMedidasHTML(producto)}
      </a>
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

  try {
    const productos = await fetchProductos();

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
