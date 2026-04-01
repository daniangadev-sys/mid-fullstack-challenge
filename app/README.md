# Mid Fullstack Technical Test — Kanban Board

## Introducción y Enfoque del Proyecto

Este proyecto es el resultado de un desafío técnico de nivel Mid-Level. Aunque el requerimiento técnico se centraba en la funcionalidad básica, mi enfoque principal fue entregar un producto que refleje estándares profesionales en términos de arquitectura, seguridad y experiencia de usuario.

### Objetivos clave del desarrollo:

1. **Estética y UX Profesional**: Basado en mi experiencia previa desarrollando tableros estilo Kanban, implementé una interfaz pulida con TailwindCSS que prioriza la fluidez y la facilidad de uso, evitando estructuras visuales rudimentarias.
2. **Seguridad en la Capa de Datos**: Se utilizó Zod para la validación estricta de esquemas en todas las APIs. Esto asegura que la comunicación entre el cliente y el servidor sea robusta y que la base de datos esté protegida contra entradas malformadas.
3. **Eficiencia en la Ejecución**: El núcleo de la aplicación se desarrolló en un lapso de dos horas. Se dedicó tiempo adicional para el testing exhaustivo de tareas y la validación de seguridad de los inputs mediante Postman, garantizando que el entregable final no requiriera correcciones posteriores.

## Funcionalidades Extra y UX Diferenciada

Como un valor añadido al requerimiento original, decidí implementar una lógica de visualización basada en roles, ubicada en la parte inferior izquierda de la interfaz:

* **Gestión de Roles (Tech Lead vs. Jr)**: El sistema permite alternar la experiencia de usuario dependiendo del perfil. Esta funcionalidad simula cómo una aplicación real manejaría permisos o flujos de trabajo distintos: el perfil de Tech Lead tiene acceso a controles de gestión más profundos, mientras que el perfil de Jr se enfoca en la ejecución de tareas, optimizando la interfaz para evitar sobrecarga de información.

## Stack Tecnológico

La selección de herramientas se basó en la búsqueda de rendimiento, tipado fuerte y modernidad:

* **Framework**: Next.js 16 (App Router)
* **Runtime y Gestor de Paquetes**: Bun
* **Base de Datos**: SQLite (archivo local) a través de @libsql/client
* **ORM**: Drizzle ORM
* **Validación**: Zod
* **Estilos**: TailwindCSS

### Decisiones de Arquitectura

* **Drizzle sobre Prisma**: Se seleccionó Drizzle por su ligereza y mi experiencia previa con el mismo, permitiendo un manejo de la base de datos más cercano a SQL y facilitando la agilidad en la entrega.
* **Gestión de Esquema (ensureSchema)**: Para simplificar la ejecución local de la prueba, implementé una lógica de inicialización programática en `src/db/client.ts`. El método `ensureSchema()` se encarga de crear las tablas (IF NOT EXISTS) y aplicar cambios aditivos, eliminando la fricción de configurar sistemas de migración externos para el revisor.

## Metodología de Desarrollo con Inteligencia Artificial

Este proyecto integró un flujo de trabajo asistido por múltiples modelos de IA, actuando como arquitecto y supervisor del código generado:

1. **Diseño y Mockup**: Utilicé Gemini para la conceptualización inicial y la generación del mockup visual de la interfaz.
2. **Configuración de Entorno (Cursor)**: Cursor funcionó como tutor para la configuración de Bun, herramienta con la que no tenía experiencia previa extensiva, optimizando la gestión de dependencias y scripts. Además, Cursor me asistió en la generación del código para la configuración de Drizzle y el esquema de la base de datos (`src/db/client.ts` y `src/db/schema.ts`), facilitando la integración rápida y correcta del ORM con SQLite.
3. **Estructura y Productividad (Copilot)**: Se utilizó Copilot para la generación de estructuras repetitivas y la definición de la jerarquía de carpetas siguiendo el patrón de App Router.
4. **Lógica y Validación (DeepSeek)**: Me encargué de la programación lógica de las APIs y utilicé DeepSeek para resolver dudas técnicas específicas durante el proceso de codificación.
5. **Revisión de Calidad (Claude)**: Claude actuó como revisor final de código para verificar que no existiera sobreingeniería, asegurar limpieza y seguridad del software.

## Guía de Instalación Local

Para ejecutar el proyecto, es necesario tener instalado Bun.

### 1. Instalación de dependencias

Ejecutar desde la carpeta `app/`:

```bash
bun install
```

### 2. Configuración de la Base de Datos (Opcional)

Por defecto, la aplicación utiliza `file:./local.db`. Se puede modificar mediante variables de entorno si es necesario:

```bash
# Windows
set DATABASE_URL=file:./local.db

# Linux / macOS
export DATABASE_URL=file:./local.db
```

### 3. Inicialización y Seed

Este comando crea la base de datos, las tablas y carga datos iniciales de prueba:

```bash
bun run seed
```

### 4. Servidor de Desarrollo

Para iniciar la aplicación:

```bash
bun run dev
```

El proyecto estará disponible en `http://localhost:3000/board/1`.

## Scripts Disponibles

* `bun run dev`: Inicia el servidor de desarrollo de Next.js
* `bun run build`: Construye la aplicación para producción
* `bun run start`: Inicia la aplicación en modo producción
* `bun run seed`: Ejecuta el proceso de inicialización de la base de datos y carga de datos de ejemplo
* `bun run lint`: Ejecuta ESLint para validar el código

## Endpoints Disponibles

* **GET** `/api/boards` — Lista todos los boards
* **POST** `/api/boards` — Crea un board
* **GET** `/api/boards/:id` — Obtiene un board con sus columnas y tareas
* **DELETE** `/api/boards/:id` — Elimina un board
* **POST** `/api/columns` — Crea una columna
* **DELETE** `/api/columns/:id` — Elimina una columna
* **POST** `/api/tasks` — Crea una tarea
* **PATCH** `/api/tasks/:id` — Actualiza una tarea (mover entre columnas)
* **DELETE** `/api/tasks/:id` — Elimina una tarea

## Testing

Todos los endpoints fueron testeados exhaustivamente para validar:

* **HTTP status codes correctos**: 201 (creado), 400 (entrada inválida), 404 (no encontrado), 200 (éxito)
* **Validación de inputs con Zod**: Se rechaza toda entrada malformada o de tipo incorrecto
* **Respuestas JSON consistentes**: Cada endpoint devuelve estructura predecible con `error`, `issues` o datos
* **Seguridad**: Protección contra SQL injection mediante Drizzle ORM y validación estricta de parámetros

Herramientas utilizadas: Postman para validación manual de APIs.
