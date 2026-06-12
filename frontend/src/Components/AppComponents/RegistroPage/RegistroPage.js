export default class LoginPage extends HTMLElement {
  static props = { params: { required: false } };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    // Si ya está logueado, ir directo al home
    const auth = slice.context.getState('auth');
    if (auth?.isLoggedIn) {
      await slice.router.navigate('/home');
      return;
    }

    const api = await slice.build('ApiService', { sliceId: 'api-service' });

    this.querySelector('#ir-registro').addEventListener('click', () =>
      slice.router.navigate('/registro')
    );

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

    this.querySelector('#login-input-email').appendChild(this._inputEmail);
    this.querySelector('#login-input-password').appendChild(this._inputPassword);

    const btn = await slice.build('Button', {
      value: 'Iniciar sesión',
      onClick: async () => {
        const email    = this._inputEmail.value.trim();
        const password = this._inputPassword.value;
        const errorEl  = this.querySelector('#login-error');
        errorEl.textContent = '';

        if (!email || !password) {
          errorEl.textContent = 'Por favor completa todos los campos.';
          return;
        }

        try {
          const { usuario, token } = await api.login(email, password);
          slice.context.setState('auth', { isLoggedIn: true, usuario, token });
          await showToast('¡Bienvenido! 👋', 'success');
          slice.router.navigate('/home');  // ← va a /home
        } catch (err) {
          errorEl.textContent = err.message;
          await showToast(err.message, 'error');
        }
      },
    });

    this.querySelector('#login-btn').appendChild(btn);
  }
}

customElements.define('slice-login-page', LoginPage);