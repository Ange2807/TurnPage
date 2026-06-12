export default class MiEstantePage extends HTMLElement {
  static props = {};

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    this.api = slice.getComponent('api-service')
      || await slice.build('ApiService', { sliceId: 'api-service' });
    await this._cargar();
  }

  async _cargar() {
    const cont = this.querySelector('#estante-contenido');
    try {
      const libros = await this.api.getMiEstante();
      if (!libros.length) {
        cont.innerHTML = '<p class="muted">Tu estante está vacío. ¡Busca libros en el inicio!</p>';
        return;
      }
      this._render(cont, libros);
    } catch (err) {
      cont.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }
  }

  _render(cont, libros) {
    const secciones = {
      leyendo:     { label: '📖 Leyendo',    items: [] },
      leido:       { label: '✅ Leídos',      items: [] },
      quiero_leer: { label: '🔖 Quiero leer', items: [] },
    };
    libros.forEach((l) => { if (secciones[l.estado]) secciones[l.estado].items.push(l); });
    cont.innerHTML = '';

    Object.values(secciones).forEach(({ label, items }) => {
      if (!items.length) return;
      const sec = document.createElement('div');
      sec.className = 'estante-sec';
      sec.innerHTML = `<h2>${label} (${items.length})</h2><div class="estante-grid"></div>`;
      cont.appendChild(sec);
      const grid = sec.querySelector('.estante-grid');

      items.forEach((libro) => {
        const card = document.createElement('div');
        card.className = 'estante-card';
        card.innerHTML = `
          ${libro.portada_libro
            ? `<img src="${libro.portada_libro}" alt="${libro.titulo_libro}" />`
            : `<div style="height:175px;background:var(--color-surface-alt);display:flex;align-items:center;justify-content:center;font-size:2.5rem">📚</div>`}
          <div class="estante-card-info">
            <div class="estante-card-titulo">${libro.titulo_libro}</div>
            <span class="estante-badge">${libro.privado ? '🔒 Privado' : '🌐 Público'}</span>
            <div class="estante-btns" id="btns-${libro._id}"></div>
          </div>
        `;
        grid.appendChild(card);
        this._agregarBotones(card.querySelector(`#btns-${libro._id}`), libro);
      });
    });
  }

  async _agregarBotones(cont, libro) {
    const btnPriv = await slice.build('Button', {
      value: libro.privado ? '🌐 Público' : '🔒 Privado',
      onClick: async () => {
        try {
          await this.api.actualizarEstante(libro._id, libro.estado, !libro.privado);
          await this._cargar();
        } catch (err) { alert(err.message); }
      },
    });
    const btnDel = await slice.build('Button', {
      value: '🗑',
      onClick: async () => {
        if (!confirm('¿Quitar este libro?')) return;
        try {
          await this.api.eliminarDelEstante(libro._id);
          await this._cargar();
        } catch (err) { alert(err.message); }
      },
    });
    cont.appendChild(btnPriv);
    cont.appendChild(btnDel);
  }
}
customElements.define('slice-mi-estante-page', MiEstantePage);