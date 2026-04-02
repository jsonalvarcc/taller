# 📦 Proyecto: Inventario K-Lab

## Resumen Ejecutivo

**Inventario K-Lab** es un sistema de gestión de inventarios completo desarrollado para el laboratorio K-Lab. Permite administrar activos, categorías, plantillas de items, préstamos de equipmentos y piezas, reportar novedades (daños, pérdidas, cambios de estado), y gestionar usuarios con autenticación segura.

---

## 🛠️ Stack Tecnológico

### Lenguaje

| Tecnología     | Versión | Descripción                           |
| -------------- | ------- | ------------------------------------- |
| **TypeScript** | ^5      | Lenguaje principal de tipado estático |
| **JavaScript** | -       | Configuración (ESLint, PostCSS)       |

### Framework Principal

| Tecnología  | Versión | Descripción                       |
| ----------- | ------- | --------------------------------- |
| **Next.js** | 16.1.6  | Framework React con App Router    |
| **React**   | 19.2.3  | Biblioteca de interfaz de usuario |

### Base de Datos

| Tecnología     | Versión | Descripción                    |
| -------------- | ------- | ------------------------------ |
| **PostgreSQL** | -       | Base de datos relacional       |
| **Prisma**     | ^7.3.0  | ORM para gestión de datos      |
| **pg**         | ^8.17.2 | Driver PostgreSQL para Node.js |

### Autenticación

| Tecnología      | Versión        | Descripción                            |
| --------------- | -------------- | -------------------------------------- |
| **NextAuth.js** | ^5.0.0-beta.30 | Autenticación con credentials provider |
| **bcryptjs**    | ^3.0.3         | Hash de contraseñas                    |

### Estilos y UI

| Tecnología               | Versión  | Descripción                 |
| ------------------------ | -------- | --------------------------- |
| **Tailwind CSS**         | ^4       | Framework de utilidades CSS |
| **@tailwindcss/postcss** | ^4       | Integración PostCSS         |
| **lucide-react**         | ^0.563.0 | Iconos SVG                  |
| **next-themes**          | ^0.4.6   | Soporte tema oscuro/claro   |
| **react-hot-toast**      | ^2.6.0   | Notificaciones toast        |

### Utilidades

| Tecnología | Versión        | Descripción              |
| ---------- | -------------- | ------------------------ |
| **uuid**   | ^13.0.0        | Generación de IDs únicos |
| **Geist**  | (Google Fonts) | Familia tipográfica      |

### Desarrollo

| Tecnología     | Versión | Descripción       |
| -------------- | ------- | ----------------- |
| **ESLint**     | ^9      | Linting de código |
| **TypeScript** | ^5      | Tipado estático   |
| **Prisma**     | ^7.3.0  | ORM y migraciones |

---

## 🏗️ Arquitectura

El proyecto sigue una arquitectura **Clean Architecture / Domain-Driven Design (DDD)** con separación clara de responsabilidades:

```
src/
├── domain/                 # Capa de Dominio
│   ├── entities/          # Entidades del negocio
│   │   ├── User.ts
│   │   └── Inventario.ts  # Categoria, PlantillaItem, Item, Pieza, Novedad
│   └── repositories/      # Interfaces de repositorios
│       ├── IUserRepository.ts
│       └── IInventarioRepository.ts
│
├── application/            # Capa de Aplicación
│   └── use-cases/         # Casos de uso
│       ├── RegisterUser.ts
│       ├── GetAllUsers.ts
│       ├── UpdateUser.ts
│       └── DeleteUser.ts
│
├── infrastructure/        # Capa de Infraestructura
│   ├── auth/              # Configuración de NextAuth
│   ├── db/                # Cliente Prisma
│   ├── repositories/      # Implementaciones de repositorios
│   │   ├── PrismaUserRepository.ts
│   │   ├── PrismaItemRepository.ts
│   │   ├── PrismaPrestamoRepository.ts
│   │   └── ...otros repositorios
│   └── services/          # Servicios externos
│
└── components/            # Componentes React
    ├── Sidebar.tsx
    ├── LayoutContent.tsx
    └── ThemeProvider.tsx
```

### Capas de la Arquitectura

| Capa               | Responsabilidad                                      | Ejemplo                    |
| ------------------ | ---------------------------------------------------- | -------------------------- |
| **Domain**         | Entidades, reglas de negocio, interfaces             | `User`, `Item`, `Prestamo` |
| **Application**    | Casos de uso, lógica de aplicación                   | `RegisterUserUseCase`      |
| **Infrastructure** | Implementaciones, bases de datos, servicios externos | `PrismaUserRepository`     |
| **Presentation**   | UI, componentes, páginas                             | Next.js App Router         |

