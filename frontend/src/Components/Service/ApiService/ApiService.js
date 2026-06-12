export default class ApiService {
  static props = {};

  constructor(props) {
    this.BASE_URL = 'http://localhost:3000/api';
  }

  async init() {}

  _getToken() {
    return slice.context.getState('auth')?.token || null;
  }

  async _request(method, endpoint, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this._getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    const res  = await fetch(`${this.BASE_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  }

  // Auth
  registro(username, email, password) {
    return this._request('POST', '/auth/registro', { username, email, password });
  }
  login(email, password) {
    return this._request('POST', '/auth/login', { email, password });
  }

  // Open Library
  async buscarLibros(query) {
    const res  = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json();
    return data.docs.map((doc) => ({
      ol_id:   doc.key?.replace('/works/', '') || '',
      titulo:  doc.title,
      autor:   doc.author_name?.[0] || 'Autor desconocido',
      portada: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      anio:    doc.first_publish_year || null,
    }));
  }

  async getDetalleLibro(ol_id) {
    const res  = await fetch(`https://openlibrary.org/works/${ol_id}.json`);
    const data = await res.json();
    let autor  = 'Autor desconocido';
    if (data.authors?.[0]?.author?.key) {
      try {
        const r = await fetch(`https://openlibrary.org${data.authors[0].author.key}.json`);
        const a = await r.json();
        autor   = a.name || autor;
      } catch (_) {}
    }
    return {
      ol_id,
      titulo:      data.title,
      autor,
      descripcion: typeof data.description === 'object' ? data.description.value : data.description || '',
      portada:     data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null,
    };
  }

  // Reseñas
  getResenasPorLibro(ol_id) {
    return this._request('GET', `/resenas/libro/${ol_id}`);
  }
  crearResena(ol_id, titulo_libro, portada_libro, comentario, calificacion, recomienda) {
    return this._request('POST', '/resenas', { ol_id, titulo_libro, portada_libro, comentario, calificacion, recomienda }, true);
  }
  eliminarResena(id) {
    return this._request('DELETE', `/resenas/${id}`, null, true);
  }

  // Estante
  getMiEstante() {
    return this._request('GET', '/estante', null, true);
  }
  agregarAlEstante(ol_id, titulo_libro, portada_libro, autor_libro, estado, privado = false) {
    return this._request('POST', '/estante', { ol_id, titulo_libro, portada_libro, autor_libro, estado, privado }, true);
  }
  actualizarEstante(id, estado, privado) {
    return this._request('PUT', `/estante/${id}`, { estado, privado }, true);
  }
  eliminarDelEstante(id) {
    return this._request('DELETE', `/estante/${id}`, null, true);
  }

  // Usuarios
  getPerfil(username) {
    return this._request('GET', `/usuarios/${username}`);
  }
}
customElements.define('slice-api-service', ApiService);