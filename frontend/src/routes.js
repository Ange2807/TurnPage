const routes = [
  { path: '/',                 component: 'LoginPage'     },
  { path: '/home',             component: 'HomePage'      },
  { path: '/libro/${ol_id}',     component: 'LibroPage'     },
  { path: '/perfil/${username}', component: 'PerfilPage'    },
  { path: '/mi-estante',       component: 'MiEstantePage' },
  { path: '/login',            component: 'LoginPage'     },
  { path: '/registro',         component: 'RegistroPage'  },
  { path: '/404',              component: 'NotFound'      },
];

export default routes;