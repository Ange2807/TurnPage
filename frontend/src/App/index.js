import '/Slice/Slice.js';

async function esperarSlice() {
  return new Promise((resolve) => {
    const check = () => {
      if (
        window.slice?.router &&
        window.slice?.context &&
        typeof window.slice?.build === 'function'
      ) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

async function iniciarApp() {
  await esperarSlice();

  if (!slice.context.has('auth')) {
    slice.context.create('auth', {
      isLoggedIn: false,
      usuario: null,
      token: null,
    }, { persist: true, storageKey: 'turnpage:auth' });
  }

  const app = document.getElementById('app');

  const navbar = await slice.build('Navbar', {
    logo: { src: '/images/logo.png', path: '/' },
    items: [{ type: 'text', text: 'Inicio', path: '/' }],
    buttons: [],
    position: 'static',
  });
  app.appendChild(navbar);

  await _actualizarNavbarButtons(navbar);

  slice.context.watch('auth', navbar, async () => {
    await _actualizarNavbarButtons(navbar);
  }, (s) => s.isLoggedIn);

  // ── NO llamar slice.router.mount() — Slice.js monta solo ──────────────
}

async function _actualizarNavbarButtons(navbar) {
  const auth = slice.context.getState('auth');
  const cont = navbar.$buttonsContainer;
  cont.innerHTML = '';

  if (auth?.isLoggedIn) {
    await navbar.addButton({
      value: `@${auth.usuario.username}`,
      onClick: async () => slice.router.navigate(`/perfil/${auth.usuario.username}`),
    }, cont);
    await navbar.addButton({
      value: 'Mi Estante',
      onClick: async () => slice.router.navigate('/mi-estante'),
    }, cont);
    await navbar.addButton({
      value: 'Salir',
      onClick: () => {
        slice.context.setState('auth', {
          isLoggedIn: false,
          usuario: null,
          token: null,
        });
        slice.router.navigate('/');
      },
    }, cont);
  } else {
    await navbar.addButton({
      value: 'Iniciar sesión',
      onClick: async () => slice.router.navigate('/login'),
    }, cont);
    await navbar.addButton({
      value: 'Registrarse',
      onClick: async () => slice.router.navigate('/registro'),
    }, cont);
  }
}

window.showToast = async (message, type = 'success') => {
  const toast = await slice.build('Toast', { message, type, duration: 3500 });
  document.body.appendChild(toast);
};

iniciarApp();