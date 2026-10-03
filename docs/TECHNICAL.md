# Documentación técnica — Fireasset

## 1. Visión general

Fireasset es una aplicación web de inventario con arquitectura cliente-servidor sencilla:

- **Frontend**: páginas HTML estáticas con JavaScript puro que consumen la API mediante `fetch`.
- **Backend**: una única app **Express 5** que sirve la API REST y las páginas.
- **Base de datos**: PostgreSQL alojado en **Neon**.
- **Autenticación**: Google OAuth 2.0 con sesiones guardadas en PostgreSQL.
- **Hosting**: **Vercel** (la app Express corre como función serverless).

```
Navegador ──► Vercel (api/index.js → backend/routes.js) ──► Neon (PostgreSQL)
                         │
                         ├──► Google OAuth (login)
                         └──► Discord Webhook (alertas)
```

## 2. Estructura del repositorio

| Ruta | Descripción |
|---|---|
| `api/index.js` | Entrada para Vercel: `module.exports = require('../backend/routes.js')` |
| `backend/routes.js` | App Express: sesiones, autenticación, rutas de páginas y API |
| `backend/server.js` | Crea y exporta el `Pool` de `pg`; carga `.env` desde la raíz |
| `frontend/` | Páginas HTML, `log.css` (estilos y tema oscuro), `theme.js` (toggle de tema) |
| `schema.sql` | Esquema histórico de la base (ver §3) |
| `vercel.json` | Reescritura de todas las rutas a `/api` e inclusión de `frontend/**` en la función |

### Frontend (páginas)

| Página | Acceso | Función |
|---|---|---|
| `login.html`, `docs.html`, `features.html`, `pricing.html` | Pública | Landing, documentación, características, precios |
| `main.html` | Protegida | Dashboard (KPIs, alertas, movimientos, gráfica) |
| `stock.html` / `stock-add.html` | Protegida | Tabla con edición en línea / alta de artículos |
| `vendors.html` / `vendors-add.html` | Protegida | Listado y alta de proveedores |
| `users.html` / `users-add.html` | Protegida | Listado y alta de usuarios |

Librerías cargadas por CDN: Bootstrap 5.3.8, Bootstrap Icons 1.11.3 y Chart.js 4.4.4.

## 3. Base de datos

Base: `imac` (PostgreSQL). Tablas principales:

### `users`
| Columna | Tipo | Notas |
|---|---|---|
| `users_id` | INTEGER, identity, PK | |
| `name` | VARCHAR(30) | NOT NULL |
| `email` | VARCHAR(30) | NOT NULL, UNIQUE (se usa para el login) |
| `phone` | VARCHAR(30) | |
| `rol` | VARCHAR(30) | NOT NULL, texto libre |
| `active` | BOOLEAN | Solo usuarios activos pueden iniciar sesión |
| `create_at` | TIMESTAMP | Default `CURRENT_TIMESTAMP` |

### `vendors`
| Columna | Tipo | Notas |
|---|---|---|
| `vendor_id` | INTEGER, identity, PK | |
| `name` | VARCHAR(30) | NOT NULL |
| `email` | VARCHAR(30) | NOT NULL, UNIQUE |
| `phone` | VARCHAR(30) | |
| `active` | BOOLEAN | |
| `create_at` | TIMESTAMP | Default `CURRENT_TIMESTAMP` |

### `stock`
| Columna | Tipo | Notas |
|---|---|---|
| `item_id` | INTEGER, identity, PK | |
| `product_name`, `brand`, `owner` | VARCHAR(30) | NOT NULL |
| `serial_number` | VARCHAR(30) | NOT NULL (el código devuelve 409 si se duplica) |
| `stock` | NUMERIC | NOT NULL, `CHECK (stock >= 0)` |
| `cost` | NUMERIC | NOT NULL, `CHECK (cost >= 0)` |
| `location` | VARCHAR(30) | |
| `vendor` | INTEGER | FK → `vendors(vendor_id)`, opcional |
| `users_id` | INTEGER | FK → `users(users_id)`, NOT NULL ("Added by") |
| `create_at` | TIMESTAMP | |
| `min_stock`, `max_stock` | NUMERIC | Umbrales de alerta (por defecto 5 y 100) |
| `updated_at` | TIMESTAMP | Usado para "últimos movimientos" |

> **Nota:** `min_stock`, `max_stock` y `updated_at` son usadas por el código y existen en la base desplegada, pero **no están en `schema.sql`**, que se conserva solo como histórico.

### `session`
Tabla requerida por `connect-pg-simple` para guardar sesiones:

```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

## 4. Autenticación y sesiones

1. El usuario pulsa **Sign in** → `GET /auth/google` redirige a Google (scopes: `openid`, `email`, `profile`).
2. Google regresa a `GET /auth/google/callback` con un `code`.
3. El servidor intercambia el código por tokens, **verifica el ID token** (`audience` = `GOOGLE_CLIENT_ID`) y exige `email_verified`.
4. Busca el correo en `users` con `active = true` (lista blanca). Si no existe → `/login.html?error=unauthorized`.
5. Si existe, guarda `{ id, name, email, rol }` en `req.session.user` y redirige a `/main.html`.

Detalles de sesión:
- Almacenadas en PostgreSQL (tabla `session`), duración de **8 horas**.
- Cookie `secure` cuando `NODE_ENV === 'production'`.
- `app.set('trust proxy', 1)` es **necesario en Vercel**: sin él, Express no reconoce el HTTPS del proxy y no guarda la cookie segura.
- `requireAuth` redirige a `/login.html` si no hay sesión (incluso en rutas de API).

Errores mostrados en el login: `unauthorized`, `unverified`, `server`.

## 5. Referencia de la API

Todas las rutas (excepto las de autenticación) requieren sesión activa. Formato JSON.

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/google` | Inicia el flujo OAuth |
| GET | `/auth/google/callback` | Callback de Google |
| GET | `/auth/logout` | Destruye la sesión y redirige al login |
| GET | `/api/me` | Usuario de la sesión (`id`, `name`, `email`, `rol`) |

