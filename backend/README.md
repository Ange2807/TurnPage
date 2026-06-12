# TurnPage · Backend API

API REST construida con **Node.js + Express**. Para pruebas locales usa almacenamiento JSON.

## Requisitos previos
- Node.js 18+

> Nota: Para pruebas locales no se requiere PostgreSQL. El backend guarda datos en `src/data/data.json`.

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno
copy .env.example .env
# Edita .env con un `JWT_SECRET` seguro si lo deseas

# 3. Arrancar el servidor
npm run dev

Si prefieres usar PostgreSQL en lugar del almacén JSON, puedes ejecutar el esquema en `src/config/schema.sql` y restaurar una conexión de base de datos.
```

## Endpoints

### Auth
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/registro` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |

### Usuarios
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/usuarios/:username` | Ver perfil público | No |
| PUT | `/api/usuarios/perfil` | Editar perfil propio | Sí |

### Libros
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/libros` | Libros más populares | No |
| GET | `/api/libros/:ol_id` | Detalle + stats + reseñas | No |
| POST | `/api/libros` | Guardar libro de Open Library | Sí |

### Reseñas
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/resenas/libro/:libro_id` | Reseñas de un libro | No |
| GET | `/api/resenas/mias` | Mis reseñas | Sí |
| POST | `/api/resenas` | Crear/actualizar reseña | Sí |
| DELETE | `/api/resenas/:id` | Eliminar reseña propia | Sí |

### Estante
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/estante` | Mi estante completo | Sí |
| POST | `/api/estante` | Agregar libro al estante | Sí |
| PUT | `/api/estante/:id` | Cambiar estado o privacidad | Sí |
| DELETE | `/api/estante/:id` | Quitar libro del estante | Sí |

## Autenticación
Los endpoints protegidos requieren el header:
```
Authorization: Bearer <token>
```
El token se obtiene al hacer login o registro.
