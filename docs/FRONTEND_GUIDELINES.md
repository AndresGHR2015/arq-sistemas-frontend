# Guidelines de frontend: gestor colaborativo de proyectos

Diseñar una aplicación web en React con TypeScript donde cada proyecto reúna sus archivos, notas, conversaciones y trabajo pendiente. La interfaz debe servir tanto a equipos que gestionan entregables como a una banda que organiza partituras e indicaciones. El contenido, su contexto y el acceso compartido constituyen el centro del producto.

El alcance de esta guía es el frontend y su contrato de integración mediante API REST con el backend monolítico existente. Las reglas de roles, propiedad e herencia que siguen son una propuesta de producto para acordar con ese contrato. No describen funcionalidades ya implementadas en el servidor.

**El modelo de navegación debe partir de entidades comprensibles.** Usar nombres neutrales en la interfaz: Proyecto, Grupo, Recursos, Tareas, Conversaciones y Actividad. Una partitura es un recurso; una instrucción puede ser una nota; un ensayo puede organizarse mediante tareas. Evitar exigir metodologías, sprints, presupuestos o fechas para crear un proyecto.

| Concepto | Significado para el usuario | Consecuencia para la interfaz |
| --- | --- | --- |
| Usuario | Persona con una cuenta y distintos accesos | Su rol puede cambiar entre proyectos y grupos. |
| Grupo | Equipo estable que puede participar en varios proyectos | Tiene página propia, integrantes e invitaciones reutilizables. |
| Proyecto | Espacio con un objetivo y contenido relacionado | Puede tener propietario personal o grupal, y compartirse con personas o grupos. |
| Recurso | Archivo, nota o enlace con identidad propia | Tiene título, contexto, autor, fecha, ubicación y enlace estable. |
| Tarea | Trabajo pendiente asociado a un proyecto | Puede relacionarse con recursos sin copiarlos. |
| Conversación | Hilo de discusión del proyecto o de un recurso | Conserva las respuestas y el contexto de las decisiones. |

**Propiedad y acceso deben distinguirse al compartir.** Como propuesta inicial, cada proyecto tiene un único propietario: una persona o un grupo. Puede conceder acceso a varias personas o grupos sin cambiar de propietario. Un proyecto personal compartido con una banda aparece también en la página de esa banda como “Compartido con el grupo”, apuntando al mismo proyecto.

Crear un proyecto dentro de un grupo lo incorpora a “Proyectos del grupo”. Invitar a alguien únicamente a un proyecto no lo incorpora automáticamente al grupo ni le permite explorar sus demás proyectos. Transferir propiedad, si se admite, requiere una acción específica que explique el efecto.

**La navegación principal debe ser pequeña y estable.** En escritorio, usar una barra lateral con Inicio, Proyectos y Grupos; mantener búsqueda y cuenta en la barra superior. Dentro de un proyecto, mostrar una ruta de navegación que conserve el contexto de origen. Los detalles deben tener URL propia para abrirse directamente y sobrevivir a una recarga.

| Pantalla | Contenido principal | Acciones principales |
| --- | --- | --- |
| Acceso e invitación | Inicio de sesión; destinatario, proyecto o grupo y rol de una invitación | Iniciar sesión, aceptar o rechazar; explicar invitaciones expiradas. |
| Inicio | Proyectos recientes e invitaciones pendientes | Retomar un proyecto, crear proyecto o crear grupo. |
| Proyectos | Todos los proyectos accesibles, con búsqueda y filtros por grupo, estado y propiedad | Abrir, crear y cambiar entre lista y tarjetas. |
| Grupos | Grupos de los que se forma parte | Abrir grupo o crear uno. |
| Página del grupo | Nombre, descripción, integrantes, proyectos propios y proyectos compartidos con el grupo | Abrir proyecto; crear, invitar o administrar según permiso. |
| Página del proyecto | Objetivo breve, recursos, tareas, conversaciones y actividad | Añadir contenido, buscar, compartir y administrar según permiso. |
| Detalle del recurso | Previsualización o contenido, metadatos, comentarios e historial disponible | Descargar, editar, añadir versión o copiar enlace según permiso. |
| Administración | Miembros, invitaciones, accesos y ajustes del contexto actual | Cambiar roles, retirar accesos y ejecutar acciones de propiedad permitidas. |

La página del grupo debe listar todos sus proyectos accesibles, incluidos los compartidos con él. Usar paginación cuando corresponda y mostrar los archivados mediante un filtro visible. No convertirla en una segunda copia del contenido de los proyectos.

