# Frontend

Frontend React + TypeScript con Next.js. Exportación independiente del prototipo de Sites; conserva las pantallas y estilos originales y añade autenticación compatible con Django REST Framework + SimpleJWT.

## Arranque

Requiere Node.js >=22.13 y npm. Desde esta carpeta:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abrir http://localhost:3000/login. `BACKEND_URL` apunta al origen de Django (por defecto http://127.0.0.1:8000), sin `/api`. Reiniciar Next después de cambiarlo. Next reenvía `/api/*` al backend; el navegador utiliza el mismo origen y no necesita CORS para este recorrido. Mantener Django ejecutándose y crear una cuenta allí o mediante su endpoint de registro. No se incluyen cuentas ni contraseñas.

En producción usar `npm run build` y `npm start`, configurar BACKEND_URL antes de compilar y HTTPS. Este proyecto necesita servidor Next; no es una exportación HTML estática. El backend debe aceptar el host correspondiente en ALLOWED_HOSTS. No poner secretos en variables NEXT_PUBLIC.

## Qué está conectado

- `/login`: POST `/api/token/` con `{username,password}`.
- `/cuenta`: GET `/api/archivos/` con Bearer token; muestra solamente la respuesta real.
- Renovación con POST `/api/token/refresh/` tras un 401, una sola renovación compartida entre peticiones concurrentes y un único reintento.
- Logout local borra tokens y datos visibles.
- Estados de carga, lista vacía, credenciales inválidas, servidor no disponible y acceso denegado.

Los tokens se guardan solamente en memoria. Recargar requiere iniciar sesión de nuevo. Es una decisión provisional explícita: no se almacenan refresh tokens en localStorage. Cerrar sesión NO revoca tokens emitidos en el servidor; falta acordar persistencia, cookies/CSRF si corresponde, y revocación con el backend. Los guards de React son UX; la seguridad reside en Django.

## Qué sigue siendo demo

`/proyectos`, `/proyectos/[id]`, `/grupos` y `/grupos/[id]` conservan datos ficticios en React Context. La demo es pública deliberadamente, no requiere login y no recibe los archivos reales. Sus tareas, notas, conversaciones, roles, subida local y funciones de compartir no persisten en el backend. No inferir permisos reales del selector de roles.

El listado real de archivos no ofrece descarga directa por `/media/`: esa ruta del backend revisado no aplica autorización. Tampoco se habilita subida real mientras falten validaciones del proyecto de destino. No inventamos endpoints de proyectos o equipos que el servidor aún no expone.

## Compatibilidad y siguiente integración

Revisado contra https://github.com/Frobama/proyecto-django, commit `5536667649109688581c1966b16e4ee7c26e2ea5` (2026-09-26).

- `Usuario` corresponde a la identidad de Django; login actual es por username.
- `Equipo` corresponde a Grupo en la interfaz.
- `Proyecto` tiene múltiples equipos; no asumir un único propietario a partir del primer equipo.
- `Archivo` se modela exactamente como `ArchivoDTO` en `lib/api.ts`.
- `global` no se interpreta como público; pendiente definición del backend.

Próximo trabajo: validar creación y cambios de proyecto en archivos, aplicar roles, descargar con autorización y añadir endpoints de proyectos/equipos/me. Después reemplazar el store de demo con servicios REST y adaptar sus tipos. Las pantallas deberán reflejar datos ausentes sin inventar autores, estados o permisos.

Primera versión de archivos: PDF/imágenes con vista previa cuando exista descarga autorizada; otros formatos admitidos, almacenamiento y descarga. Sin edición avanzada ni historial real por ahora.

## Estructura

- `app/login/page.tsx`: formulario conectado.
- `app/cuenta/page.tsx`: primer recorrido real.
- `lib/api.ts`: transporte, JWT y DTO del backend.
- `components/nexo/`: interfaz original y store de demostración.
- `app/globals.css`: estilo compartido y login responsive.
- `docs/FRONTEND_GUIDELINES.md`: guía original de diseño, no contrato del backend.
- `tests/api.test.mjs`: pruebas de autenticación con transporte simulado.

## Verificación

```bash
npm run typecheck
npm test
npm run build
```

Validado: TypeScript, build de producción y pruebas del cliente HTTP con respuestas simuladas (login, Bearer, renovación concurrente, 401, 403 y logout). No se ha probado contra un backend Django activo ni con credenciales reales.

## Incorporar a tu repositorio vacío

Clona TU repositorio, copia dentro el contenido de esta carpeta (incluidos `.gitignore` y `.env.example`) y ejecuta:

```bash
git add .
git commit -m "feat: frontend Nexo con login JWT y referencia visual"
git push
```

No copiar node_modules, .next ni .env.local. El ZIP no contiene historial Git, credenciales ni configuración de hosting Sites. Se usa Next.js estándar en lugar del runtime Vinext/Sites para conservar las rutas y componentes React existentes sin depender del hosting original.
