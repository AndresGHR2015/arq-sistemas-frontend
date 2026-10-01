# Frontend

Espacio de trabajo colaborativo para reunir proyectos, archivos, ideas y personas. Su objetivo es que cada equipo pueda encontrar la información de su trabajo en un mismo lugar, conservando el contexto de lo que comparte y construye.

La organización gira en torno a tres conceptos:

- **Proyectos:** espacios para reunir los recursos y el trabajo relacionado con un objetivo.
- **Grupos:** equipos de personas que colaboran en uno o varios proyectos.
- **Recursos:** archivos y, como parte de la evolución del producto, notas y enlaces asociados a un proyecto.

Este repositorio contiene la interfaz web de la app. Consume la API de un backend independiente desarrollado con Django REST Framework y utiliza JWT para la autenticación.

## Estado actual

El frontend está en desarrollo. La navegación y los formularios conservan la experiencia visual del proyecto, mientras la integración se limita a las capacidades disponibles en la API.

| Funcionalidad | Estado |
| --- | --- |
| Inicio de sesión | Conectado con la API mediante nombre de usuario y contraseña. |
| Renovación de sesión | Automática tras una respuesta 401, con un único reintento. |
| Cierre de sesión | Elimina los tokens y el estado visible de la cuenta en el frontend. |
| Consulta de archivos | Muestra los archivos que el servidor permite consultar con la cuenta. |
| Navegación por Proyectos y Grupos | Disponible después del login, incluso sin archivos. |
| Proyectos y grupos | Listado, detalle, creación, edición y eliminación conectados. |
| Cuenta y permisos | Identidad real y capacidades por acción recibidas del servidor. |
| Archivos por proyecto | Subida múltiple, edición de metadatos, reemplazo, eliminación y descarga autenticada. |
| Vista previa | Imágenes PNG/JPEG/GIF/WebP y PDF mediante descarga autenticada; otros formatos se descargan como originales. |
| Integrantes y accesos | Consulta, incorporación y retirada de miembros; asociación y retirada de grupos de un proyecto. |
| Notas, tareas, conversaciones, comentarios y versiones | Contemplados en el diseño; todavía sin persistencia integrada. |

Una funcionalidad pendiente se muestra como tal, no como una consulta exitosa sin resultados. Los proyectos y grupos no se deducen del listado de archivos. Los datos de demostración permanecen separados del estado de la cuenta y no se cargan en la experiencia autenticada.

## Tecnologías

- **Next.js 16** con App Router.
- **React 19** y **TypeScript**.
- **Tailwind CSS 4** y estilos propios.
- Componentes de interfaz reutilizables en `components/ui/` e iconos de **Lucide**.
- **pnpm** para la gestión de dependencias y ejecución de scripts.
- Pruebas del cliente HTTP con el ejecutor integrado de **Node.js**.

## Desarrollo local

### Requisitos

- Node.js **22.13 o superior**.
- pnpm disponible en el entorno.
- Backend en ejecución y una cuenta válida para probar el recorrido autenticado.

El backend debe incluir tanto los endpoints de proyectos/equipos del commit `5542513` como las ampliaciones de esta integración: `/api/me/`, capacidades `permissions`, asociaciones `equipos` en proyectos y descarga autenticada. Comprueba que el proceso de Django está ejecutando esa copia del código: actualizar un checkout distinto del que monta Docker no actualiza el servidor activo.

Ejecuta los comandos desde la carpeta `arq-sistemas-frontend`.

### Instalar dependencias

```bash
pnpm install --frozen-lockfile
```

### Configurar la conexión con el backend

Por defecto, el frontend utiliza `http://127.0.0.1:8000` como origen del backend. Si necesitas otro origen, define `BACKEND_URL` en `.env.local`:

```dotenv
BACKEND_URL=http://127.0.0.1:8000
```

El valor debe contener el origen del servidor, sin el sufijo `/api`. Reinicia Next.js después de cambiarlo. Esta variable se utiliza en el servidor y no necesita el prefijo `NEXT_PUBLIC_`.

### Iniciar la aplicación

```bash
pnpm dev
```

