export default class ApiService {
  static props = {};
  constructor(props) {
    this.BASE_URL = "http://localhost:3000/api";
  }
  async init() {}
  t() {
    return slice.context.getState("auth")?.token || null;
  }
  async o(t, r, e = null, o = !1) {
    const a = { "Content-Type": "application/json" };
    if (o) {
      const t = this.t();
      t && (a.Authorization = `Bearer ${t}`);
    }
    const i = { method: t, headers: a };
    e && (i.body = JSON.stringify(e));
    const s = await fetch(`${this.BASE_URL}${r}`, i),
      n = await s.json();
    if (!s.ok) throw new Error(n.error || "Error en la petición");
    return n;
  }
  registro(t, r, e) {
    return this.o("POST", "/auth/registro", {
      username: t,
      email: r,
      password: e,
    });
  }
  login(t, r) {
    return this.o("POST", "/auth/login", { email: t, password: r });
  }
  async buscarLibros(t) {
    const r = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(t)}&limit=20`,
      ),
      e = await r.json();
    return e.docs.map((t) => ({
      ol_id: t.key?.replace("/works/", "") || "",
      titulo: t.title,
      autor: t.author_name?.[0] || "Autor desconocido",
      portada: t.cover_i
        ? `https://covers.openlibrary.org/b/id/${t.cover_i}-M.jpg`
        : null,
      anio: t.first_publish_year || null,
    }));
  }
  async i(t) {
    const r = await fetch(`https://openlibrary.org/works/${t}.json`),
      e = await r.json();
    let o = "Autor desconocido";
    if (e.authors?.[0]?.author?.key)
      try {
        const t = await fetch(
            `https://openlibrary.org${e.authors[0].author.key}.json`,
          ),
          r = await t.json();
        o = r.name || o;
      } catch (t) {}
    return {
      ol_id: t,
      titulo: e.title,
      autor: o,
      descripcion:
        "object" == typeof e.description
          ? e.description.value
          : e.description || "",
      portada: e.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${e.covers[0]}-L.jpg`
        : null,
    };
  }
  l(t) {
    return this.o("GET", `/resenas/libro/${t}`);
  }
  crearResena(t, r, e, o, a, i) {
    return this.o(
      "POST",
      "/resenas",
      {
        ol_id: t,
        titulo_libro: r,
        portada_libro: e,
        comentario: o,
        calificacion: a,
        recomienda: i,
      },
      !0,
    );
  }
  eliminarResena(t) {
    return this.o("DELETE", `/resenas/${t}`, null, !0);
  }
  u() {
    return this.o("GET", "/estante", null, !0);
  }
  agregarAlEstante(t, r, e, o, a, i = !1) {
    return this.o(
      "POST",
      "/estante",
      {
        ol_id: t,
        titulo_libro: r,
        portada_libro: e,
        autor_libro: o,
        estado: a,
        privado: i,
      },
      !0,
    );
  }
  actualizarEstante(t, r, e) {
    return this.o("PUT", `/estante/${t}`, { estado: r, privado: e }, !0);
  }
  eliminarDelEstante(t) {
    return this.o("DELETE", `/estante/${t}`, null, !0);
  }
  p(t) {
    return this.o("GET", `/usuarios/${t}`);
  }
}
