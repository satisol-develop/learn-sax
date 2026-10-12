---
name: music-theory-sax
description: Dominio musical de learn-sax - escalas mayores con ortografía correcta, círculo de cuartas/quintas, cuatriadas (maj7 m7 7 m7b5 dim7), progresiones ii-V-I encadenadas por el ciclo, transposiciones de saxofón soprano/tenor (Si♭) y alto (Mi♭), y principios de improvisación. Usar cuando se añadan recursos o juegos nuevos de teoría/práctica musical, o al tocar lógica del módulo src/music/.
---

# Music Theory Sax

Base de conocimiento musical del proyecto learn-sax. Cualquier juego o recurso nuevo DEBE respetar estas reglas.

## Ortografía de notas (spelling)

- Una letra por grado (C D E F G A B). Nunca mezclar: Bb mayor es `Bb C D Eb F G A`, jamás `A#`.
- El core `src/music/core.ts` genera escalas/acordes con `accFromDelta`: la alteración se deriva de la distancia a la nota natural de esa letra (0-2 sostenidos, 10-11 bemoles).
- Grado disminuido de séptima: `Bbb` (dobble bemol) es correcto en °7.
- Tabla de tonalidades preferidas: lados planos con bemoles (Db Eb Ab Bb Gb), F# solo para el lado de quintas; en el círculo de cuartas la posición 6 se escribe Gb.

## Círculos

- Cuartas (ascendente P4 / descendente P5): `C F Bb Eb Ab Db Gb B E A D G` — el usado por defecto en el jazz y en la app.
- Quintas: `C G D A E B F# Db Ab Eb Bb F`.
- Funciones: `circleOf`, `nextInCycle`, `cycleFrom`, `circleIndex` en `src/music/core.ts`. Nunca reimplementar tablas inline (el backing track ya delega en `cycleFrom`).

## Escalas mayores

- Fórmula: T–T–S–T–T–T–S (pasos 0 2 4 5 7 9 11 semitonos).
- 7 grados; práctica por el círculo de cuartas es el ejercicio base de las clases.

## Cuatriadas (tetras)

- maj7: 1 3 5 7 · m7: 1 ♭3 5 ♭7 · 7: 1 3 5 ♭7 · m7♭5: 1 ♭3 ♭5 ♭7 · °7: 1 ♭3 ♭5 ♭♭7.
- Construcción: apilar terceras = letras `root, +2, +4, +6` índices en LETTERS.
- Símbolos: `Cmaj7`, `Dm7`, `G7`, `Bm7♭5`, `C°7` (sufijos en CHORD_SUFFIX).

## ii-V-I

- En tonalidad mayor: ii = m7 (grado 2), V = 7 (grado 5), I = maj7 (tónica).
- Raíces: usar la escala de la tonalidad (`majorScale(key)[1]` y `[4]`), NO transposición cromática — así B mayor da C# y F#, no Db.
- Cadencia por cuartas: cada I abre el próximo ii-V-I una cuarta más arriba: C → F → Bb…
- Ejercicio típico de clase: cadena completa por el ciclo con escalas, cuatriadas o solo raíces.

## Transposiciones de saxofón

- Soprano y tenor (Si♭): la escritura suena una 9ª menor por debajo → escrita = concierto + 14 semitonos.
- Alto (Mi♭): suena una 6ª menor por debajo → escrita = concierto + 9 semitonos.
- La app muestra por defecto tono de concurso; el badge secundario usa `toWritten(note, instrument)`.
- Las respuestas de los juegos se validan SIEMPRE en tono de concurso.

## Improvisación sobre ii-V-I (contenido pedagógico)

- Guías (3ª y 7ª) de cada acorde; resuelven por semitono hacia las guías del acorde siguiente.
- Arpegio de la cuatriada antes que la escala completa.
- Sobre I maj7: escala mayor (jónica) o lidia ♯11; sobre ii m7: dórica; sobre V7: mixolidia (alterada en contexts más avanzados — fuera del MVP).
- Frases cortas, silencios, y grabarse es el mejor método.

## Cómo añadir un recurso nuevo

1. Definir contenido teórico en `src/resources/registry.ts` (intro, bullets, tip en español).
2. Reutilizar un motor de juego existente (quiz, ordenación, cadena, play-along) o crear carpeta nueva en `src/games/` sobre `useSession` + `GameShell`.
3. Añadir tests en `src/music/core.test.ts` si el core necesita nuevas funciones teóricas.
4. Toda nota mostrada pasa por la ortografía del core; toda cadena por `cycleFrom`.
