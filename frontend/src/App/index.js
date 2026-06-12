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

  const navbar = await slice.build('Navbar', {
    logo: { src: '/images/logo.svg', path: '/' },
    items: [{ type: 'text', text: 'Inicio', path: '/home' }],
    buttons: [],
    position: 'fixed',
  });

  // Insertamos el navbar en body ANTES de #app para que el router
  // no lo elimine al navegar entre páginas.
  const app = document.getElementById('app');
  document.body.insertBefore(navbar, app);

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