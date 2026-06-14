# Prode Mundial 2026 🏆

App web mobile-first para crear **ligas privadas de prode** del Mundial 2026 con amigos, curso, club u oficina. Sin registro, sin email — solo un nombre y un PIN.

**Estado actual:** App funcional, deploy lista. Supabase creado con schema.sql ejecutado. Repositorio GitHub listo para importar en Vercel.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Estilos | CSS custom (dark theme, mobile-first) |
| Backend / BBDD | Supabase (PostgreSQL + RLS) |
| Fixture real | football-data.org API v4 (proxy Vite dev + serverless Vercel) |
| Goleadores | BeSoccer API |
| Persistencia offline | localStorage (fallback automático sin Supabase) |
| Deploy | Vercel (SPA + serverless functions) |

---

## Features implementadas (v1)

### Gestión de ligas
- Crear liga con nombre de competencia + nombre/apodo del organizador
- PIN de 4 dígitos generado automáticamente al crear
- Unirse a liga con link + PIN
- Sesión guardada en localStorage vinculada al ID de liga
- Botón "Salir de la liga" (auto-eliminación)
- Enlace de invitación copiable

### Prode
- Pronóstico de fase de grupos (HOME / DRAW / AWAY)
- Partidos ya jugados bloqueados, muestra resultado real con feedback visual (verde = acierto, rojo = error)
- Partidos en vivo con indicador animado
- Cache de fixture (TTL adaptativo según rate limits de API)

### Predicción Final
- 4 preguntas: Campeón (10pts), Subcampeón (6pts), 3° puesto (4pts), 4° puesto (2pts)
- Se bloquean automáticamente cuando arranca el primer partido del Mundial
- Validación de selecciones duplicadas

### Ranking
- Tabla con subtotales: Prodes, Aciertos, Pts Grupo, Pts Final, Total
- Ordenado por puntos totales, desempate por aciertos
- Fila destacada para el usuario actual

### Panel de Administración
- Identificación por ser el creador de la liga
- Verificación con PIN desde cualquier dispositivo (persistente en localStorage)
- Agregar participantes manualmente
- Eliminar participantes con confirmación
- Vista expandible de pronósticos por usuario (partidos finalizados)
- Estadísticas: participantes, pronósticos totales, invitados

### Logo y branding
- Logo SVG de la Copa del Mundo (fondo transparente, solo trofeo)
- Favicon configurado
- Instrucciones interactivas al primer ingreso (dismissible con localStorage)

---

## Features pendientes (v2)

- [ ] **Predicción de clasificados por grupo**: al terminar la fase de grupos, cada usuario predice los 2 clasificados de cada grupo. Puntos por acierto.
- [ ] **Eliminatorias dinámicas**: con los clasificados de cada usuario, generar los cruces de octavos y habilitar pronósticos ronda por ronda (octavos → cuartos → semis → final).
- [ ] **Cálculo de puntos de Predicción Final**: cuando termine el torneo, cotejar las predicciones finales con los resultados reales y asignar puntos.
- [ ] **Broadcast en tiempo real** (WebSockets / polling más agresivo en vivo).
- [ ] **Modo oscuro / claro**.
- [ ] **Estadísticas por usuario** (racha de aciertos, efectividad por jornada).

---

## Estructura del proyecto

```
mundial-2026/
├── api/
│   └── football-data/
│       └── matches.js          # Serverless function Vercel (proxy a football-data.org)
├── public/
│   └── assets/
│       └── copa-mundial.png    # Logo PNG (favicon)
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Header sticky con logo, tabs, admin PIN, badge usuario
│   │   ├── LeagueSetup.jsx     # Pantallas de crear/unirse a liga
│   │   ├── Prode.jsx           # Prode grupos + predicción final + banner instructivo
│   │   ├── ProdeCard.jsx       # Tarjeta de partido con botones HOME/DRAW/AWAY
│   │   ├── Fixture.jsx         # Calendario con filtros (Hoy, Grupos, Eliminatorias)
│   │   ├── MatchCard.jsx       # Tarjeta de partido informativa
│   │   ├── Ranking.jsx         # Tabla de posiciones con subtotales
│   │   ├── AdminPanel.jsx      # Panel de admin (CRUD participantes, ver pronósticos)
│   │   └── Logo.jsx            # SVG Copa del Mundo (componente React)
│   ├── lib/
│   │   ├── api.js              # fetchFixture, fetchTopScorers, computeGroupTables, getMatchOutcome, etc.
│   │   ├── db.js               # Persistencia Supabase + fallback localStorage
│   │   ├── ranking.js          # computeLeagueRanking, computeFinalPredictionPoints
│   │   └── session.js          # parseLeaguePath, slugify, session storage, admin session
│   ├── App.jsx                 # Orquestador: estado global, efectos, handlers
│   ├── main.jsx                # Entry point
│   └── index.css               # Todos los estilos (dark theme, ~1375 líneas)
├── supabase/
│   └── schema.sql              # DDL completo: leagues, users, predictions, matches, final_predictions
├── index.html                  # HTML entry + favicon
├── vite.config.js              # Proxy API + React plugin
├── vercel.json                 # Build config + SPA rewrites + serverless config
├── package.json
└── .env.example                # Variables de entorno requeridas
```