### Stock
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stock` | Lista con nombre del proveedor (`vendor_name`) |
| POST | `/stock` | Crea artículo. Requeridos: `product_name`, `serial_number`, `brand`, `stock`, `cost`, `owner`, `users_id` |
| PUT | `/stock/:id` | Actualiza campos editables, incluidos `min_stock` y `max_stock` |
| GET | `/stock/recent` | Últimos 10 movimientos (por `updated_at`) |
| GET | `/stock/summary` | Valor total (`cost × stock`) agrupado por marca |
| GET | `/stock/low` | Artículos bajo el mínimo o sobre el máximo (`alert_type`: `low` / `high`) |
| POST | `/stock/notify-low` | Envía el reporte de alertas al webhook de Discord |

### Proveedores (`vendors`) y usuarios (`users`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/vendors` · `/users` | Lista completa |
| GET | `/vendors/:id` · `/users/:id` | Detalle |
| POST | `/vendors` · `/users` | Crear (`users` además requiere `rol`) |
| PUT | `/vendors/:id` · `/users/:id` | Actualizar |
| PATCH | `/vendors/:id/active` · `/users/:id/active` | Activar / desactivar (`{ "active": true }`) |

### Dashboard
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/stats` | `total_items`, `total_units`, `total_value`, `active_vendors`, `active_users` |

### Códigos de respuesta
`200`/`201` éxito · `400` faltan campos · `404` no encontrado · `409` duplicado (correo o número de serie) · `500` error de base de datos.

## 6. Alertas a Discord

- `main.html` llama a `POST /stock/notify-low` al cargar el dashboard, con un **límite de 1 envío cada 10 minutos por navegador** (control en `localStorage`).
- El servidor consulta los artículos fuera de rango y envía un mensaje al webhook con dos secciones: *Below minimum* y *Overstocked*. Si no hay alertas, no envía nada.

## 7. Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Neon (se recomienda la versión *pooled*) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales OAuth de Google Cloud |
| `GOOGLE_REDIRECT_URI` | URL de callback; debe coincidir **exactamente** con la registrada en Google |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión |
| `DISCORD_WEBHOOK_URL` | Webhook del canal de alertas |
| `NODE_ENV` | `production` en Vercel (lo define la plataforma) |

En local, `backend/server.js` carga el `.env` desde la **raíz** del proyecto (`../.env`).

## 8. Despliegue en Vercel

**Configuración** (`vercel.json`):

```json
{
  "version": 2,
  "functions": { "api/index.js": { "includeFiles": "frontend/**" } },
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

- Todo el tráfico se reescribe a la función `api/index.js`, que exporta la app Express.
- `includeFiles` empaqueta `frontend/` dentro de la función (Express sirve los HTML con `sendFile`).
- `app.listen` solo corre cuando `NODE_ENV !== 'production'`, por lo que no interfiere con serverless.
- El `package.json` debe estar en la **raíz** del repositorio.

**Pasos:**
1. Importar el repo en Vercel (*Framework Preset: Other*, sin *build command*).
2. Cargar las variables de entorno.
3. En Google Cloud Console → *Credentials* → cliente OAuth → agregar `https://<dominio>.vercel.app/auth/google/callback` en *Authorized redirect URIs*.
4. Desplegar. Tras cambiar variables, hacer *Redeploy*.

**Para que otras personas entren:** agregar sus correos como *Test users* en la pantalla de consentimiento de OAuth (o publicar la app) **y** registrarlos como usuarios activos en la tabla `users`.

**Problemas frecuentes**

| Síntoma | Causa probable |
|---|---|
| `redirect_uri_mismatch` | La URL de Google Console y `GOOGLE_REDIRECT_URI` no son idénticas |
| El login regresa siempre a `/login.html` | Falta `app.set('trust proxy', 1)` |
| Error de sesión / 500 al entrar | Falta la tabla `session` en la base |
| `unauthorized` al entrar | El correo no está en `users` o `active = false` |
| 404 en la URL base | Falta la ruta `/` o el `vercel.json` |

## 9. Limitaciones conocidas y mejoras futuras

- **Roles sin permisos**: `rol` es texto libre y no restringe acciones; cualquier usuario activo puede crear/editar todo.
- **Proveedor y "Added by"** no se pueden editar desde la interfaz tras crear el artículo.
- **XSS**: las tablas insertan datos con `innerHTML` sin escapar; conviene sanitizar o usar `textContent`.
- `GET /users` y `GET /vendors` devuelven `404` cuando la tabla está vacía (en vez de lista vacía).
- `main.html` contiene el bloque de notificación a Discord **duplicado**; basta con conservar uno.
- Sin pruebas automáticas ni validación de entradas más allá de campos requeridos.
- Posibles mejoras: permisos por rol, edición de proveedores/usuarios desde la UI, paginación, historial de movimientos, exportación a CSV, notificaciones programadas (cron) en lugar de depender de la apertura del dashboard.
