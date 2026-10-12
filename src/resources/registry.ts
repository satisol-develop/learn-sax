import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  CircleDot,
  Disc3,
  Layers,
  Music2,
  Palette,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export interface ModeDef {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
}

export interface ResourceDef {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  theory: {
    intro: string;
    bullets: string[];
    tip: string;
  };
  gameId: string;
  gameName: string;
  hasModes: boolean;
  modes: ModeDef[];
  jam?: boolean;
}

export const RESOURCES: ResourceDef[] = [
  {
    id: 'escalas-mayores',
    title: 'Escalas mayores',
    subtitle: 'Las 7 notas, su ortografía y las 12 tonalidades',
    icon: Music2,
    theory: {
      intro:
        'La escala mayor es la base de todo el jazz: 7 notas con la fórmula T–T–S–T–T–T–S (tono y semitono). Cada grado se escribe con una letra distinta (una sola alteración por nota).',
      bullets: [
        'Grados: 1 2 3 4 5 6 7 — sin alteraciones en Do mayor.',
        'Ortografía correcta: Bb mayor es Bb C D Eb F G A (nunca A# en vez de Bb).',
        'Practícalas en tu saxofón: alto en Mi♭, soprano y tenor en Si♭ — la app te muestra el cifrado de concierto y tu clave escrita.',
        'Ejercicio de clase: escala por el círculo de cuartas, sin parar.',
      ],
      tip: 'Empieza lento con metrónomo y di las notas en voz alta mientras tocas.',
    },
    gameId: 'scale-sprint',
    gameName: 'Escala Relámpago',
    hasModes: true,
    modes: [
      {
        id: 'ordena',
        name: 'Ordena la escala',
        description: 'Coloca las 7 notas en orden ascendente.',
        difficulty: 1,
      },
      {
        id: 'menor',
        name: 'Ordena la escala menor',
        description: 'Las 7 notas de la escala menor natural, en orden.',
        difficulty: 2,
      },
      {
        id: 'siguiente',
        name: '¿Qué nota sigue?',
        description: 'Adivina el siguiente grado de la escala.',
        difficulty: 2,
      },
      {
        id: 'rapidez',
        name: 'Racha por el círculo',
        description: 'Escala siguiente en cuartas contra reloj.',
        difficulty: 3,
      },
    ],
  },
  {
    id: 'modos-escalas',
    title: 'Modos y escalas',
    subtitle: 'Los 7 modos, la pentatónica y el blues',
    icon: Palette,
    theory: {
      intro:
        'Un modo es la escala mayor empezada desde otro grado: las mismas notas con otro centro tonal. Cambiar la tónica cambia el color, y ese color es vocabulario puro de improvisación.',
      bullets: [
        'Jónico = mayor; Eólico = menor natural; los demás están entre medias.',
        'Dórico: menor con 6ª mayor (jazz modal, funk) — el sonido del ii.',
        'Mixolidio: mayor con ♭7 — el color del acorde dominante.',
        'Lidio: mayor con ♯4, flotante; ideal sobre maj7.',
        'Frigio: menor con ♭2 (color español); Locrio: ♭2 y ♭5.',
        'Pentatónica mayor y escala de blues para frasear sencillo y con groove.',
      ],
      tip: 'Toca el mismo lick en cada modo y escucha cómo cambia solo una nota.',
    },
    gameId: 'mode-drill',
    gameName: 'Colores',
    hasModes: true,
    modes: [
      {
        id: 'nombra',
        name: 'Nombra la escala',
        description: 'Reconoce el modo o tipo a partir de sus notas.',
        difficulty: 2,
      },
      {
        id: 'ordena',
        name: 'Ordena el modo',
        description: 'Coloca todas las notas en orden ascendente.',
        difficulty: 1,
      },
      {
        id: 'siguiente',
        name: '¿Qué nota sigue?',
        description: 'Adivina el grado siguiente del modo.',
        difficulty: 2,
      },
    ],
  },
  {
    id: 'circulo-cuartas-quintas',
    title: 'Círculo de 4as y 5as',
    subtitle: 'El mapa de todas las tonalidades',
    icon: RefreshCw,
    theory: {
      intro:
        'El círculo ordena las 12 tonalidades por cuartas justas ascendentes (lo más útil para el jazz) y su inverso, las quintas. Todo ii-V-i y toda progresión vive aquí.',
      bullets: [
        'Cuartas: C–F–Bb–Eb–Ab–Db–Gb–B–E–A–D–G (y vuelve a C).',
        'Quintas: la vuelta al revés: C–G–D–A–E–B–F#…',
        'Cada paso a la izquierda en el cifrado de cuartas = bajar una 5ª / subir una 4ª.',
        'Las canciones viajan por aquí: tras resolver en C, lo natural es ir a F.',
      ],
      tip: 'Canta las raíces del círculo mientras señalas la tonalidad en el sax.',
    },
    gameId: 'circle-orbit',
    gameName: 'Órbita',
    hasModes: true,
    modes: [
      { id: 'cuartas', name: 'Círculo de cuartas', description: 'Completa la rueda en 4as.', difficulty: 1 },
      { id: 'quintas', name: 'Círculo de quintas', description: 'La rueda en sentido contrario.', difficulty: 2 },
      { id: 'contrarreloj', name: 'Contrarreloj en 4as', description: '60s para encadenar claves en cuartas.', difficulty: 3 },
      { id: 'contrarreloj-quintas', name: 'Contrarreloj en 5as', description: '60s encadenando claves en quintas.', difficulty: 3 },
    ],
  },
  {
    id: 'cuatriadas',
    title: 'Cuatriadas',
    subtitle: 'Acordes de 4 notas: cualidades y grados en mayor y menor',
    icon: Layers,
    theory: {
      intro:
        'Las cuatriadas son acordes de cuatro notas construidos apilando terceras. Son el vocabulario del jazz: las verás escritas en todos los standards, y en cada tonalidad ocupan un grado concreto.',
      bullets: [
        'maj7: 1 3 5 7 — suave, estable (I de la tonalidad).',
        'm7: 1 ♭3 5 ♭7 — el ii del ii-V-I.',
        '7 (dominante): 1 3 5 ♭7 — tensión que resuelve.',
        'm7♭5 y °7: acordes de la familia disminuida, útiles en ii-V-I menor.',
        'Grados en mayor: I maj7 · ii m7 · iii m7 · IV maj7 · V 7 · vi m7 · vii m7♭5.',
        'Grados en menor natural: i m7 · ii m7♭5 · III maj7 · iv m7 · v m7 · VI maj7 · VII 7.',
        'Ortografía: una letra por grado (C E G B, no C E G A#).',
      ],
      tip: 'Arpegia cada cuatriada en los 12 tonos: es el puente entre escala y acorde.',
    },
    gameId: 'chord-builder',
    gameName: 'El Constructor',
    hasModes: true,
    modes: [
      { id: 'construye', name: 'Construye el acorde', description: 'Elige las 4 notas correctas.', difficulty: 1 },
      { id: 'simbolo', name: 'Nombra el acorde', description: 'De 4 notas al símbolo del acorde.', difficulty: 2 },
      { id: 'grados-mayor', name: 'Acordes en mayor', description: 'El acorde de cada grado en una tonalidad mayor.', difficulty: 2 },
      { id: 'grados-menor', name: 'Acordes en menor', description: 'Los grados de la escala menor natural.', difficulty: 3 },
      { id: 'calidad', name: 'Calidad por oído', description: 'Escucha y nombra el tipo de cuatriada.', difficulty: 3 },
    ],
  },
  {
    id: 'transposicion',
    title: 'Transposición',
    subtitle: 'Del cifrado de concierto a la tonalidad escrita de tu sax',
    icon: ArrowLeftRight,
    theory: {
      intro:
        'Tu saxo no lee la misma altura que suena: el alto está en Mi♭ y los Si♭ (soprano y tenor), en Si♭. Para tocar con otros hay que traducir constantemente entre lo que se escribe (tu clave) y lo que suena (concierto).',
      bullets: [
        'Soprano y tenor (Si♭): lo escrito suena una 2ª mayor abajo — Do de concierto se escribe Re.',
        'Alto (Mi♭): lo escrito suena una 6ª mayor abajo — Do de concierto se escribe La.',
        'Truco: sube la misma distancia al leer y bájala al escuchar la banda.',
        'Las tonalidades se transportan igual que las notas: si la banda toca en Do, el alto lee en La.',
      ],
      tip: 'Escribe la escala mayor de concierto y, debajo, su versión escrita en tu saxo. Se interioriza rápido.',
    },
    gameId: 'transpose-drill',
    gameName: 'El Transpositor',
    hasModes: true,
    modes: [
      {
        id: 'escrita',
        name: 'Nota escrita',
        description: 'De la nota de concierto a la nota que escribes.',
        difficulty: 1,
      },
      {
        id: 'concierto',
        name: 'Nota de concierto',
        description: 'De la nota escrita a la altura de concierto.',
        difficulty: 2,
      },
      {
        id: 'tonalidad',
        name: 'Tonalidad escrita',
        description: 'Transporta la tonalidad completa de un standard.',
        difficulty: 3,
      },
    ],
  },
  {
    id: 'ii-v-i-circulo',
    title: 'ii-V-I en círculo',
    subtitle: 'La progresión reina del jazz, encadenada',
    icon: CircleDot,
    theory: {
      intro:
        'El ii-V-I es la célula del jazz: ii menor de 7ª → V dominante → I mayor de 7ª. Practicado por el círculo de cuartas, cada I se convierte en la puerta del siguiente ii-V-I.',
      bullets: [
        'En Do: Dm7 – G7 – Cmaj7 (grados 2–5–1).',
        'Cadena por cuartas: Dm7 G7 Cmaj7 → Gm7 C7 Fmaj7 → Cm7 F7 Bbmaj7…',
        'Cualidad fija en tonalidad mayor: ii = m7, V = 7, I = maj7.',
        'Toca solo raíces primero; después 3ª y 7ª (las guías); al final la cuatriada completa.',
      ],
      tip: 'Visualiza el ciclo mientras tocas: el centro del I actual es el ii del próximo.',
    },
    gameId: 'iivi-chain',
    gameName: 'La Cadena',
    hasModes: true,
    modes: [
      { id: 'cadena', name: 'La cadena', description: 'Predice el próximo ii-V-I del ciclo.', difficulty: 2 },
      { id: 'raices', name: 'Raíces del ciclo', description: 'Nombra las 3 raíces del próximo 2-5-1.', difficulty: 1 },
      { id: 'oido', name: 'ii-V-I por oído', description: 'Escucha y detecta la tonalidad.', difficulty: 3 },
    ],
  },
  {
    id: 'blues',
    title: 'Blues de 12 compases',
    subtitle: 'La forma que todo el jazz toca',
    icon: Disc3,
    theory: {
      intro:
        'El blues de 12 compases es la forma más tocada del jazz: tres acordes —I7, IV7 y V7— y una vuelta fija que todo el mundo conoce. Aprenderla de memoria es abrir la puerta a los standards.',
      bullets: [
        'Compases 1–4: I7 (a veces el compás 2 va al IV: «quick change»).',
        'Compases 5–6: IV7; compases 7–8: vuelta al I7.',
        'Compás 9: V7; 10: IV7; 11: I7; y 12: V7 de giro.',
        'Todo es dominante 7: el blues no usa maj7.',
        'Improvisa la escala de blues de la tonalidad sobre toda la forma.',
      ],
      tip: 'Cuenta la forma en voz alta: 1–4 I, 5–6 IV, 7–8 I, 9 V, 10 IV, 11 I, 12 V.',
    },
    gameId: 'blues-drill',
    gameName: 'Doce compases',
    hasModes: true,
    modes: [
      {
        id: 'compases',
        name: '¿Qué acorde suena?',
        description: 'El acorde de cada compás de la forma.',
        difficulty: 1,
      },
      {
        id: 'siguiente',
        name: 'Sigue la forma',
        description: 'Predice el acorde del compás siguiente.',
        difficulty: 2,
      },
      {
        id: 'oido',
        name: 'Blues por oído',
        description: 'Escucha la forma completa y detecta la tonalidad.',
        difficulty: 3,
      },
    ],
  },
  {
    id: 'impro-ii-v-i',
    title: 'Impro sobre ii-V-I',
    subtitle: 'Jam en vivo con backing track por el ciclo',
    icon: TrendingUp,
    theory: {
      intro:
        'Improvisar sobre ii-V-I es el corazón del jazz. Con el jam tocarás encima de un ritmo swing que recorre el ciclo de cuartas: cada clave dura unos compases y avanza sola.',
      bullets: [
        'Empieza con las guías: 3ª y 7ª de cada acorde (resuelven por semitono).',
        'Arpegio de la cuatriada antes que la escala completa.',
        'Sobre I mayor de 7ª puedes usar la escala mayor (jónica) o lidia ♯11.',
        'Frases cortas con silencio: deja que la progresión respire.',
        'Sube el BPM cuando domines; empieza en 70–90 BPM.',
      ],
      tip: 'Grábate: escuchar tu fraseo sobre el ciclo es el mejor profesor.',
    },
    gameId: 'jam-cycle',
    gameName: 'Jam del Ciclo',
    hasModes: false,
    modes: [],
    jam: true,
  },
];

export function getResource(id: string | undefined): ResourceDef | undefined {
  return RESOURCES.find((r) => r.id === id);
}
