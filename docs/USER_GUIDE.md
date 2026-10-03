# Guía de usuario — Fireasset

Fireasset te ayuda a llevar el control de tu inventario, tus proveedores y tu equipo desde un solo lugar.

🌐 **Dirección de la aplicación:** https://fireasset.vercel.app

---

## 1. Cómo entrar

1. Abre la dirección de la aplicación.
2. Haz clic en **Sign in** o **Continue with Google**.
3. Elige tu cuenta de Google.

> ⚠️ Solo pueden entrar las personas que un administrador haya dado de alta. Tu correo de Google debe ser **exactamente** el que fue registrado.

**Si ves "Access Denied":**

| Mensaje | Qué significa |
|---|---|
| *Your account is not authorized…* | Tu correo no está registrado o está desactivado. Pide acceso a un administrador. |
| *Your Google account email could not be verified* | Google no pudo verificar tu correo. Prueba con otra cuenta. |
| *Something went wrong during sign-in* | Error temporal. Inténtalo de nuevo. |

Tu sesión dura **8 horas**; después tendrás que iniciar sesión otra vez.

## 2. Conoce la pantalla

- **Menú lateral (izquierda)**: secciones **Stock**, **Vendors** (proveedores) y **Users** (usuarios). Cada una tiene *View table* (ver la tabla) y *Add* (agregar).
- **Ícono 🔥 Fireasset**: te regresa al panel principal.
- **Toggle Theme**: cambia entre modo claro y oscuro (se recuerda en tu navegador).
- **View Profile**: muestra tu nombre, correo y rol.
- **Log Out**: cierra tu sesión.

## 3. Panel principal (Dashboard)

Al entrar verás:

- **Tarjetas de resumen**: número de artículos, valor total del inventario, proveedores activos y usuarios activos.
- **Campana 🔔 de alertas**: muestra cuántos artículos necesitan atención. Al abrirla ves cuáles tienen poco stock (en rojo) y cuáles tienen exceso (en amarillo).
- **Últimos 10 movimientos**: los artículos modificados más recientemente.
- **Gráfica de valor por marca**: cuánto dinero representa el inventario de cada marca.

Además, cuando hay alertas, se envía un aviso al canal de Discord del equipo (como máximo una vez cada 10 minutos).

## 4. Stock (inventario)

### Ver y filtrar
Entra a **Stock → View table**. Puedes filtrar por producto, proveedor, responsable, rango de cantidad y rango de costo. El botón **Clear** quita todos los filtros.

**Colores de las filas:**
- 🟥 **Rojo**: el stock está por debajo del mínimo (hay que reponer).
- 🟧 **Naranja**: el stock está por encima del máximo (hay exceso).

### Agregar un artículo
1. **Stock → Add** (o botón **Add Item**).
2. Llena los campos:

| Campo | Descripción |
|---|---|
| Product Name | Nombre del producto |
| Serial Number | Número de serie (**único**, no puede repetirse) |
| Brand | Marca |
| Stock Quantity | Cantidad disponible |
| Cost | Costo |
| Owner | Responsable o área dueña del artículo |
| Location | Ubicación (opcional) |
| Vendor | Proveedor (opcional; déjalo vacío si fue donado o es de origen interno) |
| Added By | Quién registra el artículo |

3. Haz clic en **Save Item**.

> 💡 Los niveles mínimo y máximo se crean en **5** y **100**. Puedes cambiarlos después editando la fila en la tabla.
> ⚠️ El **proveedor** y **"Added By"** no se pueden cambiar después de guardar. Revísalos antes.

### Editar un artículo
1. En la tabla, haz clic en el ícono del **lápiz ✏️** de la fila.
2. Las celdas se convierten en campos editables (incluidos *Min* y *Max*).
3. Haz clic en **✔ (guardar)** o en **✖ (cancelar)**.

## 5. Vendors (proveedores)

- **Ver**: Vendors → View table. Puedes filtrar por ID, nombre o correo.
- **Activar/desactivar**: usa el interruptor de la columna **Active**. Un proveedor desactivado queda registrado pero no se usa en nuevas entradas.
- **Agregar**: Vendors → Add, completa nombre, correo (**único**), teléfono (opcional) y marca **Active** si corresponde. Guarda con **Save Vendor**.

## 6. Users (usuarios)

- **Ver**: Users → View table. Puedes filtrar por ID, nombre o correo.
- **Activar/desactivar**: con el interruptor **Active**. **Solo los usuarios activos pueden iniciar sesión.**
- **Agregar**: Users → Add, completa nombre, correo, teléfono (opcional) y rol, y marca **Active**. Guarda con **Save User**.

> 💡 El correo debe coincidir con la cuenta de Google con la que esa persona iniciará sesión. El rol es texto libre; usa nombres consistentes como "admin" o "staff".

## 7. Preguntas frecuentes

**No puedo iniciar sesión.**
Verifica que uses la cuenta de Google correcta y que un administrador haya registrado ese correo y lo tenga **activo**.

**Me aparece "Could not reach the server".**
Revisa tu conexión a internet e intenta de nuevo en unos segundos.

**Me aparece "serial number already exists" o "email already exists".**
Ese número de serie o correo ya está registrado. Deben ser únicos.

**La página me regresa al inicio de sesión.**
Tu sesión expiró (dura 8 horas). Vuelve a entrar con Google.

**¿Cómo desactivo a alguien sin borrarlo?**
En Users → View table, apaga el interruptor **Active** de esa persona.

---

¿Necesitas ayuda? Contáctanos por [Discord](https://discord.gg/7xDdCR7ac) o [GitHub](https://github.com/daishori1).
