# Guía: vídeos de Learn Sax con HyperFrames

Cómo producir vídeos (tour de la app, "cómo funciona" de cada juego, clips para redes)
escribiendo **HTML/CSS/JS** y renderizándolos a MP4 con
[HyperFrames](https://github.com/heygen-com/hyperframes).

---

## 1. Qué es HyperFrames y por qué encaja aquí

HyperFrames es un framework open-source (Apache 2.0, de HeyGen) que convierte
**HTML + CSS + animaciones "seekables"** en un **MP4 determinista**. No hay editor de
línea de tiempo ni proyecto React obligatorio: defines la composición como una página
web con atributos de tiempo y el renderer la reproduce **frame a frame** en Chrome
headless y la codifica con FFmpeg.

Encaja bien con Learn Sax porque:

- La app **ya es web** (Vite + React). El material visual (colores, tipografía,
  pantallas) existe y se puede reconstruir o capturar.
- La app es **determinista y offline-first** (PWA). El mismo enfoque aplica al vídeo:
  mismo input → mismo MP4, ideal para regresión y CI.
- Es **agent-native**: el agente (OpenCode incluido) escribe el HTML y renderiza solo.

> Documentación oficial: <https://hyperframes.heygen.com/introduction> ·
> Repo: <https://github.com/heygen-com/hyperframes> ·
> Plantillas de diseño (frame.md): <https://www.hyperframes.dev/design>

---

## 2. Requisitos

| Requisito | Estado en este repo |
|---|---|
| **Node.js ≥ 22** | ✅ Node 24.18.0 |
| **FFmpeg** en el `PATH` | ⚠️ comprobar (`ffmpeg -version`) |

Instalar FFmpeg en Windows (elige una vía):

```powershell
winget install Gyan.FFmpeg
# o descarga el build "release essentials" de https://www.gyan.dev/ffmpeg/builds/
#   y añade la carpeta \bin al PATH
```

Verifica:

```powershell
node -v        # v22 o superior
ffmpeg -version
```

---

## 3. Dos rutas de trabajo

### Ruta A — con el agente (recomendada)

HyperFrames distribuye *skills* que enseñan al agente el bucle de producción
(planificar → escribir HTML válido → animar → añadir media → lint → preview → render).

```bash
# Instala las skills en este proyecto (compatible con OpenCode, Claude Code, Codex, Cursor…)
npx skills add heygen-com/hyperframes
```

Después **pídelo en lenguaje natural**:

```text
Usando /hyperframes, crea un vídeo de 20 s que presente Learn Sax:
título de entrada, tres pantallas (escalas, círculo de 4as/5as, cuatriadas)
y un cierre con la URL. Fondo oklch(0.14 0.01 260), azul primario oklch(0.72 0.16 265).
```

Mantén las skills al día con `npx hyperframes skills update` (instala el set *core*
desde `main`; más fiable que el registro de `skills add`, que puede ir con retraso).

Skills útiles para este proyecto: `/hyperframes` (router: léelo primero),
`/product-launch-video` (tour del sitio desde su URL),
`/faceless-explainer` (explicar un concepto sin captura),
`/motion-graphics` (clip design-led <10 s), `/pr-to-video` (un PR/commit → vídeo),
`/music-to-video` (clips a ritmo de la música), `/hyperframes-cli` (comandos).

### Ruta B — CLI manual

```bash
npx hyperframes init my-video     # crea el proyecto y las skills
cd my-video
npx hyperframes preview           # preview en el navegador con live reload
npx hyperframes render            # render a MP4
```

Comandos del día a día: `init`, `lint`, `check`, `snapshot`, `preview`, `render`,
`publish`, `doctor`, más render en la nube (`cloud render`) y en AWS Lambda.

---

## 4. Dónde poner el proyecto de vídeo (sin ensuciar la app)

Crea el proyecto **fuera de `src/`**, en una carpeta ignorada por git, para no mezclar
el bundle de la app con las composiciones:

```
learn-sax/
├─ src/            # la app
├─ public/         # PWA
├─ video/          # ← proyecto HyperFrames (añadir a .gitignore o versionarlo aparte)
└─ docs/
```

Si quieres versionar las composiciones (recomendado), **sí** commitéalas en `video/`,
pero mantén fuera los artefactos (`output.mp4`, `node_modules`, `.hyperframes/`).

---

## 5. Anatomía de una composición

El *contrato* de HyperFrames usa atributos `data-*` sobre el HTML. Elementos con
`class="clip"` se posicionan en **pistas** y se muestran en una **ventana de tiempo**:

```html
<div id="stage" data-composition-id="intro" data-start="0" data-width="1920" data-height="1080">
  <h1 id="title" class="clip" data-start="0.5" data-duration="3" data-track-index="1">
    Learn Sax
  </h1>
  <audio data-start="0" data-duration="8" data-track-index="2" data-volume="0.5" src="music.wav"></audio>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 40, duration: 0.8 }, 0.5);
    window.__timelines = window.__timelines || {};
    window.__timelines.intro = tl;   // el renderer busca aquí la animación seekable
  </script>
</div>
```

Reglas clave:

- **Animación "seekable", no de reloj**: expón la timeline en `window.__timelines[<id>]`
  y déjala `paused`; el renderer mueve el tiempo frame a frame. Evita `setTimeout`,
  `requestAnimationFrame` "puros" o vídeo con `autoplay` no controlado.
- **Tracks** evitan solapes de tiempo (`data-track-index`).
- Sin build step: el `index.html` **se reproduce tal cual** en el navegador.

---

## 6. Ejemplo con la identidad de Learn Sax

Tokens reales del tema oscuro (`src/styles/tokens.css`): fondo `oklch(0.14 0.01 260)`,
primario `oklch(0.72 0.16 265)`, texto `oklch(0.97 0.01 260)`, `theme-color #111318`.

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --bg: oklch(0.14 0.01 260);
      --bg-light: oklch(0.23 0.02 260);
      --text: oklch(0.97 0.01 260);
      --muted: oklch(0.74 0.02 260);
      --primary: oklch(0.72 0.16 265);
      --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    html, body { margin: 0; }
    #stage { font-family: var(--font-sans); color: var(--text);
             background: radial-gradient(120% 120% at 20% 0%, var(--bg-light), var(--bg)); }
    .panel { position: absolute; border: 1px solid oklch(0.31 0.02 260);
             border-radius: 20px; background: linear-gradient(180deg, var(--bg-light), var(--bg)); }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="learn-sax-intro"
       data-start="0" data-width="1920" data-height="1080">
    <div id="card" class="clip panel" data-start="0.4" data-duration="4" data-track-index="0"
         style="inset:0; margin:auto; width:760px; height:420px;"></div>
    <h1 id="title" class="clip" data-start="0.8" data-duration="3.5" data-track-index="1"
        style="position:absolute; left:120px; top:420px; font-size:96px; margin:0;">
      Learn Sax
    </h1>
    <p id="sub" class="clip" data-start="1.2" data-duration="3" data-track-index="1"
       style="position:absolute; left:124px; top:540px; font-size:34px; color:var(--muted); margin:0;">
      Escalas · círculo · cuatriadas · ii-V-I · blues
    </p>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#card", { scale: 0.92, opacity: 0, duration: 0.7, ease: 'power3.out' })
      .from("#title", { y: 50, opacity: 0, duration: 0.7 }, 0.9)
      .from("#sub", { y: 30, opacity: 0, duration: 0.6 }, 1.3);
    window.__timelines = { 'learn-sax-intro': tl };
  </script>
