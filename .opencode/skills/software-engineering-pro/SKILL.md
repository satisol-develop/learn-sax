---
name: software-engineering-pro
description: Estándares de ingeniería de software profesional del proyecto learn-sax - TypeScript estricto, arquitectura por capas, estrategia de tests, calidad de código, git, CI/CD y seguridad. Usar antes de escribir o revisar código del proyecto, y al añadir funcionalidad nueva.
---

# Software Engineering Pro

Estándares de calidad para learn-sax. Aplicar en toda escritura o revisión de código.

## Arquitectura por capas

```
src/music/     → dominio puro (sin React, sin DOM, sin Tone). Testeable con Vitest node.
src/audio/     → efectos de sonido (Tone.js). Depende de music/, nunca al revés.
src/progress/  → estado de usuario (Zustand + persist localStorage).
src/games/     → UI de juegos. Motor común en src/games/engine/.
src/pages/     → páginas (rutas); componen recursos + juegos.
src/resources/ → registro de datos de recursos (contenido teórico + metadatos).
```

Regla de dependencia: `music → audio → games/pages`. El dominio nunca importa de capas superiores.

## TypeScript estricto

- `strict: true`, sin `any` explícito; usar `unknown` + narrowing si hace falta.
- Sin `@ts-ignore`; corregir el tipo o modelar mejor.
- Tipos de dominio (NoteName, ChordQuality…) solo en `src/music/core.ts`; reexportar, no duplicar.
- `noUnusedLocals` activo: no dejar imports ni variables muertas.

## Tests (Vitest)

- Todo lo que viva en `src/music/` con lógica no trivial lleva test unitario (son puros: perfectos para TDD).
- Casos mínimos por función teórica: ortografía con bemoles/sostenidos, casos límite (Bbb, E#, giros de octava).
- Ejecutar `npm test` antes de dar por terminada cualquier tarea que toque el dominio.

## Calidad de código

- Funciones pequeñas con una responsabilidad; sin efectos ocultos en el dominio.
- Manejar todos los estados de UI reales: default, hover, focus-visible, disabled, loading, empty.
- Timer/efectos: siempre cleanup en `useEffect`; deps completas (react-hooks/exhaustive-deps sin suppress).
- Nunca `setState` síncrono directo en el cuerpo de un efecto (regla set-state-in-effect).
- Audio: toda reproducción pasa por `ensureAudio()` (gesto de usuario antes de `Tone.start`).
- Comentarios solo si el "por qué" no es obvio en el código.

## UI

- Seguir `ui-ux-design-system`: tokens OKLCH (`src/styles/tokens.css`), sin hex sueltos, un acento primario, colores semánticos solo para estado.
- Componentes reutilizables en `src/components/`; nada de div-soup one-off.
- Copy en español, conciso, tipo producto.

## Git

- Commits convencionales: `feat:`, `fix:`, `test:`, `chore:`, `refactor:` + ámbito opcional (`feat(jam):…`).
- Un concepto por commit; mensajes en inglés imperativo.
- Nunca commitear `dist/`, `node_modules/` ni claves.

## CI/CD (GitHub Pages)

- Gates obligatorios: `npm run lint`, `npm test`, `npm run build` antes de mergear.
- Workflow `.github/workflows/deploy.yml` despliega `dist/` en Pages con `base: './'` en Vite (rutas relativas).
- El build debe mantenerse estático: sin backend ni secrets en el cliente.

## Seguridad web

- Sin secrets ni tokens en el repo o el bundle.
- No innerHTML con datos de usuario; React escapa por defecto — no romper eso con `dangerouslySetInnerHTML`.
- Dependencias: revisar `npm audit` al añadir paquetes.

## Checklist antes de terminar tarea

1. `tsc --noEmit` sin errores.
2. `eslint src` sin errores.
3. `npm test` verde.
4. `vite build` verde.
5. Estados vacíos/error presentes en pantallas nuevas.
6. Responsive: mobile de una columna sin scroll horizontal.