Abre [http://localhost:3000/login](http://localhost:3000/login). Después de iniciar sesión, la aplicación te lleva a **Proyectos**; desde el sidebar puedes acceder a **Grupos** y cerrar sesión.

La interfaz actual no incluye registro de usuarios. Para entrar necesitas una cuenta existente en el backend.

## Navegación

| Ruta | Propósito |
| --- | --- |
| `/` | Redirige al inicio de sesión. |
| `/login` | Formulario de acceso. |
| `/proyectos` | Espacio principal y consulta de archivos disponibles. |
| `/grupos` | Sección de grupos y acceso al formulario de creación. |
| `/proyectos/[id]` | Recursos del proyecto, equipos asociados y gestión de accesos. |
| `/grupos/[id]` | Proyectos asociados e integrantes del grupo. |
| `/cuenta` | Redirección de compatibilidad a `/proyectos`. |

Los formularios conservan los datos si falla el guardado y solo confirman resultados aceptados por el servidor. Crear un proyecto con un grupo seleccionado es una operación atómica: se crea su equipo principal y se asocia el grupo elegido en la misma transacción. En subidas múltiples, los archivos ya confirmados no vuelven a enviarse al reintentar los pendientes.

## Integración con la API

El navegador realiza las peticiones al mismo origen del frontend. Next.js las reenvía al backend mediante las reglas de `next.config.ts`.

| Método | Endpoint utilizado | Operación |
| --- | --- | --- |
| `POST` | `/api/token/` | Obtener los tokens con `{ username, password }`. |
| `POST` | `/api/token/refresh/` | Renovar el token de acceso. |
| `GET` | `/api/me/` | Identidad y capacidades de creación. |
| `GET`, `POST` | `/api/proyectos/` | Consultar y crear proyectos. |
| `GET`, `PATCH`, `DELETE` | `/api/proyectos/{id}/` | Consultar, editar y eliminar un proyecto. |
| `GET`, `POST` | `/api/equipos/` | Consultar y crear grupos. |
| `GET`, `PATCH`, `DELETE` | `/api/equipos/{id}/` | Consultar, editar y eliminar un grupo. |
| `GET`, `POST` | `/api/proyectos/{id}/equipos/` | Consultar y asociar grupos. |
| `DELETE` | `/api/proyectos/{id}/equipos/{equipo_id}/` | Retirar la asociación de un grupo. |
| `GET` | `/api/equipos/{id}/proyectos/` | Consultar proyectos del grupo. |
| `GET`, `POST` | `/api/equipos/{id}/miembros/` | Consultar y añadir integrantes. |
| `DELETE` | `/api/equipos/{id}/miembros/{usuario_id}/` | Retirar un integrante. |
| `GET`, `POST` | `/api/archivos/` | Consultar archivos y subir mediante multipart. |
| `PATCH`, `DELETE` | `/api/archivos/{id}/` | Cambiar metadatos/contenido y eliminar archivos. |
| `GET` | `/api/archivos/{id}/download/` | Descargar el contenido con autenticación Bearer. |

Las **barras finales** forman parte de las rutas utilizadas por Django. El proxy conserva el destino `/api/:path*/` y utiliza `skipTrailingSlashRedirect: true` para evitar que Next.js las elimine antes de reenviar la petición.

En el contrato actual, `Equipo` corresponde a **Grupo** en la interfaz. Un proyecto puede tener varios equipos asociados; no se trata al primero como propietario. El acceso se determina por pertenencia a equipos, no por una jerarquía de roles. La interfaz utiliza las capacidades del servidor, sin convertir `owner` u otro texto de rol en un permiso implícito.

La incorporación de integrantes utiliza el **ID de una cuenta existente**, con un rol descriptivo opcional. No hay búsqueda de usuarios por correo ni envío de invitaciones, y no se modifica el rol de un miembro existente mediante una eliminación/recreación simulada.

La visibilidad de archivos se interpreta así:

- `global=true`: todos los equipos asociados al proyecto pueden acceder.
- `global=false`: solo usuarios que compartan un equipo del proyecto con quien subió el archivo.

Ninguna opción hace público un archivo. Django ya no sirve `/media/` directamente: la descarga utiliza los permisos del objeto y devuelve los bytes originales. Si existe otro servidor de archivos delante de Django, debe respetar esta misma restricción. Cambiar metadatos o reemplazar contenido no crea historial de versiones.

### Sesiones y estados de la interfaz

- Los tokens de acceso y renovación se mantienen **solo en memoria**. Recargar la página requiere iniciar sesión de nuevo.
- Las peticiones concurrentes que necesitan renovar el acceso comparten la misma renovación.
- Al cerrar sesión o fallar la renovación por sesión inválida, se descarta el estado de la cuenta. Las respuestas tardías de una sesión anterior no se incorporan a otra.
- El cierre de sesión es local; no revoca los tokens ya emitidos en el servidor.
- La consulta de archivos distingue carga, lista vacía, fallo de conexión, acceso denegado y otros errores, con opción de reintentar.

La autorización de los datos corresponde al backend. La navegación protegida del frontend facilita el recorrido del usuario, pero no sustituye los permisos del servidor.

## Estructura del proyecto

```text
app/                  Rutas, layout y estilos globales
components/
  nexo/               Espacio de trabajo, formularios, estado y componentes del dominio
  ui/                 Componentes visuales reutilizables
hooks/                Hooks compartidos
lib/
  api.ts              Cliente HTTP, autenticación y tipos de la API
  utils.ts            Utilidades comunes
public/               Recursos estáticos
tests/                Pruebas del cliente API
docs/                 Documentación de diseño
next.config.ts        Configuración de Next.js y proxy hacia Django
```

La guía de producto e interfaz está en [`docs/FRONTEND_GUIDELINES.md`](docs/FRONTEND_GUIDELINES.md). Describe la experiencia prevista; las capacidades implementadas deben contrastarse con la API actual.

## Comandos de comprobación

```bash
pnpm typecheck
pnpm test
pnpm build
```

Las pruebas automatizadas del cliente HTTP cubren autenticación, renovación compartida, cierre de sesión, contratos de proyectos/grupos, validaciones, subidas multipart, descarga binaria y rechazo de respuestas de cuentas anteriores. El backend incluye pruebas de permisos, creación atómica y descargas autenticadas. Estas pruebas no sustituyen la revisión de escritorio/móvil ni las comprobaciones con PostgreSQL del entorno final.

Para ejecutar localmente la compilación de producción:

```bash
pnpm build
pnpm start
```

Configura `BACKEND_URL` antes de compilar. La aplicación requiere un servidor Next.js para atender las rutas y el proxy; no utiliza una exportación HTML estática.

## Evolución prevista

Quedan pendientes las capacidades que el backend todavía no expone:

1. Notas, enlaces, tareas, conversaciones y comentarios persistentes.
2. Actividad, historial de versiones y proyectos fijados por usuario.
3. Búsqueda de usuarios e invitaciones por correo.
4. Edición de roles y una política de permisos diferenciada, si el producto la requiere.

La búsqueda actual filtra los proyectos y archivos cargados para la cuenta. La sesión sigue siendo solo en memoria y no se ha añadido registro público desde la interfaz.

El desarrollo debe mantener la separación entre datos reales y ejemplos de demostración, reutilizar los componentes existentes y comunicar claramente las funcionalidades todavía no disponibles.