**La página del proyecto debe priorizar los recursos.** El encabezado contiene nombre, descripción breve, estado, propietario o grupo, integrantes y rol del usuario. Reservar “Compartir” para acceso y “Añadir” para contenido. El selector Añadir ofrece Archivo, Nota y Enlace. Presentar las pestañas Recursos, Tareas, Conversaciones y Actividad; abrir Recursos de forma predeterminada.

En Recursos, incluir búsqueda, filtro por tipo o etiqueta, orden por modificación y selector lista/cuadrícula. La lista favorece documentos y partituras; la cuadrícula ayuda con imágenes y diagramas. Usar carpetas sencillas y etiquetas, evitando exigir una jerarquía profunda. Las tarjetas y filas deben abrir el mismo detalle canónico.

**Los recursos deben conservar su identidad al actualizarse.** Centralizar información requiere que el usuario reconozca el recurso vigente, quién lo modificó y qué contexto lo acompaña. Su título puede cambiar; su identificador y enlace estable deben conservarse. Adjuntar un recurso existente a una tarea o conversación debe crear una referencia a él.

| Tipo de contenido | Tratamiento inicial |
| --- | --- |
| Imagen | Miniatura y ampliación con zoom. |
| PDF, incluida una partitura | Visor con páginas, zoom y descarga cuando esté autorizada. |
| Diagrama | Previsualización de una representación compatible; acceso al archivo original. |
| Nota o apunte | Editor sencillo con formato básico, guardado explícito y estado de cambios pendientes. |
| Enlace | Título, URL y descripción; abrir indicando que lleva a otro sitio. |
| Conversación subida | Conservar archivo o texto importado, título, procedencia y fecha si se conocen. |
| Formato sin visor | Metadatos y descarga autorizada, con mensaje “Vista previa no disponible”. |

Separar la capacidad de almacenar un formato de la capacidad de previsualizarlo. Un archivo de notación musical o un diagrama editable puede ser descargable aunque no tenga editor integrado. Si más adelante se añaden audio y vídeo, usar reproductores con controles y sin reproducción automática.

Las conversaciones creadas en la plataforma funcionan inicialmente como hilos asíncronos. Permitir comentarios en recursos y enlaces desde las conversaciones a esos recursos. Una decisión relevante puede registrarse como nota y vincularse al hilo de origen. La interfaz debe distinguir ese registro del intercambio de mensajes.

Cuando el contrato admita versiones, mostrar versión actual, autor, fecha e historial de anteriores. “Nueva versión” actualiza el recurso existente. Ante un nombre repetido, preguntar si se trata de otro recurso o una actualización; no decidirlo solo por el nombre. Mostrar “Última versión” y reservar “Aprobado” para un flujo de aprobación realmente disponible. El historial necesita persistencia en el servidor; una lista local no garantiza trazabilidad.

**La carga de archivos debe explicar qué está ocurriendo.** Admitir selección mediante botón y arrastrar archivos, incluidos varios a la vez. Cada archivo conserva su propio estado: en cola, subiendo, procesando cuando aplique, disponible o error. Mostrar progreso medido cuando el transporte lo permita; usar un indicador indeterminado cuando no exista una medida real.

Presentar límites de tamaño y formatos recibidos del contrato. La validación local debe dar respuesta temprana, pero también representar los rechazos que devuelva la API. Ofrecer reintento por archivo y cancelación cuando el flujo la soporte. Si el usuario sale durante una carga o con una nota sin guardar, advertir sobre el trabajo pendiente. Confirmar “Guardado” o “Disponible” únicamente cuando el servidor confirme el estado correspondiente.

No ejecutar HTML, scripts ni SVG arbitrarios dentro del DOM de la aplicación para construir previsualizaciones. Usar formatos y visores controlados; ante un formato no soportado, conservar el flujo de descarga autorizado. El botón de vista previa debe seguir respondiendo con un error comprensible cuando el archivo falle.

**Los permisos deben presentarse por proyecto y por acción.** Esta matriz propone tres roles de colaboración, además de la propiedad. La capacidad concreta que devuelve la API para cada objeto determina las acciones visibles.

