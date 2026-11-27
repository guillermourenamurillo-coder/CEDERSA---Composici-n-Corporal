# CEDERSA | Composición Corporal

Plataforma web profesional para el registro, análisis, interpretación y seguimiento longitudinal de evaluaciones de composición corporal mediante bioimpedancia eléctrica (BIA), principalmente equipos **InBody**.

Desarrollada para el **Centro de Estudios para el Desarrollo del Rendimiento Físico y la Salud (CEDERSA)** — Universidad Nacional, CIEMHCAVI.

## Orientación

Académica · Clínica · Deportiva · Investigativa · Preventiva · Educativa.

> **Aviso importante:** Esta aplicación **no es una herramienta de diagnóstico médico**. Los resultados de bioimpedancia son estimaciones dependientes del dispositivo, la ecuación utilizada, el estado de hidratación y las condiciones de medición.

## Principio fundamental

La aplicación diferencia claramente tres tipos de variables:

- **A. Medidas directamente por el dispositivo** (peso, R, Xc, Z, ángulo de fase, impedancia segmentaria).
- **B. Calculadas mediante ecuaciones transparentes** (IMC, índice de resistencia, TBW, FFM, FM, % grasa, FFMI, FMI, SMI). Cada cálculo muestra fórmula, referencia científica, población validada, unidad y fecha.
- **C. Proporcionadas por InBody mediante algoritmos propietarios** (masa muscular esquelética, grasa visceral, análisis segmentario). Se identifican explícitamente como _Resultado proporcionado por el dispositivo InBody_ y no se reconstruyen ni infieren.

## Stack tecnológico

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Estilos:** Tailwind CSS 4 + shadcn/ui
- **Base de datos:** PostgreSQL con Prisma ORM (compatible con Neon, Supabase, Vercel Postgres y cualquier proveedor PostgreSQL)
- **Gráficos:** Recharts
- **Autenticación:** NextAuth.js v4 con roles
- **PDF:** jsPDF + autotable
- **Validación de fórmulas:** mathjs (evaluación segura, sin `eval()`)

## Roles de usuario

| Rol | Permisos |
|---|---|
| **ADMIN** | Control completo, gestión de usuarios, auditoría |
| **EVALUADOR** | Registrar personas y evaluaciones |
| **INVESTIGADOR** | Acceso a datos anonimizados y análisis |
| **USUARIO** | Consultar únicamente sus propios resultados |

## Módulos

1. **Dashboard administrativo CEDERSA** — métricas de uso, distribuciones por sexo/edad/población
2. **Participantes** — ficha individual con consentimiento informado
3. **Nueva Evaluación** — wizard de 7 pasos con checklist pre-medición e importación InBody
4. **Evolución** — análisis longitudinal con gráficos interactivos (Δ kg, Δ %)
5. **Ecuaciones BIA** — biblioteca con 9 ecuaciones validadas (Sun, Kyle, Kushner, Deurenberg, Roubenoff, Segal, Lukaski, Heitmann)
6. **Dispositivos** — registro de fabricante, modelo, tipo BIA, frecuencias, calibración
7. **Investigación** — exportación anonimizada CSV/XLSX con filtros poblacionales
8. **Reportes** — PDF institucional con encabezado CEDERSA/CIEMHCAVI/Universidad Nacional
9. **Ajustes** — gestión de usuarios y bitácora de auditoría

## Instalación

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de PostgreSQL y NEXTAUTH_SECRET
# Ejemplo: postgresql://user:pass@host:5432/cedersa?sslmode=require

# 3. Crear el esquema de la base de datos
bun run db:push

# 4. Sembrar usuarios y ecuaciones (idempotente, seguro de reejecutar)
bun run scripts/seed.ts

# 5. Iniciar el servidor de desarrollo
bun run dev
```

## Deployment en Vercel

1. Importa el repositorio en https://vercel.com/new
2. Vercel detecta automáticamente Next.js y `vercel.json`
3. **Variables de entorno** (Settings → Environment Variables):
   - `DATABASE_URL` → tu URL de PostgreSQL (recomendado: Neon o Supabase)
   - `NEXTAUTH_SECRET` → genera con `openssl rand -base64 32`
   - `NEXTAUTH_URL` → `https://tu-dominio.vercel.app`
4. **Build Command:** `bun run build` (ejecuta `prisma db push` + seed idempotente + `next build`)
5. **Install Command:** `bun install --frozen-lockfile` (el `postinstall` ejecuta `prisma generate` automáticamente)
6. Deploy

El seed se ejecuta automáticamente durante el build **solo si la tabla `User` está vacía**, así que el primer deploy siembra los datos demo y los siguientes no los sobrescribe.

## Credenciales sembradas (demo)

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | admin@cedersa.ac.cr | Admin123! |
| EVALUADOR | evaluador@cedersa.ac.cr | Eval123! |
| INVESTIGADOR | investigador@cedersa.ac.cr | Inv123! |
| USUARIO | usuario@cedersa.ac.cr | User123! |

> **Producción:** Cambiar todas las contraseñas y `NEXTAUTH_SECRET` inmediatamente.

## Ecuaciones incluidas

| Año | Autores | Salida | Población |
|---|---|---|---|
| 2003 | Sun et al. | TBW | Adultos 18-94 |
| 2001 | Kyle et al. | FFM | Adultos 20-94 |
| 1995 | Roubenoff et al. | TBW | Adultos mayores 70+ |
| 1991 | Deurenberg et al. | FFM | Adultos 18-80 |
| 1990 | Heitmann | FFM | Adultos daneses 35-65 |
| 1987 | Lukaski & Bolonchuk | FFM | Hombres atletas 18-35 |
| 1986 | Kushner & Schoeller | TBW | Niños/adultos |
| 1985 | Segal et al. | FFM | Adultos stratificados BMI |

Cada ecuación almacena: nombre, autores, año, referencia, DOI, población validada, rango de edad, sexo, dispositivo/tecnología, frecuencia, variables requeridas, fórmula, unidades, SEE, R², limitaciones y estado de validación.

## Modelo conceptual de cálculo

```
Impedancia → Resistencia/Reactancia → Índice de resistencia (H²/R)
          → Estimación de agua corporal (TBW)
          → Masa libre de grasa (FFM)
          → Masa grasa (FM = Peso − FFM)
          → % grasa = (FM / Peso) × 100
```

Cuando se utiliza el supuesto clásico de hidratación (FFM = TBW / 0.73), la aplicación muestra la nota metodológica:

> _La estimación supone una hidratación aproximada del 73% de la masa libre de grasa. Este supuesto puede variar según edad, sexo, estado fisiológico, hidratación, entrenamiento, enfermedad y otras características individuales._

## Trazabilidad

Cada evaluación registra: usuario evaluador, fecha/hora, dispositivo, datos originales, ecuación utilizada, versión de la ecuación, software, y modificaciones. Los datos originales nunca se sobrescriben; las correcciones generan una nueva versión.

## Licencia

Proyecto académico desarrollado para CEDERSA — Universidad Nacional, CIEMHCAVI. Todos los derechos reservados.

## Citas recomendadas

Cuando utilice esta plataforma en investigación, cite las ecuaciones originales correspondientes (DOIs incluidos en la biblioteca de ecuaciones de la aplicación).
