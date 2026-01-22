# Organizador de Tareas

Aplicación web progresiva (PWA) para recordatorios diarios de pagos y tareas. Diseñada especialmente para móviles, permite gestionar recordatorios de servicios, pagos y otras tareas importantes con notificaciones opcionales.

## Características

- 📱 **PWA Instalable** - Descarga la app en tu teléfono desde el navegador
- 🔔 **Notificaciones Opcionales** - Activa o desactiva notificaciones por recordatorio
- 📅 **Recordatorios Diarios** - Notificaciones diarias, semanales o mensuales
- 🏷️ **Categorías Personalizables** - Organiza tus recordatorios por categorías (Pagos, Gimnasio, etc.)
- ✅ **Gestión de Tareas** - Marca como completadas y gestiona tus recordatorios
- 🔄 **Re-notificaciones** - Si no pagas/completas, te vuelve a notificar según la frecuencia configurada
- 📊 **Dashboard Intuitivo** - Vista clara de tus recordatorios pendientes y próximos vencimientos

## Tecnologías

- **Next.js 14** con App Router
- **TypeScript**
- **Prisma** (ORM)
- **NextAuth.js** (Autenticación)
- **Tailwind CSS** (Estilos)
- **PostgreSQL** (Base de datos)
- **Docker** (Contenerización)
- **PWA** (Progressive Web App)
- **Zod** (Validación de esquemas)

## 📱 Instalar la App en tu Celular (PWA)

La aplicación es una **Progressive Web App (PWA)** que puedes instalar directamente desde el navegador, sin necesidad de pasar por las tiendas de aplicaciones.

### 📲 Instalación en Android (Chrome/Edge)

1. **Abre la aplicación** en Chrome o Edge desde tu celular
   - Ve a la URL de producción (ej: `https://tu-dominio.com`)
2. **Espera el banner de instalación**
   - Deberías ver: "Agregar Organizador a la pantalla de inicio"
   - Si no aparece, ve al menú (⋮) → **"Agregar a la pantalla de inicio"** o **"Instalar app"**
3. **Toca "Agregar" o "Instalar"**
4. **¡Listo!** La app aparecerá como un ícono en tu pantalla de inicio
5. **Al abrirla**, funcionará como una app nativa (sin barra del navegador)

### 🍎 Instalación en iPhone/iPad (Safari)

1. **Abre la aplicación** en Safari desde tu iPhone/iPad
   - Ve a la URL de producción (ej: `https://tu-dominio.com`)
2. **Toca el botón de compartir** (□↑) en la parte inferior
3. **Selecciona "Agregar a pantalla de inicio"**
4. **Personaliza el nombre** (opcional) y toca "Agregar"
5. **¡Listo!** La app aparecerá como un ícono en tu pantalla de inicio
6. **Al abrirla**, funcionará como una app nativa (sin barra del navegador)

### ✅ Verificar que Funciona

Una vez instalada:
- ✅ La app aparece como ícono independiente
- ✅ Al abrirla, no se ve la barra de direcciones del navegador
- ✅ Funciona en modo "standalone" (como app nativa)
- ✅ Puede funcionar offline básico (gracias al Service Worker)

### ⚠️ Requisitos

- **HTTPS obligatorio**: La PWA solo funciona en sitios con HTTPS (requerido para producción)
- **Navegador compatible**: Chrome/Edge en Android, Safari en iOS
- **Service Worker activo**: Se registra automáticamente en producción

## Instalación (Desarrollo Local)

### Opción 1: Con Docker (Recomendado)

**Prerrequisitos**:
- Docker Engine 20.10+
- Docker Compose 2.0+

**Pasos**:

1. **Clonar el repositorio** (si aún no lo has hecho)

2. **Configurar variables de entorno**:
```bash
# Crear archivo .env
cat > .env << EOF
DATABASE_URL=postgresql://organizador:organizador_dev_password@postgres:5432/organizador_tareas?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF
```

3. **Construir y levantar los contenedores**:
```bash
docker compose up -d --build
```

4. **Inicializar la base de datos**:
```bash
# Las tablas se crean automáticamente al levantar los contenedores
# Si necesitas ejecutar migraciones:
docker compose exec app pnpm db:migrate
```

