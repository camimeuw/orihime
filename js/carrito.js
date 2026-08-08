const CARRITO_KEY = 'orihime-carrito';

function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
  actualizarContadorCarrito();
}

function estaEnCarrito(id) {
  return leerCarrito().some((item) => item.id === id);
}

function agregarAlCarrito(producto) {
  const items = leerCarrito();
  if (items.some((item) => item.id === producto.id)) return;
  items.push(producto);
  guardarCarrito(items);
}

function quitarDelCarrito(id) {
  guardarCarrito(leerCarrito().filter((item) => item.id !== id));
}

function precioFinalDe(item) {
  const precio = parseFloat(String(item.precio).replace(',', '.'));
  const descuento = parseFloat(String(item.descuento).replace(',', '.').replace('%', ''));
  if (isNaN(precio)) return 0;
  return descuento > 0 ? precio * (1 - descuento / 100) : precio;
}

function actualizarContadorCarrito() {
  const contador = document.getElementById('carrito-contador');
  if (!contador) return;
  const cantidad = leerCarrito().length;
  contador.textContent = cantidad;
  contador.hidden = cantidad === 0;
}

function textoBotonCarrito(id) {
  return estaEnCarrito(id) ? 'en el carrito ✓' : 'agregar al carrito';
}

function buildBotonCarritoHTML(producto) {
  const id = producto.id || '';
  const nombre = producto.nombre || 'pieza';
  return `<button class="btn-carrito" data-id="${id}" data-nombre="${nombre}" data-precio="${producto.precio || ''}" data-descuento="${producto.descuento || ''}">${textoBotonCarrito(id)}</button>`;
}

function renderCarritoPanel() {
  const contenedor = document.getElementById('carrito-items');
  const totalEl = document.getElementById('carrito-total');
  const whatsappEl = document.getElementById('carrito-whatsapp');
  if (!contenedor) return;

  const items = leerCarrito();

  if (!items.length) {
    contenedor.innerHTML = '<p class="carrito-vacio">todavía no agregaste ninguna pieza.</p>';
    totalEl.textContent = '';
    whatsappEl.hidden = true;
    return;
  }

  contenedor.innerHTML = items
    .map(
      (item) => `
      <div class="carrito-item">
        <div>
          <p class="carrito-item-nombre">${item.nombre}</p>
          <p class="carrito-item-numero">pieza n.º ${item.id} — ${formatPrecio(precioFinalDe(item)) || ''}</p>
        </div>
        <button class="carrito-quitar" data-id="${item.id}" aria-label="quitar del carrito">×</button>
      </div>`
    )
    .join('');

  const total = items.reduce((suma, item) => suma + precioFinalDe(item), 0);
  totalEl.textContent = `total: ${formatPrecio(total)}`;

  const detalleItems = items.map((item) => `- ${item.nombre} (n.º ${item.id})`).join('\n');
  const mensaje = encodeURIComponent(`Hola! Quiero comprar estas piezas:\n${detalleItems}\n\nTotal: ${formatPrecio(total)}`);
  whatsappEl.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${mensaje}`;
  whatsappEl.hidden = false;

  contenedor.querySelectorAll('.carrito-quitar').forEach((boton) => {
    boton.addEventListener('click', () => {
      quitarDelCarrito(boton.dataset.id);
      renderCarritoPanel();
      document.querySelectorAll(`.btn-carrito[data-id="${boton.dataset.id}"]`).forEach((btn) => {
        btn.textContent = textoBotonCarrito(boton.dataset.id);
      });
    });
  });
}

function abrirCarrito() {
  renderCarritoPanel();
  document.getElementById('carrito-panel').hidden = false;
  document.getElementById('carrito-overlay').hidden = false;
}

function cerrarCarrito() {
  document.getElementById('carrito-panel').hidden = true;
  document.getElementById('carrito-overlay').hidden = true;
}

document.getElementById('carrito-boton')?.addEventListener('click', abrirCarrito);
document.getElementById('carrito-cerrar')?.addEventListener('click', cerrarCarrito);
document.getElementById('carrito-overlay')?.addEventListener('click', cerrarCarrito);

document.addEventListener('click', (event) => {
  const boton = event.target.closest('.btn-carrito');
  if (!boton) return;
  event.preventDefault();

  const producto = {
    id: boton.dataset.id,
    nombre: boton.dataset.nombre,
    precio: boton.dataset.precio,
    descuento: boton.dataset.descuento,
  };

  if (estaEnCarrito(producto.id)) {
    quitarDelCarrito(producto.id);
  } else {
    agregarAlCarrito(producto);
  }
  boton.textContent = textoBotonCarrito(producto.id);
});

actualizarContadorCarrito();