---

## 📊 Modelo de Datos (Schema Prisma)

### Entidades Principales

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│      User       │     │    Categoria     │     │ Plantilla  │
│─────────────────│     │──────────────────│     │    Item    │
│ id              │     │ id               │     │─────────────│
│ name            │     │ nombre           │     │ id          │
│ email (unique)  │     │ prefijo (unique) │     │ nombre      │
│ password        │     │ createdAt        │     │ fabricante  │
│ createdAt       │     └────────┬─────────┘     │ modelo      │
│ updatedAt       │              │               │ prefijo     │
└────────┬────────┘              │               │ categoriaId │
         │                       │               │ createdAt    │
         │                       └───────┬────────┘─────────────┘
         │                               │
         │                       ┌───────▼────────┐
         │                       │     Item        │
         │                       │─────────────────│
         │                       │ id              │
         └───────────────────────│ codigo (unique) │
                                 │ descripcion     │
                                 │ ubicacion       │
                                 │ estado          │
                                 │ plantillaId     │
                                 │ createdAt       │
                                 └────────┬────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                    ┌─────▼─────┐                   ┌─────▼─────┐
                    │   Pieza   │                   │  Novedad  │
                    │───────────│                   │───────────│
                    │ id        │                   │ id        │
                    │ nombre    │                   │ tipo      │
                    │ cantidad  │                   │ descripcion
                    │ estado    │                   │ fecha     │
                    │ itemId    │                   │ itemId    │
                    │ createdAt │                   │ userId    │
                    └───────────┘                   └───────────┘

                                          │
                                          ▼
                                  ┌───────────────┐
                                  │   Prestamo    │
                                  │───────────────│
                                  │ id            │
                                  │ tipoUsuario   │
                                  │ usuarioId     │
                                  │ fechaSalida   │
                                  │ fechaEntrega  │
                                  │ estado        │
                                  │ userIdSalida  │
                                  │ userIdEntrega │
                                  └───────┬───────┘
                                          │
                                          ▼
                                  ┌────────────────┐
                                  │ DetallePrestamo│
                                  │────────────────│
                                  │ prestamoId     │
                                  │ itemId / piezaId│
                                  │ cantidad       │
                                  │ devuelto       │
                                  │ fechaDevolucion│
                                  └────────────────┘
```

### Descripción de Modelos

| Modelo                                         | Descripción                                          |
| ---------------------------------------------- | ---------------------------------------------------- |
| **User**                                       | Usuarios del sistema (administradores)               |
| **Categoria**                                  | Categorías de items (ej: Electrónica, Mecánica)      |
| **PlantillaItem**                              | Plantilla base para crear items (fabricante, modelo) |
| **Item**                                       | Instancias concretas de items con código único       |
| **Pieza**                                      | Componentes/partes de un item                        |
| **Prestamo**                                   | Registro de préstamos a estudiantes/externos         |
| **DetallePrestamo**                            | Items o piezas específicas en un préstamo            |
| **Novedad**                                    | Reportes de daños, pérdidas, cambios de estado       |
| **ImagenPlantillaItem/ImagenItem/ImagenPieza** | Galería de imágenes                                  |

---

## 🌐 Rutas de API (Next.js App Router)

### Autenticación

| Método   | Ruta                      | Descripción          |
| -------- | ------------------------- | -------------------- |
| GET/POST | `/api/auth/[...nextauth]` | Handlers de NextAuth |

### Usuarios

| Método | Ruta              | Descripción               |
| ------ | ----------------- | ------------------------- |
| GET    | `/api/users`      | Listar todos los usuarios |
| POST   | `/api/users`      | Registrar nuevo usuario   |
| GET    | `/api/users/[id]` | Obtener usuario por ID    |
| PUT    | `/api/users/[id]` | Actualizar usuario        |
| DELETE | `/api/users/[id]` | Eliminar usuario          |

### Inventario

| Método         | Ruta                   | Descripción             |
| -------------- | ---------------------- | ----------------------- |
| GET/POST       | `/api/items`           | Listar/Crear items      |
| GET/PUT/DELETE | `/api/items/[id]`      | CRUD de item específico |
| GET/POST       | `/api/categorias`      | Listar/Crear categorías |
| GET/PUT/DELETE | `/api/categorias/[id]` | CRUD de categoría       |
| GET/POST       | `/api/plantillas`      | Listar/Crear plantillas |
| GET/PUT/DELETE | `/api/plantillas/[id]` | CRUD de plantilla       |
| GET/POST       | `/api/piezas`          | Listar/Crear piezas     |
| GET/PUT/DELETE | `/api/piezas/[id]`     | CRUD de pieza           |

### Préstamos

| Método   | Ruta                             | Descripción            |
| -------- | -------------------------------- | ---------------------- |
| GET/POST | `/api/prestamos`                 | Listar/Crear préstamos |
| POST     | `/api/prestamos/[id]/devolucion` | Registrar devolución   |

### Novedades

| Método   | Ruta             | Descripción            |
| -------- | ---------------- | ---------------------- |
| GET/POST | `/api/novedades` | Listar/Crear novedades |

### Servicios Externos

| Método | Ruta                         | Descripción              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/external-users/search` | Buscar usuarios externos |

