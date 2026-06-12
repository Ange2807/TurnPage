# TurnPage

Aplicación web de biblioteca personal. Los usuarios pueden buscar libros, escribir reseñas, ver el perfil de otros lectores y gestionar su propio estante organizando lecturas en tres estados: *Leyendo*, *Ya leído* y *Quiero leer*.

---

## Tabla de contenidos

1. [Cómo correr el proyecto](#cómo-correr-el-proyecto)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Slice.js — el framework](#slicejs--el-framework)
   - [Qué es Slice.js](#qué-es-slicejs)
   - [sliceConfig.json](#sliceconfigjson)
   - [Componentes de Slice que usamos](#componentes-de-slice-que-usamos)
   - [Cómo se construye un componente](#cómo-se-construye-un-componente)
   - [Router](#router)
   - [Context (estado global)](#context-estado-global)
   - [Temas (Theme Manager)](#temas-theme-manager)
4. [Lo que construimos nosotros](#lo-que-construimos-nosotros)
   - [ApiService — la "base de datos"](#apiservice--la-base-de-datos)
   - [Páginas de la app](#páginas-de-la-app)
   - [ResenaModal](#resenamodal)
   - [Tema visual personalizado](#tema-visual-personalizado)
   - [Estilos globales](#estilos-globales)
   - [Logo y favicon](#logo-y-favicon)
   - [Bootstrap de la app (index.js)](#bootstrap-de-la-app-indexjs)
5. [Flujo de datos](#flujo-de-datos)
6. [Open Library API](#open-library-api)

---

## Cómo correr el proyecto

```bash
cd frontend
pnpm install
pnpm dev        # levanta en http://localhost:3001
```

No hay backend que levantar. Todos los datos se guardan en el `localStorage` del navegador.

---

## Estructura de carpetas

```
TurnPage/
└── frontend/
    └── src/
        ├── App/
        │   ├── index.html       ← entrada HTML
        │   ├── index.js         ← bootstrap de la app
        │   └── style.css        ← estilos globales
        ├── Components/
        │   ├── AppComponents/   ← páginas y componentes propios
        │   ├── Visual/          ← componentes UI de Slice.js
        │   └── Service/         ← servicios (ApiService, etc.)
        ├── Themes/
        │   └── Slice.css        ← tema visual personalizado (libro)
        ├── Styles/              ← estilos de Slice.js
        ├── images/              ← logo.svg y favicon.svg
        ├── routes.js            ← tabla de rutas
        └── sliceConfig.json     ← configuración del framework
```

---

## Slice.js — el framework

### Qué es Slice.js

Slice.js es un framework frontend basado en **Web Components nativos** (`HTMLElement` + `customElements.define`). No usa Virtual DOM ni compilador: todo corre directamente en el navegador como módulos ES. Expone un objeto global `window.slice` con los siguientes sistemas:

| Sistema | Descripción |
|---|---|
| `slice.build(NombreComponente, props)` | Instancia y monta un componente. Retorna la promesa del elemento. |
| `slice.router` | Router de páginas completas por URL. Maneja `history.pushState`. |
| `slice.context` | Estado global reactivo (similar a un store). Persiste en `localStorage` si se le indica. |
| `slice.attachTemplate(this)` | Carga el `.html` del componente y lo inyecta como contenido del elemento. |
| `slice.controller.setComponentProps(this, props)` | Asigna las props declaradas en `static props` al componente. |
| `slice.getComponent(sliceId)` | Devuelve un componente ya registrado por su ID, sin crear uno nuevo. |

### sliceConfig.json

Es el archivo de configuración central del framework. Los campos más importantes que usamos:

```jsonc
{
  "server": { "port": 3001 },                 // puerto del dev server
  "paths": {
    "components": {
      "AppComponents": { "path": "/Components/AppComponents", "type": "Visual" },
      "Visual":        { "path": "/Components/Visual",        "type": "Visual" },
      "Service":       { "path": "/Components/Service",       "type": "Service" }
    },
    "routesFile": "/routes.js"                // tabla de rutas
  },
  "router": { "defaultRoute": "/" },
  "themeManager": { "defaultTheme": "Slice" }, // carga Themes/Slice.css
  "publicFolders": ["/Themes", "/Styles", "/assets", "/images"]
}
```

La categoría `"type": "Service"` permite que los componentes se registren como **singletons**: si ya existe una instancia con ese `sliceId`, `slice.build` la devuelve sin crear otra.

### Componentes de Slice que usamos

Todos viven en `src/Components/Visual/` y son parte del framework. Los usamos tal cual, sin modificar su lógica interna.

| Componente | Dónde lo usamos | Qué hace |
|---|---|---|
| **Button** | Todas las páginas | Botones con variantes `filled`, `outlined`, `ghost`. Tiene ripple effect y transiciones. |
| **Card** | HomePage | Tarjeta de libro con imagen, título, autor, badge de calificación y botones de acción que aparecen al hacer hover. |
| **Input** | LoginPage, RegistroPage | Campo de texto con soporte para `type="password"` con toggle de visibilidad. Expone `.value`. |
| **Modal** | LibroPage, MiEstantePage, ResenaModal | Ventana flotante con título, cuerpo (`appendBody`) y pie (`appendFooter`). Controla apertura con `modal.open = true`. |
| **Navbar** | index.js (global) | Barra de navegación fija con logo, links y botones. Configurada una sola vez al arrancar la app. |
| **Toast** | Toda la app vía `window.showToast` | Notificación temporal. Se construye, se inserta en `document.body` y se elimina sola. |
| **Loading** | Automático por el framework | Pantalla de carga que cubre la vista mientras el router monta el componente entrante. |
| **NotFound** | routes.js | Página 404 para rutas no definidas. |

### Cómo se construye un componente

Cada componente propio sigue exactamente esta estructura que impone Slice.js:

```js
export default class MiPagina extends HTMLElement {
  static props = {
    params: { required: false }   // props declaradas
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);                      // carga MiPagina.html
    slice.controller.setComponentProps(this, props); // asigna this.params, etc.
  }

  async init() {
    // El framework llama init() automáticamente después del constructor.
    // Aquí va toda la lógica: construir sub-componentes, cargar datos, etc.
  }
}

customElements.define('slice-mi-pagina', MiPagina);
```

Cada componente tiene tres archivos: `.js`, `.html` y `.css`. El `.html` define la estructura interna del elemento. El `.css` es cargado por el framework automáticamente junto con el componente.

### Router

El router de Slice.js lee `routes.js` y mapea cada ruta a un componente:

```js
// routes.js
const routes = [
  { path: '/',                    component: 'LoginPage'     },
  { path: '/home',                component: 'HomePage'      },
  { path: '/libro/${ol_id}',      component: 'LibroPage'     },
  { path: '/perfil/${username}',  component: 'PerfilPage'    },
  { path: '/mi-estante',          component: 'MiEstantePage' },
  { path: '/login',               component: 'LoginPage'     },
  { path: '/registro',            component: 'RegistroPage'  },
  { path: '/404',                 component: 'NotFound'      },
];
```

Los segmentos con `${param}` se extraen y llegan al componente como `this.params.param`. Se navega con `slice.router.navigate('/ruta')`.

El router **cachea** los componentes ya montados por su `sliceId`. Si el usuario vuelve a una ruta ya visitada, en lugar de destruir y recrear el componente, llama a su método `update()`. Por eso, páginas que muestran datos dinámicos (como `LibroPage`) implementan `update()` para recargar la información correcta.

### Context (estado global)

El estado de autenticación vive en `slice.context`. Lo inicializamos en `index.js`:

```js
slice.context.create('auth', {
  isLoggedIn: false,
  usuario: null,
  token: null,
}, { persist: true, storageKey: 'turnpage:auth' });
```

Con `persist: true`, el contexto se guarda en `localStorage` bajo la clave `turnpage:auth`. Cuando el usuario cierra y reabre el navegador, sigue logueado.

Las páginas leen el estado con `slice.context.getState('auth')`. El navbar **reacciona** a cambios en `auth` mediante `slice.context.watch()`:

```js
slice.context.watch('auth', navbar, async () => {
  await _actualizarNavbarButtons(navbar);
}, (s) => s.isLoggedIn); // solo re-ejecuta si cambia isLoggedIn
```

### Temas (Theme Manager)

Slice.js carga automáticamente el tema indicado en `sliceConfig.json` (`"defaultTheme": "Slice"`), que corresponde al archivo `src/Themes/Slice.css`. Ese archivo define las **variables CSS globales** que usan todos los componentes del framework y los propios.

---

## Lo que construimos nosotros

### ApiService — la "base de datos"

**Ubicación:** `src/Components/Service/ApiService/ApiService.js`

`ApiService` es una clase plana (no extiende `HTMLElement`) que actúa como capa de datos completa de la app. Usa `localStorage` directamente con tres claves:

| Clave | Contenido |
|---|---|
| `tp:users` | Array de usuarios registrados (con contraseña hasheada con SHA-256 via Web Crypto API) |
| `tp:resenas` | Array de todas las reseñas de todos los usuarios |
| `tp:estante` | Array de todos los libros en el estante de todos los usuarios |

Se registra como **singleton** de Slice.js con `sliceId: 'api-service'` para que todas las páginas compartan la misma instancia sin duplicados:

```js
const api = await slice.build('ApiService', { sliceId: 'api-service', singleton: true });
// En páginas que se montan después del login, también:
const api = slice.getComponent('api-service') || await slice.build('ApiService', { sliceId: 'api-service' });
```

**Métodos disponibles:**

- `registro(username, email, password)` — crea usuario, hashea contraseña, devuelve `{ token, usuario }`
- `login(email, password)` — verifica hash, devuelve `{ token, usuario }`
- `buscarLibros(query)` — llama a Open Library API
- `getDetalleLibro(ol_id)` — llama a Open Library API, resuelve el nombre del autor con una segunda petición
- `getLibrosPopulares()` — agrupa reseñas por libro, calcula promedio y ordena por popularidad
- `getResenasPorLibro(ol_id)` — devuelve reseñas + estadísticas (promedio, % recomienda, total)
- `crearResena(...)` — guarda nueva reseña en `tp:resenas`
- `eliminarResena(id)` — elimina reseña verificando que pertenezca al usuario activo
- `getMiEstante()` — devuelve estante del usuario logueado
- `agregarAlEstante(ol_id, ...)` — agrega o actualiza un libro en el estante (upsert por `ol_id + usuario_id`)
- `actualizarEstante(id, estado, privado)` — cambia estado o privacidad de un libro del estante
- `eliminarDelEstante(id)` — quita un libro del estante
- `getPerfil(username)` — devuelve datos del usuario + su estante público + total de reseñas

El ID del usuario activo se obtiene desde `slice.context.getState('auth').token`, que internamente es el `_id` del documento de usuario.

### Páginas de la app

Todas las páginas son Web Components que el router de Slice.js instancia y monta en `#router-outlet`.

#### LoginPage — `src/Components/AppComponents/LoginPage/`

Formulario de inicio de sesión. Construye un `Input` para email, otro para contraseña y un `Button`. Al iniciar sesión exitosamente actualiza `slice.context` con `setState('auth', ...)`, lo que dispara el watcher del navbar para mostrar los botones de usuario.

#### RegistroPage — `src/Components/AppComponents/RegistroPage/`

Igual que LoginPage pero con tres campos (username, email, contraseña). Valida que la contraseña tenga al menos 6 caracteres antes de llamar a `api.registro()`.

#### HomePage — `src/Components/AppComponents/HomePage/`

La pantalla principal. Tiene tres secciones:

1. **Búsqueda:** un `Input` + `Button` que llama a `api.buscarLibros()` y muestra resultados en una grilla de `Card`.
2. **Sugerencias aleatorias:** al montar, elige un tema al azar de una lista de 15 clásicos y consulta Open Library para mostrar 8 libros con portada.
3. **Más reseñados:** llama a `api.getLibrosPopulares()` para mostrar los libros con más reseñas.

Cada `Card` tiene dos acciones: *Ver libro* (navega a `/libro/:ol_id`) y *+ Estante* (abre un `Modal` con tres botones de estado).

#### LibroPage — `src/Components/AppComponents/LibroPage/`

Página de detalle de un libro. Carga en paralelo el detalle del libro (Open Library) y las reseñas (localStorage). Muestra:

- Portada, título, autor, descripción
- Estadísticas: promedio de calificación, % que recomienda, total de reseñas
- Botones *+ Mi estante* y *Escribir reseña* (solo si hay sesión iniciada)
- Listado de reseñas de la comunidad con estrellas, comentario y username clickeable

Implementa `update()` porque el router cachea el componente: si el usuario navega de un libro a otro y vuelve al primero, `update()` recarga los datos correctos sin destruir el componente.

#### MiEstantePage — `src/Components/AppComponents/MiEstantePage/`

Muestra los libros del usuario en tres secciones: *Leyendo*, *Ya leídos*, *Quiero leer*. Cada tarjeta tiene:

- Un `<select>` para cambiar el estado del libro (Leyendo / Ya leído / Quiero leer)
- Un `Button` para alternar entre público y privado
- Un `Button` para quitar el libro del estante (con modal de confirmación)

Cada cambio llama a `api.actualizarEstante()` y luego a `_cargar()` para re-renderizar con los datos actualizados.

#### PerfilPage — `src/Components/AppComponents/PerfilPage/`

Vista pública de un usuario. Recibe `username` como parámetro de ruta. Llama a `api.getPerfil(username)` y muestra un avatar con la inicial, bio, contadores y el estante público del usuario. Cada libro del estante es clickeable y navega al detalle del libro.

### ResenaModal

**Ubicación:** `src/Components/AppComponents/ResenaModal/`

Componente que envuelve el `Modal` de Slice.js para crear la interfaz de escritura de reseñas. No tiene `.html` propio: construye su contenido dinámicamente en `init()`. El cuerpo incluye:

- Cinco estrellas clickeables con feedback visual (se iluminan hasta la seleccionada)
- Un `<textarea>` para el comentario
- Dos botones de *¿Lo recomiendas?* con estado activo/inactivo

Al guardar, llama a `api.crearResena()` y ejecuta el callback `onGuardar` que le pasa la página padre (LibroPage recarga estadísticas y reseñas sin navegar).

### Tema visual personalizado

**Ubicación:** `src/Themes/Slice.css`

Sobreescribimos todas las variables CSS del tema por defecto de Slice.js con una paleta de biblioteca antigua:

| Variable | Color | Significado visual |
|---|---|---|
| `--primary-color` | `#7B2D3E` | Borgoña — encuadernación de cuero |
| `--secondary-color` | `#C9962A` | Dorado — cantos de páginas antiguas |
| `--primary-background-color` | `#FDF6E3` | Pergamino / marfil cálido |
| `--font-primary-color` | `#2C1810` | Tinta oscura, marrón café |
| `--color-surface` | `#F5E6C8` | Papel envejecido |

Estas variables las consumen automáticamente los componentes del framework (`Button`, `Card`, `Modal`, etc.) sin que tengamos que tocarlos.

### Estilos globales

**Ubicación:** `src/App/style.css`

Estilos que aplican a toda la app por encima de lo que hace Slice.js:

- Reset global (`box-sizing`, `margin`, `padding`)
- Tipografías: **Playfair Display** para títulos (elegante, serif) y **Lora** para cuerpo (legible, literario)
- Forzado del navbar a fondo `#1C0A05` (marrón casi negro) con borde dorado inferior
- Estilos del layout de páginas de autenticación (`.auth-box`)
- Grilla de tarjetas de libros (`.home-grid`)
- Ajustes del contenido bajo el navbar fijo

Adicionalmente, cada página y componente propio tiene su propio `.css` (por ejemplo `LibroPage.css`, `MiEstantePage.css`) que Slice.js carga automáticamente junto con el componente.

### Logo y favicon

**Ubicación:** `src/images/`

Dos SVGs diseñados para la identidad visual de TurnPage:

- **`favicon.svg`** — icono cuadrado de 32×32. Fondo circular borgoña (`#7B2D3E`) con un libro abierto en crema y dorado, y un rizo de página girada en la esquina inferior derecha.
- **`logo.svg`** — versión horizontal para el navbar: el mismo icono a la izquierda y el texto *TurnPage* en Georgia serif itálica a la derecha.

El HTML carga el SVG como favicon primario (los navegadores modernos lo prefieren sobre `.ico`), con el `.ico` existente como fallback.

### Bootstrap de la app (index.js)

**Ubicación:** `src/App/index.js`

Este archivo arranca toda la aplicación. Slice.js tarda un instante en inicializarse, por lo que `esperarSlice()` hace polling hasta que `window.slice.router`, `window.slice.context` y `window.slice.build` estén disponibles.

Luego:

1. Crea el contexto `auth` con persistencia en `localStorage`
2. Construye el `Navbar` con el logo, el link de *Inicio* y los botones dinámicos (que cambian según si hay sesión o no)
3. Inserta el navbar **antes** del `#app` en el DOM, para que el router no lo destruya al navegar
4. Registra un watcher en `slice.context` que actualiza los botones del navbar cada vez que `auth.isLoggedIn` cambia

También define `window.showToast` como función global, accesible desde cualquier componente sin tener que importar nada.

---

## Flujo de datos

```
Open Library API
    │
    ▼
ApiService.buscarLibros / getDetalleLibro
    │
    ▼
HomePage / LibroPage   ──────────────────────────────────┐
    │                                                     │
    │ agregarAlEstante / crearResena                      │
    ▼                                                     │
localStorage (tp:estante, tp:resenas, tp:users)           │
    │                                                     │
    ▼                                                     │
MiEstantePage / PerfilPage / LibroPage (estadísticas) ◄──┘
```

No hay servidor propio. La app es completamente estática y funciona offline una vez cacheada, excepto la búsqueda de libros y portadas que depende de Open Library.

---

## Open Library API

Usamos tres endpoints públicos y gratuitos de [openlibrary.org](https://openlibrary.org):

| Endpoint | Uso |
|---|---|
| `/search.json?q={query}&limit=20` | Búsqueda de libros por texto |
| `/works/{ol_id}.json` | Detalle de un libro (descripción, portadas, autores) |
| `/authors/{author_key}.json` | Nombre completo del autor |
| `https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg` | Imagen de portada en tamaños S, M, L |

No requiere API key.
