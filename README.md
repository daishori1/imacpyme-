Fireasset

Sistema ligero de gestión de inventario para pequeñas y medianas empresas: controla stock, proveedores y usuarios desde un solo panel, con acceso por Google y alertas automáticas a Discord.
Demo en producción: https://fireasset.vercel.app

Proyecto escolar desarrollado como MVP — Powered by Maymic.

 Características
Control de stock: cada artículo tiene número de serie, marca, costo, responsable, ubicación y proveedor. Edición en línea desde la tabla.
Alertas de stock bajo / alto: los artículos por debajo del mínimo o por encima del máximo se resaltan, aparecen en la campana del dashboard y se reportan a un canal de Discord.
Dashboard en vivo: KPIs, últimos 10 movimientos y gráfica de valor de inventario por marca.
Acceso seguro: inicio de sesión con Google + lista blanca (solo correos registrados y activos en la base de datos).
Proveedores y usuarios: alta, listado y activación/desactivación.
Filtros en todas las tablas.
Modo oscuro (tema Dracula), guardado por navegador.
 Tecnologías
Capa	Tecnología
Backend	Node.js, Express 5
Base de datos	PostgreSQL (Neon)
Autenticación	Google OAuth 2.0 (googleapis)
Sesiones	express-session + connect-pg-simple
Frontend	HTML, CSS y JavaScript puro, Bootstrap 5, Chart.js
Despliegue	Vercel
Alertas	Webhook de Discord




 Estructura del proyecto
.
├── api/
│   └── index.js        # Punto de entrada para Vercel (exporta la app Express)
├── backend/
│   ├── routes.js       # Servidor Express: rutas, autenticación y API
│   └── server.js       # Conexión (pool) a PostgreSQL
├── frontend/           # Páginas HTML, estilos y tema
├── docs/
│   ├── TECHNICAL.md    # Documentación técnica
│   └── USER_GUIDE.md   # Guía de usuario
├── schema.sql          # Esquema histórico de la base de datos
├── vercel.json         # Configuración de despliegue
└── package.json
 Ejecución local

Requisitos: Node.js 18+ y una base de datos PostgreSQL (por ejemplo, en Neon).

bash
# 1. Clonar e instalar
git clone https://github.com/<tu-usuario>/<tu-repo>.git
cd <tu-repo>
npm install

# 2. Crear el archivo .env en la raíz (ver variables abajo)

# 3. Iniciar en modo desarrollo
npm run dev

La app queda en http://localhost:5050.

Variables de entorno (.env)
env
DATABASE_URL=postgresql://usuario:password@host/imac?sslmode=require
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:5050/auth/google/callback
SESSION_SECRET=una-cadena-larga-y-aleatoria
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/xxxx

Despliegue en Vercel
Sube el repositorio a GitHub e impórtalo en Vercel (Framework Preset: Other).
Agrega las variables de entorno anteriores, usando como GOOGLE_REDIRECT_URI la URL de producción: https://<tu-dominio>.vercel.app/auth/google/callback
Registra esa misma URL en Authorized redirect URIs de tu cliente OAuth en Google Cloud Console.
Despliega (o haz Redeploy tras cambiar variables).

Detalles completos en docs/TECHNICAL.md.

Documentación
Guía de usuario: cómo usar la aplicación.
 Documentación técnica: arquitectura, base de datos, API y despliegue.
Créditos
Daishori , maskpito , master0.5
