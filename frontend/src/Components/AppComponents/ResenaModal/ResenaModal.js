export default class ResenaModal extends HTMLElement {
  static props = {
    ol_id:         { required: true },
    titulo_libro:  { required: true },
    portada_libro: { required: false },
    onGuardar:     { required: false },
    onCerrar:      { required: false },
  };

  constructor(props) {
    super();
    slice.controller.setComponentProps(this, props);
    this._cal = 0;
    this._rec = true;
  }

  async init() {
    const api = slice.getComponent('api-service')
      || await slice.build('ApiService', { sliceId: 'api-service' });

    // ── Modal de Slice.js ──────────────────────────────────────────────────
    this._modal = await slice.build('Modal', {
      title:       `Reseña: ${this.titulo_libro}`,
      open:        false,
      dismissable: true,
      onClose: () => {
        if (this.onCerrar) this.onCerrar();
        this.remove();
      },
    });

    // ── Cuerpo del modal ───────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'resena-modal-body';
    body.innerHTML = `
      <p class="resena-modal-label">Calificación</p>
      <div class="resena-modal-stars">
        <span class="estrella" data-val="1">★</span>
        <span class="estrella" data-val="2">★</span>
        <span class="estrella" data-val="3">★</span>
        <span class="estrella" data-val="4">★</span>
        <span class="estrella" data-val="5">★</span>
      </div>
      <p class="resena-modal-label">Comentario</p>
      <textarea class="resena-modal-textarea" placeholder="¿Qué te pareció este libro?"></textarea>
      <div class="resena-modal-rec">
        <span>¿Lo recomiendas?</span>
        <button class="rec-si activo">👍 Sí</button>
        <button class="rec-no">👎 No</button>
      </div>
      <p class="resena-modal-aviso">⚠️ Tu reseña será pública con tu usuario.</p>
    `;

    // Estrellas
    const estrellas = body.querySelectorAll('.estrella');
    estrellas.forEach((el) => {
      el.addEventListener('click', () => {
        this._cal = parseInt(el.dataset.val);
        estrellas.forEach((e) =>
          e.classList.toggle('activa', parseInt(e.dataset.val) <= this._cal)
        );
      });
    });

    // Recomienda
    body.querySelector('.rec-si').addEventListener('click', () => {
      this._rec = true;
      body.querySelector('.rec-si').classList.add('activo');
      body.querySelector('.rec-no').classList.remove('activo');
    });
    body.querySelector('.rec-no').addEventListener('click', () => {
      this._rec = false;
      body.querySelector('.rec-no').classList.add('activo');
      body.querySelector('.rec-si').classList.remove('activo');
    });

    this._modal.appendBody(body);

    // ── Footer del modal con Buttons de Slice.js ───────────────────────────
    const btnCancelar = await slice.build('Button', {
      value:   'Cancelar',
      variant: 'outlined',
      onClick: () => { this._modal.close(); },
    });

    const btnGuardar = await slice.build('Button', {
      value:   'Guardar reseña',
      variant: 'filled',
      onClick: async () => {
        if (this._cal === 0) {
          await showToast('Selecciona una calificación.', 'warning');
          return;
        }
        const comentario = body.querySelector('.resena-modal-textarea').value.trim();
        try {
          const resena = await api.crearResena(
            this.ol_id, this.titulo_libro, this.portada_libro || null,
            comentario, this._cal, this._rec
          );
          if (this.onGuardar) this.onGuardar(resena);
          await showToast('¡Reseña guardada! ✅', 'success');
          this._modal.close();
        } catch (err) {
          await showToast(`Error: ${err.message}`, 'error');
        }
      },
    });

    this._modal.appendFooter(btnCancelar);
    this._modal.appendFooter(btnGuardar);

    // Montar y abrir
    document.body.appendChild(this._modal);
    this._modal.open = true;
  }
}
customElements.define('slice-resena-modal', ResenaModal);