</body>
</html>
```

> **Fuentes**: la app carga Inter desde Google Fonts. Para un render determinista,
> **no dependas de la red**: empaqueta `Inter` (`.woff2`) dentro del proyecto de vídeo
> o pasa la fuente por `frame.md`.

---

## 7. Qué vídeos tiene sentido hacer para Learn Sax

| Idea | Skill | Fuente de entrada |
|---|---|---|
| Tour general de la app | `/product-launch-video` | URL live: `https://satisol-develop.github.io/learn-sax/` |
| "Cómo se juega" a cada juego (8 tarjetas) | `/faceless-explainer` o `/general-video` | guion propio + colores de la app |
| Clip corto vertical (redes) del Círculo de 4as/5as | `/motion-graphics` (9:16) | mapa del círculo animado |
| Explicador de **transposición** (alto/tenor) | `/faceless-explainer` | diagrama + tabla de intervalos |
| Vídeo del changelog de la última release | `/pr-to-video` | PR/commit con `gh` |
| "Rutina de hoy" a ritmo de música | `/music-to-video` | capturas + pista BGM |

Rutas reales de la app (HashRouter) que puedes usar como escenas o capturas:

```
#/                     Home (recordatorio + racha)
#/routine              Rutina diaria
#/resource/cuatriadas  Teoría de un recurso
#/game/chord-builder/grados-mayor
#/game/circle-orbit/contrarreloj
#/game/transpose-drill
#/game/blues-drill
#/progress             Progreso
```