| Acción sobre un proyecto | Lector | Editor | Administrador |
| --- | --- | --- | --- |
| Ver recursos y actividad accesibles | Sí | Sí | Sí |
| Descargar originales | Si la política lo permite | Si la política lo permite | Si la política lo permite |
| Participar en conversaciones | No | Sí | Sí |
| Subir archivos, escribir notas y editar tareas | No | Sí | Sí |
| Añadir nuevas versiones | No | Sí | Sí |
| Retirar recursos mediante la acción acordada | No | Sí | Sí |
| Gestionar miembros y accesos del proyecto | No | No | Sí |
| Cambiar ajustes o archivar el proyecto | No | No | Sí |
| Transferir propiedad o eliminar definitivamente el proyecto | Reservado a la propiedad | Reservado a la propiedad | Solo si también posee la capacidad de propietario |

Si se necesita que alguien comente sin editar, añadir después el rol Comentador. Las descargas deben tener una capacidad explícita si se pretende diferenciarlas de la lectura; ocultar el botón no evita que una persona conserve contenido que ya recibió para visualizarlo.

Para los grupos, usar Propietario, Administrador y Miembro. Los dos primeros gestionan integrantes según sus capacidades; el propietario conserva las acciones de transferencia y eliminación del grupo. Para los proyectos propiedad del grupo, proponer acceso de lectura para todos sus integrantes y administración para sus administradores. La edición puede otorgarse al grupo completo o a personas concretas. La creación de proyectos se muestra según `canCreateProject`.

En proyectos externos compartidos con un grupo, sus integrantes reciben el rol concedido al grupo. Administrar ese grupo no concede por sí solo administración sobre el proyecto externo. La ventana Compartir debe mostrar persona o grupo, rol concedido y origen del acceso: “Directo” o “Heredado de Banda Norte”.

Como regla inicial, los accesos se suman y prevalece el rol que permite más acciones; no hay denegaciones individuales que contradigan un acceso grupal. Si una persona es lectora directa y editora mediante un grupo, sigue siendo editora. Retirar un acceso directo puede dejar vigente el acceso heredado: la interfaz debe explicarlo. La API devuelve los permisos efectivos; el frontend no reconstruye la política a partir de los nombres de rol.

En el modelo básico, todos los integrantes ven los proyectos propiedad de su grupo. Si se incorporan proyectos restringidos, sus títulos, resultados de búsqueda, contadores y actividad también deben respetar esa restricción. Copiar un enlace no concede acceso. Proponer acceso mediante invitaciones autenticadas para la primera versión; los enlaces públicos requieren una decisión posterior explícita.

