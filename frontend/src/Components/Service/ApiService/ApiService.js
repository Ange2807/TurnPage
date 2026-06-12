export default class ApiService {
  static props = {};

  constructor(props) {}
  async init() {}

  // ── localStorage helpers ─────────────────────────────────
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  }
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  _id() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`; }
  _uid()  { return slice.context.getState('auth')?.token || null; }
  _uname(){ return slice.context.getState('auth')?.usuario?.username || null; }

  async _hash(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Auth ─────────────────────────────────────────────────
  async registro(username, email, password) {
    const users = this._get('tp:users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('El email ya está en uso');
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      throw new Error('El username ya está en uso');

    const hash = await this._hash(password);
    const usuario = {
      _id: this._id(), username,
      email: email.toLowerCase(),
      password_hash: hash,
      bio: null, avatar: null,
      createdAt: new Date().toISOString(),
    };
    users.push(usuario);
    this._set('tp:users', users);
    const { password_hash, ...pub } = usuario;
    return { token: usuario._id, usuario: pub };
  }

  async login(email, password) {
    const users = this._get('tp:users');
    const usuario = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!usuario) throw new Error('Credenciales inválidas');
    const hash = await this._hash(password);
    if (usuario.password_hash !== hash) throw new Error('Credenciales inválidas');
    const { password_hash, ...pub } = usuario;
    return { token: usuario._id, usuario: pub };
  }

  // ── Open Library (sin cambios — sigue usando la API externa) ─
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

  // ── Libros populares ──────────────────────────────────────
  getLibrosPopulares() {
    const all = this._get('tp:resenas');
    const byBook = {};
    for (const r of all) {
      if (!byBook[r.ol_id]) {
        byBook[r.ol_id] = {
          ol_id: r.ol_id,
          titulo_libro:  r.titulo_libro,
          portada_libro: r.portada_libro,
          autor_libro:   r.autor_libro || '',
          cals: [],
        };
      }
      byBook[r.ol_id].cals.push(r.calificacion);
    }
    return Object.values(byBook)
      .map(b => ({
        ol_id: b.ol_id,
        titulo_libro:  b.titulo_libro,
        portada_libro: b.portada_libro,
        autor_libro:   b.autor_libro,
        total_resenas: b.cals.length,
        promedio_calificacion:
          Math.round((b.cals.reduce((s, c) => s + c, 0) / b.cals.length) * 10) / 10,
      }))
      .sort((a, b) => b.total_resenas - a.total_resenas || b.promedio_calificacion - a.promedio_calificacion)
      .slice(0, 8);
  }

  // ── Reseñas ───────────────────────────────────────────────
  getResenasPorLibro(ol_id) {
    const all    = this._get('tp:resenas');
    const resenas = all
      .filter(r => r.ol_id === ol_id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = resenas.length;
    const promedio_calificacion = total
      ? Math.round((resenas.reduce((s, r) => s + r.calificacion, 0) / total) * 10) / 10
      : null;
    const porcentaje_recomienda = total
      ? Math.round((resenas.filter(r => r.recomienda).length / total) * 100)
      : 0;

    return {
      estadisticas: { promedio_calificacion, porcentaje_recomienda, total_resenas: total },
      resenas: resenas.map(r => ({
        _id:          r._id,
        username:     r.username,
        calificacion: r.calificacion,
        comentario:   r.comentario,
        recomienda:   r.recomienda,
        fecha:        r.createdAt,
      })),
    };
  }

  crearResena(ol_id, titulo_libro, portada_libro, comentario, calificacion, recomienda) {
    const uid = this._uid();
    if (!uid) throw new Error('Debes iniciar sesión');
    const all    = this._get('tp:resenas');
    const resena = {
      _id:          this._id(),
      usuario_id:   uid,
      username:     this._uname(),
      ol_id,
      titulo_libro,
      portada_libro: portada_libro || null,
      autor_libro:   '',
      calificacion,
      comentario:   comentario || '',
      recomienda:   Boolean(recomienda),
      createdAt:    new Date().toISOString(),
    };
    all.push(resena);
    this._set('tp:resenas', all);
    return resena;
  }

  eliminarResena(id) {
    const uid = this._uid();
    const all = this._get('tp:resenas');
    const idx = all.findIndex(r => r._id === id && r.usuario_id === uid);
    if (idx === -1) throw new Error('Reseña no encontrada');
    all.splice(idx, 1);
    this._set('tp:resenas', all);
    return { message: 'Reseña eliminada' };
  }

  // ── Estante ───────────────────────────────────────────────
  getMiEstante() {
    const uid = this._uid();
    if (!uid) throw new Error('Debes iniciar sesión');
    return this._get('tp:estante')
      .filter(e => e.usuario_id === uid)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  agregarAlEstante(ol_id, titulo_libro, portada_libro, autor_libro, estado, privado = false) {
    const uid = this._uid();
    if (!uid) throw new Error('Debes iniciar sesión');
    const all = this._get('tp:estante');
    const now = new Date().toISOString();
    const idx = all.findIndex(e => e.usuario_id === uid && e.ol_id === ol_id);

    if (idx !== -1) {
      all[idx] = { ...all[idx], titulo_libro, portada_libro, autor_libro, estado, privado: Boolean(privado), updatedAt: now };
      this._set('tp:estante', all);
      return all[idx];
    }
    const item = {
      _id: this._id(), usuario_id: uid, ol_id,
      titulo_libro, portada_libro: portada_libro || null,
      autor_libro: autor_libro || '', estado,
      privado: Boolean(privado), createdAt: now, updatedAt: now,
    };
    all.push(item);
    this._set('tp:estante', all);
    return item;
  }

  actualizarEstante(id, estado, privado) {
    const uid = this._uid();
    const all = this._get('tp:estante');
    const idx = all.findIndex(e => e._id === id && e.usuario_id === uid);
    if (idx === -1) throw new Error('Entrada no encontrada');
    all[idx] = { ...all[idx], estado, privado: Boolean(privado), updatedAt: new Date().toISOString() };
    this._set('tp:estante', all);
    return all[idx];
  }

  eliminarDelEstante(id) {
    const uid = this._uid();
    const all = this._get('tp:estante');
    const idx = all.findIndex(e => e._id === id && e.usuario_id === uid);
    if (idx === -1) throw new Error('Entrada no encontrada');
    all.splice(idx, 1);
    this._set('tp:estante', all);
    return { message: 'Eliminado del estante' };
  }

  // ── Usuarios / Perfil ─────────────────────────────────────
  getPerfil(username) {
    const users   = this._get('tp:users');
    const usuario = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!usuario) throw new Error('Usuario no encontrado');

    const { password_hash, ...pub } = usuario;
    const estante = this._get('tp:estante')
      .filter(e => e.usuario_id === usuario._id && !e.privado)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total_resenas = this._get('tp:resenas')
      .filter(r => r.usuario_id === usuario._id).length;

    return { usuario: pub, estante, total_resenas };
  }
}
