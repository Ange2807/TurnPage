export default class HomePage extends HTMLElement {
  static props = { params: { required: false } };

  // Temas populares para mostrar libros al azar
  static TEMAS = [
    'harry potter', 'lord of the rings', 'dune', 'foundation',
    'sherlock holmes', 'dracula', 'frankenstein', 'don quijote',
    'pride and prejudice', 'the great gatsby', 'war and peace',
    '1984', 'brave new world', 'the hobbit', 'narnia',
  ];

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    // Verificar auth
    const auth = slice.context.getState('auth');
    if (!auth?.isLoggedIn) {
      await slice.router.navigate('/login');
      return;
    }

    this.api = await slice.build('ApiService', { sliceId: 'api-service' });
    await this._cargarLibrosAlAzar();
    await this._cargarPopulares();
    await this._configurarBusqueda();
  }

  async _cargarLibrosAlAzar() {
    const grid = this.querySelector('#home-grid-azar');
    grid.innerHTML = '<p class="muted">Cargando sugerencias...</p>';

    try {
      // Elegir un tema al azar
      const tema = HomePage.TEMAS[Math.floor(Math.random() * HomePage.TEMAS.length)];
      const res  = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(tema)}&limit=50`
      );
      const data = await res.json();

      // Filtrar solo los que tienen portada y mezclar al azar
      const conPortada = data.docs.filter((d) => d.cover_i);
      const mezclados  = conPortada.sort(() => Math.random() - 0.5).slice(0, 8);

      grid.innerHTML = '';

      if (!mezclados.length) {
        grid.innerHTML = '<p class="muted">No se pudieron cargar sugerencias.</p>';
        return;
      }

      for (const doc of mezclados) {
        const libro = {
          ol_id:   doc.key?.replace('/works/', '') || '',
          titulo:  doc.title,
          autor:   doc.author_name?.[0] || 'Autor desconocido',
          portada: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
        };
        grid.appendChild(await this._crearCard(libro));
      }
    } catch (_) {
      grid.innerHTML = '<p class="muted">No se pudieron cargar sugerencias.</p>';
    }
  }

  async _cargarPopulares() {
    const grid = this.querySelector('#home-grid-populares');
    try {
      const res = await fetch('http://localhost:3000/api/resenas/populares');
      if (!res.ok) throw new Error();
      const libros = await res.json();
      grid.innerHTML = '';

      if (!libros.length) {
        grid.innerHTML = '<p class="muted">Aún no hay libros reseñados. ¡Sé el primero!</p>';
        return;
      }

      for (const libro of libros) {
        grid.appendChild(await this._crearCard(libro));
      }
    } catch (_) {
      grid.innerHTML = '<p class="muted">Aún no hay libros reseñados. ¡Sé el primero!</p>';
    }
  }

  async _configurarBusqueda() {
    this._inputBuscar = await slice.build('Input', {
      placeholder: 'Buscar un libro...',
      type: 'text',
    });
    this.querySelector('#home-input-buscar').appendChild(this._inputBuscar);

    const seccion = this.querySelector('#home-resultados');
    const grid    = this.querySelector('#home-grid-resultados');

    const buscar = async () => {
      const query = this._inputBuscar.value.trim();
      if (!query) return;
      grid.innerHTML = '<p class="muted">Buscando...</p>';
      seccion.style.display = 'block';
      try {
        const libros = await this.api.buscarLibros(query);
        grid.innerHTML = '';
        if (!libros.length) {
          grid.innerHTML = '<p class="muted">Sin resultados.</p>';
          return;
        }
        for (const libro of libros) {
          grid.appendChild(await this._crearCard(libro));
        }
      } catch (err) {
        grid.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
      }
    };

    this._inputBuscar.$input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') buscar();
    });

    const btn = await slice.build('Button', {
      value: '🔍 Buscar',
      onClick: buscar,
    });
    this.querySelector('#home-btn-buscar').appendChild(btn);
  }

  async _crearCard(libro) {
    const card = await slice.build('Card', {
      title:       libro.titulo       || libro.titulo_libro  || 'Sin título',
      text:        libro.autor        || libro.autor_libro   || '',
      image:       libro.portada      || libro.portada_libro || null,
      variant:     'outlined',
      badge:       libro.promedio_calificacion
                     ? `★ ${libro.promedio_calificacion}`
                     : null,
      interactive: true,
      actions: [
        {
          text: 'Ver libro',
          onClick: async () => slice.router.navigate(`/libro/${libro.ol_id}`),
        },
      ],
    });
    return card;
  }
}

customElements.define('slice-home-page', HomePage);