**Limitación honesta**: un *site tour* captura la **URL**; la interacción profunda
(jugar una ronda completa, puntuaciones) no se "clica" sola. Para mostrar juego real,
opciones: (a) reconstruir la escena en la composición con los mismos tokens,
(b) grabar la pantalla aparte y usarla como `clip` de vídeo dentro de la composición,
o (c) `/talking-head-recut` si partes de una grabación.

---

## 8. Flujo de producción (bucle del agente)

1. **Plan / guion**: decide escenas, duración y locución ("storyboard" en el skill router).
2. **Composición**: escribe el `index.html` con el contrato `data-*`.
3. **Animación**: GSAP / CSS / Lottie / WAAPI / Three.js / Anime.js (seekable).
4. **Media**: música, voz, iconos e imágenes con `/media-use` (TTS, SFX, fondo, etc.).
5. **Lint / check**: `npx hyperframes lint` y `npx hyperframes check`.
6. **Preview**: `npx hyperframes preview` (live reload en el navegador).
7. **Itera**: "haz el título 2× más grande", "oscurece el fondo", "fade al final".
8. **Render**: `npx hyperframes render` → MP4.

> **Audio de la app**: el sonido de Learn Sax (Tone.js: escalas, cuatriadas, jam) es
> **interactivo** y necesita gesto del usuario. Para los vídeos, lo más simple es usar
> **BGM + TTS** vía `/media-use` en vez de instrumentar los sinths en la composición.

---

## 9. Render en CI (opcional, encaja con el deploy actual)

El repo ya despliega con GitHub Actions a `gh-pages`. Puedes añadir un workflow que
renderice el MP4 en cada tag/release. HyperFrames soporta render local (Docker con
FFmpeg/Chrome) y distribuido (AWS Lambda). Requisitos del runner: **FFmpeg + Chrome**.
Consulta el skill `/hyperframes-cli` y la [deploy doc](https://hyperframes.heygen.com/deploy/aws-lambda).

---

## 10. Checklist de calidad y determinismo

- [ ] Sin `Date.now()` ni `Math.random()` no sembrados en la composición.
- [ ] Animaciones **seekables** (timeline pausada expuesta en `window.__timelines`).
- [ ] Sin autoplay de vídeo/audio fuera de control del renderer.
- [ ] Fuentes e imágenes **locales** (no dependen de la red al renderizar).
- [ ] Una **pista** por capa para evitar solapes.
- [ ] Contraste y tamaño legibles a 1080p y en 9:16 si va a redes.

## 11. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ffmpeg` no encontrado | No está en `PATH` | Reinstala con winget y reabre la terminal |
| Render sale en blanco | Animación no seekable / JS error | Deja la timeline `paused` y expón `window.__timelines` |
| Movimiento "salta" o no acaba | Se usó reloj real (`setTimeout`) | Migra a GSAP/CSS/WAAPI seekable |
| Fuente distinta en el vídeo | Carga remota de Google Fonts | Empaqueta la fuente localmente |
| Texto cortado | Falta track o ventana de tiempo | Revisa `data-start`/`data-duration`/`data-track-index` |

---

## 12. Prompts listos para copiar

**Cold start** (desde cero):

```text
Usando /hyperframes, crea un tour de 30 s de la app Learn Sax.
Escenas: 1) portada con título y racha, 2) escalas mayores,
3) círculo de 4as/5as, 4) cuatriadas, 5) transposición, 6) cierre con la URL.
Estética: tema oscuro de la app (fondo oklch(0.14 0.01 260),
primario oklch(0.72 0.16 265), tipografía Inter). Añade BGM suave y subtítulos en español.
```

**Warm start** (desde una grabación o URL):

```text
Con /talking-head-recut, recorta esta grabación de pantalla de Learn Sax a 45 s,
añade rótulos de esquina con el nombre del juego y captions sincronizados.
```

---

## 13. Enlaces

- Docs: <https://hyperframes.heygen.com/introduction> · Quickstart: <https://hyperframes.heygen.com/quickstart>
- Repo: <https://github.com/heygen-com/hyperframes> · Catálogo: <https://hyperframes.heygen.com/catalog/blocks/data-chart>
- frame.md (diseño): <https://www.hyperframes.dev/design> · Playground: <https://www.hyperframes.dev/>
