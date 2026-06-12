export default class RegistroPage extends HTMLElement {
  static props = { params: { required: false } };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    const auth = slice.context.getState('auth');
    if (auth?.isLoggedIn) {
      await slice.router.navigate('/home');
      return;
    }

    const api = await slice.build('ApiService', { sliceId: 'api-service', singleton: true });

    this.querySelector('#ir-login').addEventListener('click', () =>
      slice.router.navigate('/login')
    );

    this._inputUsername = await slice.build('Input', {
      placeholder: 'Nombre de usuario',
      type: 'text',
      required: true,
    });
    this._inputEmail = await slice.build('Input', {
      placeholder: 'Email',
      type: 'email',
      required: true,
    });
    this._inputPassword = await slice.build('Input', {
      placeholder: 'Contraseña',
      type: 'password',
      required: true,
      secret: true,
    });

    this.querySelector('#reg-input-username').appendChild(this._inputUsername);
    this.querySelector('#reg-input-email').appendChild(this._inputEmail);
    this.querySelector('#reg-input-password').appendChild(this._inputPassword);

    const btn = await slice.build('Button', {
      value: 'Crear cuenta',
      onClick: async () => {
        const username = this._inputUsername.value.trim();
        const email    = this._inputEmail.value.trim();
        const password = this._inputPassword.value;
        const errorEl  = this.querySelector('#reg-error');
        errorEl.textContent = '';

        if (!username || !email || !password) {
          errorEl.textContent = 'Por favor completa todos los campos.';
          return;
        }
        if (password.length < 6) {
          errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
          return;
        }

        try {
          const { usuario, token } = await api.registro(username, email, password);
          slice.context.setState('auth', { isLoggedIn: true, usuario, token });
          await window.showToast('¡Cuenta creada!', 'success');
          slice.router.navigate('/home');
        } catch (err) {
          errorEl.textContent = err.message;
          await window.showToast(err.message, 'error');
        }
      },
    });

    this.querySelector('#reg-btn').appendChild(btn);
  }
}

customElements.define('slice-registro-page', RegistroPage);