### Descripción de archivos clave

| Archivo | Rol |
|---|---|
| `src/App.jsx` | Orquestador principal. Maneja: parseo de URL, validación de liga, auto-login, fetch de fixture, estado global (matches, predictions, members, etc.), handlers (crear/unirse, predecir, admin). ~477 líneas. |
| `src/lib/api.js` | fetchFixture() con cache en localStorage y TTL adaptativo según rate limits. fetchTopScorers(). computeGroupTables(). getMatchOutcome(). getAllTeams(). Filter helpers. |
| `src/lib/db.js` | Capa de persistencia. Si `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configurados → usa Supabase. Si no → localStorage. Funciones: ensureLeague, joinLeague, loadLeagueState, savePrediction, saveFinalPrediction, removeMember, doesLeagueExist. |
| `src/lib/ranking.js` | computeLeagueRanking: puntos por acierto en grupos (3 pts c/u). computeFinalPredictionPoints: estructura para puntos de predicción final (0 pts hasta que termine el torneo). |
| `src/lib/session.js` | Session management: getSessionUser/setSessionUser/clearSessionUser para auto-login. Admin session: getAdminSession/setAdminSession/clearAdminSession. Helpers: slugify, generatePin, uniqueLeagueId, parseLeaguePath, buildLeagueLink. |
| `supabase/schema.sql` | DDL con 5 tablas, RLS habilitado, políticas públicas (read/insert/update) para anon key. |
| `vercel.json` | Build command: `npm run build`. Output: `dist`. SPA rewrite: `/liga/:path*` → `/index.html`. Serverless timeout: 10s. |

---

## Variables de entorno (.env)

```env
# Obligatorias solo si querés persistencia en Supabase (si no, funciona offline con localStorage)
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Opcional: fixture real (sin esto, la app no muestra partidos)
# En local: Vite lee FOOTBALL_API_KEY o VITE_FOOTBALL_API_KEY
# En Vercel: configurar FOOTBALL_API_KEY como variable de entorno (server-side)
FOOTBALL_API_KEY=your-football-data-api-key
```

> **Nota**: `FOOTBALL_API_KEY` se usa server-side (proxy Vite en dev, serverless function en Vercel). `VITE_SUPABASE_*` se exponen al cliente (son las anon keys de Supabase, seguras por RLS). El proxy de Vite y la serverless function aceptan tanto `FOOTBALL_API_KEY` como `VITE_FOOTBALL_API_KEY`.

---

## Cómo correr en local

```bash
# 1. Clonar
git clone https://github.com/tuusuario/mundial-2026-prode.git
cd mundial-2026-prode

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus keys (ver sección .env arriba)

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
# Abrir http://localhost:5173

