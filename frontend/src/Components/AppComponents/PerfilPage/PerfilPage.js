export default class PerfilPage extends HTMLElement {
  static props = { params: { required: false } };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    const api = slice.getComponent('api-service')
      || await slice.build('ApiService', { sliceId: 'api-service' });

    const username = this.params?.username;
    if (!username) {
      this.querySelector('#perfil-header').innerHTML = '<p class="muted">Usuario no encontrado.</p>';
      return;
    }

    try {
      const { usuario, estante, total_resenas } = await api.getPerfil(username);
      this._renderHeader(usuario, estante.length, total_resenas);
      this._renderEstante(estante);
    } catch (err) {
      this.querySelector('#perfil-header').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }
  }

  _renderHeader(usuario, totalLibros, totalResenas) {
    this.querySelector('#perfil-header').innerHTML = `
      <div class="perfil-avatar">${usuario.username[0].toUpperCase()}</div>
      <div class="perfil-info">
        <h1 class="perfil-username">@${usuario.username}</h1>
        <p class="perfil-bio">${usuario.bio || 'Sin bio aún.'}</p>
        <div class="perfil-stats">
          <span><strong>${totalLibros}</strong> libros públicos</span>
          <span><strong>${totalResenas}</strong> reseñas</span>
          <span>Desde ${new Date(usuario.createdAt).getFullYear()}</span>
        </div>
      </div>
    `;
  }

  _renderEstante(estante) {
    const seccion = this.querySelector('#perfil-estante');
    const grid    = this.querySelector('#perfil-grid');
    seccion.style.display = 'block';
    const etiquetas = { leyendo: '📖 Leyendo', leido: '✅ Leído', quiero_leer: '🔖 Quiero leer' };
    if (!estante.length) { grid.innerHTML = '<p class="muted">Sin libros públicos.</p>'; return; }

    grid.innerHTML = estante.map((item) => `
      <div class="perfil-libro" data-ol="${item.ol_id}">
        ${item.portada_libro
          ? `<img src="${item.portada_libro}" alt="${item.titulo_libro}" />`
          : `<div style="height:160px;background:var(--color-surface-alt);display:flex;align-items:center;justify-content:center;font-size:2rem">📚</div>`}
        <div class="perfil-libro-info">
          <div class="perfil-libro-titulo">${item.titulo_libro}</div>
          <div class="perfil-libro-estado">${etiquetas[item.estado] || item.estado}</div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.perfil-libro').forEach((card) => {
      card.addEventListener('click', () => slice.router.navigate(`/libro/${card.dataset.ol}`));
    });
  }
}
customElements.define('slice-perfil-page', PerfilPage);