5. **Acceder a la aplicación**:
   - Aplicación: [http://localhost:3000](http://localhost:3000)
   - PostgreSQL: `localhost:5432` (usuario: `organizador`, password: `organizador_dev_password`)

**Comandos útiles**:
```bash
# Ver logs
docker compose logs -f app

# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (⚠️ elimina la base de datos)
docker compose down -v
```

### Opción 2: Sin Docker

**Prerrequisitos**:
- Node.js 20+
- PostgreSQL 15+

**Pasos**:

1. **Instalar pnpm** (si no lo tienes):
```bash
# Opción 1: Script oficial (recomendado si corepack da problemas)
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.zshrc  # o reinicia tu terminal

# Opción 2: Con npm
npm install -g pnpm

# Opción 3: Con corepack (puede dar problemas en algunas versiones)
corepack enable
corepack prepare pnpm@latest --activate
```

2. **Instalar dependencias**:
```bash
pnpm install
```

3. **Configurar variables de entorno**:
```bash
# Crear archivo .env
cat > .env << EOF
DATABASE_URL=postgresql://usuario:password@localhost:5432/organizador_tareas?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF
```

4. **Inicializar base de datos**:
```bash
pnpm db:generate
pnpm db:push
```

5. **Ejecutar en desarrollo**:
```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
organizador-tareas/
├── app/                    # App Router de Next.js
│   ├── api/               # API routes
│   │   ├── auth/         # Autenticación
│   │   ├── recordatorios/ # CRUD de recordatorios
│   │   └── categorias/   # CRUD de categorías
│   ├── dashboard/        # Dashboard principal
│   ├── login/            # Página de login
│   ├── register/         # Página de registro
│   └── layout.tsx        # Layout principal
├── components/            # Componentes React
│   ├── RecordatorioCard.tsx
│   ├── CategoriaCard.tsx
│   ├── CrearRecordatorioDialog.tsx
│   └── CrearCategoriaDialog.tsx
├── lib/                   # Utilidades
│   ├── prisma.ts
│   └── auth.ts
├── prisma/                # Schema de Prisma
│   └── schema.prisma
└── types/                 # TypeScript types
```

## Uso

### Crear una Categoría

1. Ve al dashboard
2. Haz clic en "Nueva Categoría"
3. Elige un nombre, icono y color
4. Guarda

### Crear un Recordatorio

1. Haz clic en "Nuevo Recordatorio"
2. Completa:
   - Título (obligatorio)
   - Descripción (opcional)
   - Fecha de vencimiento (obligatorio)
   - Categoría (opcional)
   - Frecuencia de recordatorio (Diario, Semanal, Mensual)
   - Activar/desactivar notificaciones
3. Guarda

### Gestionar Recordatorios

- **Marcar como completado**: Haz clic en el checkbox
- **Activar/desactivar notificaciones**: Usa el checkbox de notificaciones
- **Eliminar**: Haz clic en el ícono de eliminar (🗑️)

## Sistema de Notificaciones

Las notificaciones son **opcionales** y se pueden activar/desactivar por recordatorio.

### Frecuencias Disponibles

- **Diario**: Te notifica todos los días hasta que completes el recordatorio
- **Semanal**: Te notifica una vez por semana
- **Mensual**: Te notifica una vez al mes

### Re-notificaciones

Si no completas un recordatorio después de su fecha de vencimiento, el sistema te volverá a notificar según la frecuencia configurada hasta que lo marques como completado.

## Próximos Pasos

- [ ] Implementar notificaciones push reales (usando Web Push API)
- [ ] Agregar más opciones de frecuencia (cada X días)
- [ ] Implementar recordatorios recurrentes (mensuales automáticos)
- [ ] Agregar exportación de recordatorios
- [ ] Implementar búsqueda y filtros avanzados
- [ ] Agregar estadísticas y reportes

## Despliegue a Producción

La aplicación está lista para desplegarse usando servicios gratuitos:

- **Vercel** (Recomendado): Plan gratuito para hosting + **Neon** para PostgreSQL
- **Railway.app**: Plan gratuito con $5 de crédito mensual
- **Render.com**: Plan gratuito (con limitaciones)

### Base de Datos: Neon (Recomendado)

**Neon** es una base de datos PostgreSQL serverless perfecta para Next.js y Vercel:

- ✅ **Plan gratuito generoso**: 0.5 GB de almacenamiento, suficiente para empezar
- ✅ **Serverless**: Se escala automáticamente
- ✅ **Conexión rápida**: Optimizado para aplicaciones serverless
- ✅ **Fácil integración**: Compatible con Prisma y Next.js
- ✅ **Backups automáticos**: Incluidos en el plan gratuito

**Pasos para configurar Neon:**

1. **Crear cuenta en Neon**: Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita
2. **Crear proyecto**: Crea un nuevo proyecto PostgreSQL
3. **Obtener connection string**: Copia la connection string desde el dashboard de Neon
4. **Configurar en Vercel**: Agrega `DATABASE_URL` en las variables de entorno de Vercel

**Ver datos en Neon:**
- Accede al dashboard de Neon → SQL Editor
- O usa `psql` con la connection string proporcionada
- O usa Prisma Studio: `pnpm db:studio` (localmente con la connection string de Neon)

### Variables de Entorno Necesarias

```env
DATABASE_URL=postgresql://... (Connection string de Neon)
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-seguro
NODE_ENV=production
```

## 🔧 Configuración de Git (Email Personal)

Si estás en una PC del trabajo y quieres usar un email personal para este proyecto:

```bash
# Configurar email personal solo para este proyecto
git config --local user.email "tu-email-personal@ejemplo.com"
git config --local user.name "Tu Nombre"

# Verificar la configuración
git config --local --list

# Ver solo el email configurado
git config --local user.email
```

**Nota**: Esta configuración solo afecta a este repositorio. Tu configuración global de Git (para otros proyectos) no se modifica.

Si aún no has inicializado el repositorio Git:
```bash
git init
git config --local user.email "tu-email-personal@ejemplo.com"
git config --local user.name "Tu Nombre"
```

## Licencia

MIT

---

© 2024. Todos los derechos reservados.
# multitask
