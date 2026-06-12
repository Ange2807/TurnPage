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

  async update() {
    const ol_id = this.params?.ol_id;
    if (ol_id) await this._cargar(ol_id);
  }

  async _cargar(ol_id) {
    try {
      const [libro, { estadisticas, resenas }] = await Promise.all([
        this.api.getDetalleLibro(ol_id),
        this.api.getResenasPorLibro(ol_id),
      ]);
      this._libro = libro;
      await this._renderDetalle(libro, estadisticas);
      this._renderResenas(resenas);
    } catch (err) {
      this.querySelector('#libro-detalle').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }
  }

  async _renderDetalle(libro, stats) {
    const auth = slice.context.getState('auth');
    const inicial = (libro.titulo || '?')[0].toUpperCase();
    this.querySelector('#libro-detalle').innerHTML = `
      ${libro.portada
        ? `<img class="libro-portada" src="${libro.portada}" alt="${libro.titulo}" />`
        : `<div class="libro-portada libro-portada--vacia"><span>${inicial}</span></div>`}
      <div class="libro-info">
        <h1 class="libro-titulo">${libro.titulo}</h1>
        <p class="libro-autor">${libro.autor}</p>
        <div class="libro-stats">
          <div class="libro-stat"><strong>★ ${stats.promedio_calificacion || '—'}</strong>promedio</div>
          <div class="libro-stat"><strong>${stats.porcentaje_recomienda || 0}%</strong>recomiendan</div>
          <div class="libro-stat"><strong>${stats.total_resenas}</strong>reseñas</div>
        </div>
        ${libro.descripcion ? `<p class="libro-desc">${libro.descripcion.slice(0,400)}${libro.descripcion.length > 400 ? '…' : ''}</p>` : ''}
        <div class="libro-acciones" id="libro-acciones"></div>
      </div>
    `;
    if (auth?.isLoggedIn) await this._renderAcciones();
  }

  async _renderAcciones() {
    const contenedor = this.querySelector('#libro-acciones');
    const libro = this._libro;

    const btnEstante = await slice.build('Button', {
      value: '+ Mi estante',
      onClick: () => this._mostrarModalEstante(libro),
    });

    const btnResena = await slice.build('Button', {
      value: 'Escribir reseña',
      variant: 'outlined',
      onClick: async () => {
        const modal = await slice.build('ResenaModal', {
          ol_id:         libro.ol_id,
          titulo_libro:  libro.titulo,
          portada_libro: libro.portada,
          onGuardar: async () => {
            const { estadisticas, resenas } = await this.api.getResenasPorLibro(libro.ol_id);
            await this._renderDetalle(libro, estadisticas);
            this._renderResenas(resenas);
          },
        });
        document.body.appendChild(modal);
      },
    });

    contenedor.appendChild(btnEstante);
    contenedor.appendChild(btnResena);
  }

  async _mostrarModalEstante(libro) {
    const modal = await slice.build('Modal', {
      title: 'Agregar a mi estante',
      open: false,
      dismissable: true,
      onClose: () => modal.remove(),
    });

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

    const info = document.createElement('p');
    info.style.cssText = 'font-style:italic;color:var(--color-text-muted,#8E7B6B);margin:0 0 0.25rem;font-size:0.9rem;';
    info.textContent = `"${libro.titulo}"${libro.autor ? ` — ${libro.autor}` : ''}`;
    body.appendChild(info);

    const pregunta = document.createElement('p');
    pregunta.style.cssText = 'font-weight:600;margin:0 0 0.25rem;';
    pregunta.textContent = '¿En qué estado deseas agregarlo?';
    body.appendChild(pregunta);

    const estados = [
      { valor: 'leyendo',     etiqueta: 'Leyendo ahora' },
      { valor: 'leido',       etiqueta: 'Ya lo leí' },
      { valor: 'quiero_leer', etiqueta: 'Quiero leerlo' },
    ];

    for (const estado of estados) {
      const btn = await slice.build('Button', {
        value: estado.etiqueta,
        variant: 'outlined',
        onClick: async () => {
          modal.remove();
          try {
            await this.api.agregarAlEstante(
              libro.ol_id, libro.titulo, libro.portada, libro.autor, estado.valor,
            );
            await window.showToast('¡Libro agregado al estante!', 'success');
          } catch (err) {
            await window.showToast(err.message || 'Error al agregar', 'error');
          }
        },
      });
      body.appendChild(btn);
    }

    modal.appendBody(body);
    document.body.appendChild(modal);
    modal.open = true;
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
        <div class="resena-rec ${r.recomienda ? 'resena-rec--si' : 'resena-rec--no'}">${r.recomienda ? 'Recomienda' : 'No recomienda'}</div>
      </div>
    `).join('');

    lista.querySelectorAll('.resena-user').forEach((el) => {
      el.addEventListener('click', () => slice.router.navigate(`/perfil/${el.dataset.u}`));
    });
  }
}
customElements.define('slice-libro-page', LibroPage);