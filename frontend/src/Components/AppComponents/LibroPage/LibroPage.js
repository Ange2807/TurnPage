export default class LibroPage extends HTMLElement {
  static props = { params: { required: false } };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this._libro = null;
  }

  async init() {
    this.api = slice.getComponent('api-service')
      || await slice.build('ApiService', { sliceId: 'api-service' });

    const btnVolver = await slice.build('Button', {
      value: '← Volver',
      onClick: () => history.back(),
    });
    this.querySelector('#libro-volver').appendChild(btnVolver);

    const ol_id = this.params?.ol_id;
    if (!ol_id) {
      this.querySelector('#libro-detalle').innerHTML = '<p class="muted">Libro no encontrado.</p>';
      return;
    }
    await this._cargar(ol_id);
  }

  async _cargar(ol_id) {
    try {
      const [libro, { estadisticas, resenas }] = await Promise.all([
        this.api.getDetalleLibro(ol_id),
        this.api.getResenasPorLibro(ol_id),
      ]);
      this._libro = libro;
      this._renderDetalle(libro, estadisticas);
      this._renderResenas(resenas);
    } catch (err) {
      this.querySelector('#libro-detalle').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }
  }

  _renderDetalle(libro, stats) {
    const auth = slice.context.getState('auth');
    this.querySelector('#libro-detalle').innerHTML = `
      ${libro.portada
        ? `<img class="libro-portada" src="${libro.portada}" alt="${libro.titulo}" />`
        : `<div class="libro-portada" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--color-surface-alt)">📚</div>`}
      <div class="libro-info">
        <h1 class="libro-titulo">${libro.titulo}</h1>
        <p class="libro-autor">${libro.autor}</p>
        <div class="libro-stats">
          <div class="libro-stat"><strong>★ ${stats.promedio_calificacion || '—'}</strong>promedio</div>
          <div class="libro-stat"><strong>👍 ${stats.porcentaje_recomienda || 0}%</strong>recomiendan</div>
          <div class="libro-stat"><strong>✍️ ${stats.total_resenas}</strong>reseñas</div>
        </div>
        ${libro.descripcion ? `<p class="libro-desc">${libro.descripcion.slice(0,400)}${libro.descripcion.length > 400 ? '…' : ''}</p>` : ''}
        <div class="libro-acciones" id="libro-acciones"></div>
      </div>
    `;
    if (auth?.isLoggedIn) this._renderAcciones();
  }

  async _renderAcciones() {
    const contenedor = this.querySelector('#libro-acciones');
    const libro = this._libro;

    const btnEstante = await slice.build('Button', {
      value: '+ Agregar a mi estante',
      onClick: async () => {
        const op = prompt('Estado:\n1 → Leyendo\n2 → Leído\n3 → Quiero leer');
        const map = { '1': 'leyendo', '2': 'leido', '3': 'quiero_leer' };
        if (!map[op]) return;
        try {
          await this.api.agregarAlEstante(libro.ol_id, libro.titulo, libro.portada, libro.autor, map[op]);
          alert('¡Libro agregado! ✅');
        } catch (err) { alert(err.message); }
      },
    });

    const btnResena = await slice.build('Button', {
      value: '✍️ Escribir reseña',
      onClick: async () => {
        const modal = await slice.build('ResenaModal', {
          ol_id:         libro.ol_id,
          titulo_libro:  libro.titulo,
          portada_libro: libro.portada,
          onGuardar: async () => {
            const { estadisticas, resenas } = await this.api.getResenasPorLibro(libro.ol_id);
            this._renderDetalle(libro, estadisticas);
            this._renderResenas(resenas);
          },
        });
        document.body.appendChild(modal);
      },
    });

    contenedor.appendChild(btnEstante);
    contenedor.appendChild(btnResena);
  }

  _renderResenas(resenas) {
    const seccion = this.querySelector('#libro-resenas');
    const lista   = this.querySelector('#libro-resenas-lista');
    seccion.style.display = 'block';

    if (!resenas.length) {
      lista.innerHTML = '<p class="muted">Sin reseñas aún. ¡Sé el primero!</p>';
      return;
    }

    lista.innerHTML = resenas.map((r) => `
      <div class="resena-card">
        <div class="resena-header">
          <span class="resena-user" data-u="${r.username}">@${r.username}</span>
          <span class="resena-fecha">${new Date(r.fecha).toLocaleDateString('es-ES')}</span>
        </div>
        <div class="resena-stars">${'★'.repeat(r.calificacion)}${'☆'.repeat(5 - r.calificacion)}</div>
        ${r.comentario ? `<p class="resena-texto">${r.comentario}</p>` : ''}
        <div class="resena-rec">${r.recomienda ? '👍 Recomienda' : '👎 No recomienda'}</div>
      </div>
    `).join('');

    lista.querySelectorAll('.resena-user').forEach((el) => {
      el.addEventListener('click', () => slice.router.navigate(`/perfil/${el.dataset.u}`));
    });
  }
}
customElements.define('slice-libro-page', LibroPage);