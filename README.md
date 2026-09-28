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
| Listado y creación de proyectos y grupos | Pendientes de soporte en la API. Los formularios se pueden explorar, pero no guardar. |
| Subida y descarga privada de archivos | Pendientes de integración con las validaciones y autorización necesarias. |
| Notas, tareas, conversaciones y gestión de integrantes | Contempladas en el diseño; sin persistencia integrada. |

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
| `/proyectos/[id]` | Ruta de detalle preparada para la futura integración de proyectos. |
| `/grupos/[id]` | Ruta de detalle preparada para la futura integración de grupos. |
| `/cuenta` | Redirección de compatibilidad a `/proyectos`. |

Mientras la API no permita consultar proyectos y grupos, sus listados y detalles informan que la función está pendiente. Los formularios de creación explican esta limitación antes de introducir datos y mantienen el envío deshabilitado.

## Integración con la API

El navegador realiza las peticiones al mismo origen del frontend. Next.js las reenvía al backend mediante las reglas de `next.config.ts`.

| Método | Endpoint utilizado | Operación |
| --- | --- | --- |
| `POST` | `/api/token/` | Obtener los tokens con `{ username, password }`. |
| `POST` | `/api/token/refresh/` | Renovar el token de acceso. |
| `GET` | `/api/archivos/` | Consultar archivos con autenticación Bearer. |

Las **barras finales** forman parte de las rutas utilizadas por Django. El proxy conserva el destino `/api/:path*/` y utiliza `skipTrailingSlashRedirect: true` para evitar que Next.js las elimine antes de reenviar la petición.

En el contrato actual, `Equipo` corresponde a **Grupo** en la interfaz. La existencia de modelos de proyectos y equipos en el backend no implica que estén disponibles mediante endpoints. Tampoco se infieren roles, integrantes o identidad a partir de los archivos recibidos.

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

Las pruebas automatizadas actuales cubren el cliente HTTP con respuestas simuladas: autenticación, envío del token, renovación compartida, errores de autorización, cierre de sesión y rechazo de respuestas de cuentas anteriores. No sustituyen las pruebas del recorrido completo en navegador con el backend.

Para ejecutar localmente la compilación de producción:

```bash
pnpm build
pnpm start
```

Configura `BACKEND_URL` antes de compilar. La aplicación requiere un servidor Next.js para atender las rutas y el proxy; no utiliza una exportación HTML estática.

## Evolución prevista

Los siguientes pasos de integración dependen del contrato que exponga el backend:

1. Consultar y crear proyectos y grupos con datos confirmados por el servidor.
2. Incorporar la identidad de la cuenta y los permisos efectivos por acción.
3. Habilitar subida, descarga y vista previa de archivos con autorización.
4. Conectar integrantes, accesos y los recursos colaborativos previstos en el diseño.

El desarrollo debe mantener la separación entre datos reales y ejemplos de demostración, reutilizar los componentes existentes y comunicar claramente las funcionalidades todavía no disponibles.