---

## 📱 Páginas del Frontend

| Ruta               | Descripción                                     |
| ------------------ | ----------------------------------------------- |
| `/`                | Página principal (redirect a login o dashboard) |
| `/login`           | Página de inicio de sesión                      |
| `/register`        | Página de registro de usuarios                  |
| `/dashboard`       | Panel principal con estadísticas                |
| `/items`           | Gestión de inventario (CRUD items)              |
| `/categorias`      | Gestión de categorías                           |
| `/plantillas`      | Gestión de plantillas de items                  |
| `/prestamos`       | Gestión de préstamos                            |
| `/prestamos/nuevo` | Crear nuevo préstamo                            |
| `/historial`       | Historial de préstamos                          |
| `/reportar`        | Reportar novedades (daños, pérdidas)            |
| `/users`           | Gestión de usuarios (admin)                     |

---

## 🎨 Sistema de Diseño

### Tema

- **Modo claro/oscuro** soportado con `next-themes`
- **Colores personalizables** (5 acentos): Azul, Verde, Rosa, Naranja, Morado
- Variables CSS customizadas para colores
- Tailwind CSS v4 con configuración PostCSS

### Componentes UI

- Sidebar navigation colapsable
- Cards, tablas, formularios
- Notificaciones toast
- Iconos Lucide React

---

## 🔐 Autenticación

- **Proveedor**: Credentials (email + password)
- **Hash de contraseña**: bcryptjs (10 rounds)
- **Gestión de sesión**: NextAuth.js v5
- **Rutas protegidas**: Dashboard y páginas de gestión requieren sesión activa

---

## 📁 Estructura de Archivos Clave

```
inventariokl/
├── app/                          # Next.js App Router
│   ├── api/                      # Rutas API
│   │   ├── auth/[...nextauth]/
│   │   ├── users/
│   │   ├── items/
│   │   ├── categorias/
│   │   ├── plantillas/
│   │   ├── piezas/
│   │   ├── prestamos/
│   │   └── ...
│   ├── dashboard/
│   ├── items/
│   ├── login/
│   ├── register/
│   └── ...
│
├── src/
│   ├── domain/                   # Entidades e interfaces
│   ├── application/              # Casos de uso
│   ├── infrastructure/            # Implementaciones
│   └── components/               # Componentes React
│
├── prisma/
│   └── schema.prisma             # Schema de base de datos
│
├── package.json                  # Dependencias
├── tsconfig.json                 # Configuración TypeScript
├── tailwind.config.ts            # Configuración Tailwind
└── next.config.ts                # Configuración Next.js
```

---

## 🚀 Scripts Disponibles

| Comando         | Descripción                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción       |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint`  | Ejecutar ESLint                |

---

## 📝 Preguntas de Clarificación

Para completar o mejorar este análisis, necesito saber:

1. **¿Cuál es el entorno de producción?** (Vercel, servidor propio, Docker, etc.)

2. **¿Hay variables de entorno específicas?** ¿Puedes compartir el `.env` de ejemplo?

3. **¿El proyecto ya está en producción o es desarrollo activo?**

4. **¿Hay tests implementados?** No veo archivos de tests en la estructura.

5. **¿Se usa algún sistema de caché?** (Redis, etc.)

6. **¿Hay integraciones con servicios externos?** Veo `ExternalUserService.ts`.

7. **¿Cuál es la versión de Node.js requerida?**

8. **¿Necesitas documentación adicional sobre algún componente específico?**

9. **¿Hay plan de migraciones futuro?** (webhooks, microservicios, etc.)

10. **¿Quieres que genere documentación de la API en OpenAPI/Swagger?**

---

## ✅ Estado del Proyecto

- ✅ Autenticación implementada
- ✅ CRUD de usuarios, items, categorías, plantillas, piezas
- ✅ Sistema de préstamos con devolución
- ✅ Sistema de novedades/reportes
- ✅ Frontend completo con temática oscuro/claro
- ✅ API REST con Next.js
- ⚠️ Tests no visibles en el repositorio
- ⚠️ Documentación de API no visible
