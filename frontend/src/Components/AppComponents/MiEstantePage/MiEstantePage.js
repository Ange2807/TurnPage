export default class MiEstantePage extends HTMLElement {
  static props = { params: { required: false }, metadata: { required: false } };

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
      leyendo:     { label: 'Leyendo',       items: [] },
      leido:       { label: 'Ya leídos',     items: [] },
      quiero_leer: { label: 'Quiero leer',   items: [] },
    };
    libros.forEach((l) => { if (secciones[l.estado]) secciones[l.estado].items.push(l); });
    cont.innerHTML = '';

    Object.values(secciones).forEach(({ label, items }) => {
      if (!items.length) return;
      const sec = document.createElement('div');
      sec.className = 'estante-sec';
      sec.innerHTML = `<h2>${label} <span class="estante-count">(${items.length})</span></h2><div class="estante-grid"></div>`;
      cont.appendChild(sec);
      const grid = sec.querySelector('.estante-grid');

      items.forEach((libro) => {
        const inicial = (libro.titulo_libro || '?')[0].toUpperCase();
        const card = document.createElement('div');
        card.className = 'estante-card';
        card.innerHTML = `
          ${libro.portada_libro
            ? `<img src="${libro.portada_libro}" alt="${libro.titulo_libro}" />`
            : `<div class="estante-portada-vacia"><span>${inicial}</span></div>`}
          <div class="estante-card-info">
            <div class="estante-card-titulo">${libro.titulo_libro}</div>
            <span class="estante-badge estante-badge--${libro.privado ? 'privado' : 'publico'}">${libro.privado ? 'Privado' : 'Público'}</span>
            <div class="estante-btns" id="btns-${libro._id}"></div>
          </div>
        `;
        grid.appendChild(card);
        this._agregarBotones(card.querySelector(`#btns-${libro._id}`), libro);
      });
    });
  }

  async _agregarBotones(cont, libro) {
    const selectEstado = document.createElement('select');
    selectEstado.className = 'estante-estado-select';
    [
      { valor: 'leyendo',     label: 'Leyendo' },
      { valor: 'leido',       label: 'Ya leído' },
      { valor: 'quiero_leer', label: 'Quiero leer' },
    ].forEach(({ valor, label }) => {
      const opt = document.createElement('option');
      opt.value = valor;
      opt.textContent = label;
      if (valor === libro.estado) opt.selected = true;
      selectEstado.appendChild(opt);
    });
    selectEstado.addEventListener('change', async () => {
      try {
        this.api.actualizarEstante(libro._id, selectEstado.value, libro.privado);
        await this._cargar();
      } catch (err) {
        await window.showToast(err.message || 'Error al actualizar', 'error');
      }
    });
    cont.appendChild(selectEstado);

    const btnPriv = await slice.build('Button', {
      value: libro.privado ? 'Hacer público' : 'Hacer privado',
      variant: 'outlined',
      onClick: async () => {
        try {
          this.api.actualizarEstante(libro._id, libro.estado, !libro.privado);
          await this._cargar();
        } catch (err) {
          await window.showToast(err.message || 'Error al actualizar', 'error');
        }
      },
    });
    const btnDel = await slice.build('Button', {
      value: 'Quitar',
      variant: 'ghost',
      onClick: async () => {
        const ok = await this._confirmar(`¿Quitar "${libro.titulo_libro}" del estante?`);
        if (!ok) return;
        try {
          this.api.eliminarDelEstante(libro._id);
          await this._cargar();
          await window.showToast('Libro quitado del estante', 'success');
        } catch (err) {
          await window.showToast(err.message || 'Error al quitar', 'error');
        }
      },
    });
    cont.appendChild(btnPriv);
    cont.appendChild(btnDel);
  }

  async _confirmar(mensaje) {
    return new Promise(async (resolve) => {
      const modal = await slice.build('Modal', {
        title: 'Confirmar acción',
        open: false,
        dismissable: false,
        onClose: () => { modal.remove(); resolve(false); },
      });

      const body = document.createElement('p');
      body.style.cssText = 'font-family:\'Lora\',serif;padding:0.25rem 0;line-height:1.5;';
      body.textContent = mensaje;

      const btnCancelar = await slice.build('Button', {
        value: 'Cancelar',
        variant: 'ghost',
        onClick: () => { modal.remove(); resolve(false); },
      });
      const btnConfirmar = await slice.build('Button', {
        value: 'Confirmar',
        onClick: () => { modal.remove(); resolve(true); },
      });

      modal.appendBody(body);
      modal.appendFooter(btnCancelar);
      modal.appendFooter(btnConfirmar);
      document.body.appendChild(modal);
      modal.open = true;
    });
  }
}
customElements.define('slice-mi-estante-page', MiEstantePage);