# 5. Build de producción
npm run build
npm run preview   # Servir build localmente
```

> **Nota**: Sin Supabase configurado, la app funciona con localStorage (ideal para desarrollo rápido). Sin `FOOTBALL_API_KEY`, no se muestran partidos.

---

## Deploy en Vercel

1. Crear proyecto en Supabase, ejecutar `supabase/schema.sql` en SQL Editor.
2. Subir repo a GitHub.
3. Importar en Vercel (detecta Vite automáticamente).
4. Configurar environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `FOOTBALL_API_KEY`
5. Deploy.

---

## Arquitectura de datos

### Flujo de fixture
1. `App.jsx` monta → llama a `fetchFixture()` en `api.js`
2. `api.js` hace GET a `/api/football-data/matches` (proxy Vite o serverless Vercel)
3. El proxy agrega `X-Auth-Token` con `FOOTBALL_API_KEY`
4. football-data.org devuelve matches → se mapean a modelo interno → se cachean en localStorage (60s, extendido a 120s si quedan pocos requests)
5. Si la API falla → retorna array vacío (sin mock)

### Flujo de persistencia
1. `db.js` detecta si `VITE_SUPABASE_URL` está configurado
2. Si sí → `createClient()` de Supabase, operaciones normales con RLS público
3. Si no → localStorage con clave `mundial2026_{leagueId}` (misma estructura que Supabase)
4. El switch es transparente para el resto de la app

### Session vs Admin Session
- **Session user**: `localStorage.getItem('mundial2026_session_{leagueId}')` — auto-login al recargar
- **Admin session**: `localStorage.getItem('mundial2026_admin_{leagueId}')` — acceso admin desde cualquier dispositivo verificando PIN, permanente

### Schema Supabase
```sql
leagues:      id (text PK), slug, name, host_name, pin, created_at
users:        id (uuid PK), league_id (FK), name, slug, joined_at — UNIQUE(league_id, slug)
predictions:  id (uuid PK), league_id (FK), user_id (FK), match_id, outcome (CHECK), created_at — UNIQUE(user_id, match_id)
matches:      id (text PK), round, stage, group_name, home_team, away_team, home_score, away_score, utc_date, status, venue, broadcast
final_predictions: id (uuid PK), league_id (FK), user_id (FK), category (CHECK), team, created_at — UNIQUE(user_id, category)
```

RLS: políticas públicas (anyone can read/insert/update) porque la autenticación se maneja por slug + PIN, no por auth de Supabase.

---

## Para la próxima IA

### Estado actual del proyecto
App funcional, ya desplegada en Vercel. El core está completo:
- Supabase project creado + schema.sql ejecutado (tablas: leagues, users, predictions, matches, final_predictions)
- Creación/unión a ligas con PIN
- Prode de fase de grupos con puntuación en vivo
- Predicción final (campeón, subcampeón, 3°, 4°)
- Ranking con subtotales (Pts Grupo + Pts Final = Total)
- Admin con verificación PIN desde cualquier dispositivo
- Logo SVG, favicon, banner instructivo
- Responsive mobile-first, dark theme
- Deploy en Vercel con serverless function para football-data.org

### Decisiones de arquitectura

**Sin autenticación real**: La app no usa login. La identidad se maneja por slug en la URL + localStorage. El PIN de 4 dígitos de la liga es la única barrera de entrada. Esto es intencional para máxima simplicidad.

**Doble persistencia (Supabase + localStorage)**: El `db.js` detecta automáticamente si hay credenciales Supabase configuradas. Si no, usa localStorage. Esto permite desarrollo offline y deploy sin backend. La estructura de datos es idéntica en ambos casos.

**Proxy API (Vite + Vercel)**: La key de football-data.org nunca se expone al cliente. En desarrollo, Vite la inyecta via `server.proxy`. En producción, Vercel ejecuta `api/football-data/matches.js` como serverless function con la env var `FOOTBALL_API_KEY`.

**Admin por PIN**: El admin se identifica por ser `host_name` en la liga, pero desde cualquier dispositivo puede autenticarse ingresando el PIN de la liga. La verificación es permanente en localStorage (no expira).

**Sin Tailwind**: Los estilos son CSS custom puro (variables CSS, dark theme, mobile-first). No hay dependencia de Tailwind en `package.json`. Si se quiere migrar, hay ~1534 líneas de CSS en `index.css`.

### Lo que falta implementar (en orden de prioridad)

1. **Predicción de clasificados por grupo**: Al terminar la fase de grupos, cada usuario debe seleccionar los 2 equipos clasificados de cada uno de los 8 grupos. El sistema debe:
   - Detectar cuándo terminó la fase de grupos (todos los partidos `status === 'FINISHED'`)
   - Mostrar un selector con los 4 equipos de cada grupo, permitiendo elegir 2
   - Persistir en nueva tabla o expandiendo `final_predictions`
   - Puntuar: +X puntos por cada acierto

2. **Eliminatorias dinámicas**: El fixture de octavos en adelante depende de los clasificados. La solución propuesta:
   - Cada usuario tiene su propia "realidad alternativa" basada en sus predicciones de clasificados
   - Con los clasificados de cada usuario, generar los cruces de octavos según el cuadro oficial del Mundial 2026
   - Habilitar pronósticos para los partidos de esa ronda
   - Repetir para cuartos, semis, final (cada ronda se habilita cuando la anterior termina en la realidad)

3. **Cálculo de puntos de Predicción Final**: Cuando termine el torneo, comparar cada predicción (campeón, subcampeón, 3°, 4°) con los resultados reales y asignar los puntos correspondientes. Esto requiere que el admin (o un proceso) marque los resultados finales.

4. **Broadcast en tiempo real**: Actualmente el fixture se refresca cada 60s con `setInterval`. Para partidos en vivo, convendría reducir el intervalo a 15-20s o implementar WebSockets.

### Notas técnicas importantes

- La app solo muestra partidos de fase de grupos en el prode (`m.stage === 'Grupos'`). Los partidos de eliminatorias existen en la data pero están filtrados.
- `finalLocked` se calcula con `matches.some(m => m.status === 'LIVE' || m.status === 'FINISHED')`. Las predicciones finales se bloquean cuando arranca el Mundial.
- El componente `ProdeCard.jsx` usa `isMatchStarted()` para deshabilitar los botones de pronóstico cuando el partido ya comenzó.
- El ranking usa `useMemo` con `computeLeagueRanking()` que recorre todos los partidos finalizados y calcula puntos (3 por acierto).
- `computeFinalPredictionPoints()` retorna `points: 0` hasta que el torneo termine. Cuando se implemente el marcado de resultados finales, esa función debe actualizarse.
- La guía interactiva (`guide-banner`) se guarda en `localStorage` con clave `mundial2026_guide_{leagueId}` para que no reaparezca.
- Si se agregan nuevas tablas a Supabase, deben tener políticas RLS públicas (usando `using (true)`) y agregarse al `loadLeagueState()` en `db.js`.