Ocultar acciones que no corresponden al rol. Deshabilitar acciones temporalmente imposibles —por ejemplo, Guardar durante un envío— y explicar el motivo cuando no sea evidente. Mostrar “Solo lectura” en contextos de consulta. Mientras los permisos están cargando, no presentar botones de edición. La autorización real debe verificarse en el servidor para cada solicitud; la interfaz adapta la experiencia. [Referencia: OWASP, autorización](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

**La gestión de tareas debe ser ligera.** Incluir título, responsable opcional, fecha opcional, descripción, recursos vinculados y estados Pendiente, En curso y Completada. Empezar por una lista. Un tablero puede añadirse usando los mismos datos cuando sea útil. Mantener la asociación entre tarea y recurso: “Revisar contrato” y “Practicar segunda voz” usan el mismo componente con contenido diferente.

**La apariencia debe facilitar lectura y exploración.** Proponer fondos neutros, superficies claras, tipografía sans serif, un color de acento y bordes discretos. Dar más espacio al contenido que a indicadores decorativos. Usar color junto con texto o iconos para estados y permisos.

| Elemento | Guideline visual |
| --- | --- |
| Barra lateral | Aproximadamente 240 px en escritorio; contraíble. |
| Barra superior | Aproximadamente 64 px; búsqueda y cuenta siempre identificables. |
| Espaciado | Escala coherente de 4, 8, 12, 16, 24 y 32 px. |
| Tipografía | Texto principal de 16 px; metadatos de 14 px; jerarquía clara de títulos. |
| Acciones | Un botón principal por contexto; acciones secundarias agrupadas. |
| Detalle de recurso | Visor amplio y metadatos/comentarios en panel complementario. |
| Móvil | Menú lateral en panel desplegable; detalle a ancho completo; tarjetas o filas simplificadas. |
| Listados largos | Paginación y carga diferida de miniaturas; conservar filtros al volver del detalle. |

Garantizar navegación por teclado, etiquetas en formularios, foco visible, nombres accesibles en botones con iconos y mensajes de error junto al campo. Arrastrar y soltar siempre debe tener alternativa mediante botón. En diálogos, mover el foco al abrir, mantenerlo dentro, permitir cerrar con Escape y devolverlo al control de origen. [Referencia: W3C, diálogos modales](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Tomar WCAG 2.2 AA como objetivo; para el texto, verificar contraste mínimo de 4,5:1 y 3:1 para texto grande. Revisar también zoom, reflujo y controles accesibles: elegir una paleta no demuestra por sí solo conformidad. [Referencia: W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

**La estructura de React debe seguir las funciones del producto.** Usar TypeScript con comprobación estricta, componentes de presentación pequeños y módulos por funcionalidad. Mantener el acceso HTTP fuera de los componentes visuales.

| Ubicación propuesta | Responsabilidad |
| --- | --- |
| `src/app/` | Inicio de aplicación, proveedores, rutas y estructura de navegación. |
| `src/features/auth/` | Sesión y aceptación de invitaciones. |
| `src/features/projects/` | Catálogo, detalle y ajustes de proyectos. |
| `src/features/groups/` | Página del grupo e integrantes. |
| `src/features/resources/` | Explorador, subida, previsualizadores y versiones. |
| `src/features/tasks/` | Tareas y relación con recursos. |
| `src/features/conversations/` | Hilos y comentarios. |
| `src/features/access/` | Ventana Compartir y presentación de permisos. |
| `src/shared/ui/` | Botones, formularios, diálogos, tablas y estados comunes. |
| `src/shared/api/` | Cliente HTTP, configuración y errores comunes. |

Cada funcionalidad puede contener sus páginas, componentes, hooks, tipos y funciones de API. Evitar una carpeta global con todos los componentes de negocio. Componentes reutilizables prioritarios: AppShell, ProjectCard, GroupCard, ResourceList, ResourcePreview, UploadQueue, ShareDialog, MemberList, RoleBadge, EmptyState y ErrorState.

Recomendar React Router para rutas y estructuras anidadas. Rutas de interfaz orientativas: `/projects`, `/groups`, `/groups/:groupId`, `/projects/:projectId/resources` y `/projects/:projectId/resources/:resourceId`. No son propuestas de endpoints REST. [Referencia: React Router, routing](https://reactrouter.com/start/declarative/routing).

Recomendar TanStack Query para datos remotos, caché, estados de consulta y actualización tras mutaciones. Incluir en las claves el contexto, identificador y filtros que cambien el resultado. Invalidar las listas y detalles afectados al guardar. Limpiar datos asociados a una cuenta al cerrar sesión o cambiar de usuario. [Referencia: TanStack Query, overview](https://tanstack.com/query/latest/docs/framework/react/overview).

Separar estado remoto, estado de URL y estado local de interfaz. Guardar filtros y orden en la URL cuando deban sobrevivir a recargas o compartirse. Usar estado local para un diálogo abierto, selección o borrador. Evitar duplicar los mismos objetos en varios estados; almacenar un identificador seleccionado y derivar el objeto actual cuando sea posible. [Referencia: React, estructura del estado](https://react.dev/learn/choosing-the-state-structure).

No persistir proyectos, permisos o archivos privados en almacenamiento del navegador como sustituto del servidor. Las preferencias visuales sí pueden ser locales. Un borrador debe estar claramente marcado como no guardado. Integrar la sesión mediante el mecanismo acordado con el backend, sin inventar una segunda autenticación. Renderizar las capacidades recibidas, por ejemplo `canEdit`, `canUpload` y `canManageAccess`, en lugar de repetir comparaciones de roles en cada pantalla.

**El contrato REST debe acordarse antes de conectar las pantallas.** Solicitar los datos necesarios para presentar los flujos, manteniendo las decisiones de persistencia y autorización en el backend.

| Área | Información que necesita el frontend |
| --- | --- |
| Identidad y acceso | Usuario de sesión, propietario, miembros, invitaciones, permisos efectivos y origen de los accesos. |
| Catálogos | Identificadores estables, filtros, orden, paginación y contadores autorizados. |
| Recursos | Tipo, metadatos, estado de carga, representación para vista previa y mecanismo autorizado de descarga. |
| Subidas | Formatos y tamaños admitidos, transporte, estados y comportamiento ante interrupción o reintento. |
| Versiones y edición | Historial y revisión actual; mecanismo para detectar una actualización concurrente. |
| Colaboración | Relación de tareas, conversaciones y recursos; eventos de actividad disponibles. |
| Fallos | Formato estable de errores, validación por campo, sesión expirada, acceso denegado y conflictos. |

Desarrollar primero con respuestas simuladas que respeten ese contrato, incluidos diferentes permisos y fallos. La sustitución por la API real debe afectar a los adaptadores, conservando los componentes. TypeScript describe lo esperado; no valida automáticamente el JSON recibido en ejecución.

La interfaz debe distinguir los siguientes estados y mantener el contexto del usuario:

| Estado | Respuesta de interfaz |
| --- | --- |
| Carga inicial | Esqueleto de la vista sin acciones que requieran permisos aún desconocidos. |
| Proyecto o grupo vacío | Explicación y siguiente acción permitida: añadir contenido o esperar una invitación. |
| Búsqueda sin coincidencias | Conservar búsqueda y ofrecer limpiar filtros. |
| Error de red o servidor | Mensaje concreto, reintento y conservación de cambios pendientes. |
| Sesión expirada | Solicitar inicio de sesión y recuperar el destino sin exponer datos de otra sesión. |
| Acceso retirado | Retirar contenido y acciones afectados cuando se detecte; volver a un destino permitido. |
| Recurso inexistente o no accesible | Mensaje acorde con el contrato, sin revelar detalles adicionales. |
| Archivo demasiado grande o formato rechazado | Explicar el límite o formato admitido junto al archivo afectado. |
| Validación fallida | Errores en los campos correspondientes y conservación del formulario. |
| Edición concurrente | Avisar del conflicto y ofrecer revisar la versión vigente preservando el borrador. |

Mapear estos estados a los códigos acordados; habitualmente 401, 403, 404, 413, 422 y errores 5xx, con 409 o 412 si el contrato contempla conflictos. No convertir todos los fallos en “Algo salió mal”. Desactivar envíos repetidos durante una mutación. No reintentar automáticamente operaciones de creación cuya duplicación no esté resuelta por el contrato.

Para sincronización inicial, actualizar datos tras mutaciones y al volver a una vista; usar consulta periódica solo donde aporte valor. La colaboración en tiempo real requerirá un mecanismo explícito. Si existe edición concurrente, el frontend debe enviar la revisión acordada y tratar los conflictos reportados. El reintento o la caché no sustituyen ese control.

**La primera versión debe cerrar recorridos completos.** Implementar en este orden: navegación y estados simulados; proyectos y grupos; repositorio de recursos; miembros y permisos; notas, tareas y conversaciones; integración REST y validación de los recorridos. Introducir los escenarios de lector/editor desde los primeros componentes aunque la ventana de administración llegue después.

El MVP incluye acceso e invitaciones, proyectos personales y grupales, página del grupo, compartir con personas y grupos, recursos con metadatos, búsqueda básica, vista previa compatible, notas, comentarios, tareas simples y feedback de las operaciones. Incluir historial de versiones y detección de conflictos según el soporte acordado con el backend; declararlos pendientes si todavía no existen. Posponer edición simultánea, chat en tiempo real, Gantt, automatizaciones, editores especializados y enlaces públicos.

**Los criterios de aceptación deben comprobar la experiencia final.** Validar estos recorridos con datos simulados y repetirlos sobre la API real cuando esté disponible:

1. Crear un proyecto personal, añadir una nota y subir un PDF; tras recargar, el contenido confirmado sigue disponible.
2. Crear un grupo, incorporar integrantes y mostrar varios proyectos en su página sin repetir invitaciones por proyecto.
3. Compartir un proyecto personal con un grupo: aparece en ambos catálogos con el mismo identificador y contenido.
4. Invitar a una persona a un solo proyecto: puede abrirlo sin obtener acceso a otros proyectos del grupo.
5. Abrir el proyecto como lector y como editor: cambian las acciones disponibles y el servidor confirma las operaciones autorizadas.
6. Retirar un acceso directo que también tiene origen grupal: la interfaz explica que el acceso heredado continúa.
7. Añadir una versión, cuando el contrato lo soporte: permanece el enlace del recurso y puede consultarse el historial.
8. Interrumpir una subida o provocar una validación: se conserva el contexto y se puede corregir o reintentar sin fingir que se guardó.
9. Abrir una URL directa, volver del detalle y usar móvil y teclado: funcionan navegación, filtros y diálogos.
10. Simular una revocación o un conflicto de edición: la interfaz reacciona al estado actual del servidor y conserva un borrador recuperable cuando corresponda.

Aplicar los mismos recorridos a dos ejemplos: un equipo con diagramas, apuntes y entregables; una banda con partituras, instrucciones y tareas de ensayo. Las pantallas y permisos deben servir a ambos cambiando únicamente el contenido.
