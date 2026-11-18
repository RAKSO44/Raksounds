/**
 * Las etapas y módulos del roadmap (`docs/roadmap/roadmap.md`) tal como se
 * muestran en la ruta del Home. Solo los módulos con `lessonId` tienen
 * contenido (teoría y práctica); el resto aparecen en la ruta como
 * "próximamente", sin adelantar nada de su contenido educativo.
 */

/** Módulos con lección construida. */
export type ModuleId = 'notes' | 'pulse';

/** Un módulo con lección: teoría y práctica. */
export interface LessonModule {
  readonly id: ModuleId;
  /** Número visible ("Módulo 1"). */
  readonly number: number;
  readonly title: string;
}

/** Un módulo tal como aparece en la ruta, tenga lección o no. */
export interface PathModule {
  readonly number: number;
  readonly title: string;
  /** Los temas del módulo (el temario del roadmap), para su tarjeta. */
  readonly topics: readonly string[];
  /** La lección que abre, o `null` si aún es "próximamente". */
  readonly lessonId: ModuleId | null;
}

export interface Stage {
  readonly number: number;
  readonly title: string;
  readonly modules: readonly PathModule[];
}

export const LESSON_MODULES: readonly LessonModule[] = [
  { id: 'notes', number: 1, title: 'Las notas musicales' },
  { id: 'pulse', number: 2, title: 'Pulso y tempo' },
];

export const STAGES: readonly Stage[] = [
  {
    number: 1,
    title: 'Reconocimiento musical y ritmo',
    modules: [
      {
        number: 1,
        title: 'Las notas musicales',
        topics: [
          'Las siete notas musicales',
          'Orden ascendente y descendente',
          'Repetición de las notas',
          'Octavas',
        ],
        lessonId: 'notes',
      },
      {
        number: 2,
        title: 'Pulso y tempo',
        topics: ['Qué es el pulso musical', 'Qué es el tempo', 'BPM', 'Lento, moderado y rápido'],
        lessonId: 'pulse',
      },
      {
        number: 3,
        title: 'Figuras musicales',
        topics: [
          'Redonda, blanca y negra',
          'Corchea y semicorchea',
          'Relación entre las duraciones',
        ],
        lessonId: null,
      },
      {
        number: 4,
        title: 'Silencios y prolongaciones',
        topics: [
          'Silencios musicales',
          'Puntillo',
          'Ligadura',
          'Relación entre duración y silencio',
        ],
        lessonId: null,
      },
      {
        number: 5,
        title: 'Compases y métrica',
        topics: [
          'Qué es un compás',
          'Barras de compás',
          'Numerador y denominador',
          'Compases 2/4, 3/4 y 4/4',
        ],
        lessonId: null,
      },
      {
        number: 6,
        title: 'Lectura de charts rítmicos',
        topics: [
          'Representación de patrones rítmicos',
          'Agrupación de figuras',
          'Lectura de patrones básicos',
          'Relación entre notación y ejecución',
        ],
        lessonId: null,
      },
    ],
  },
  {
    number: 2,
    title: 'Comprensión de notas y distancias',
    modules: [
      {
        number: 7,
        title: 'Pentagrama y claves',
        topics: ['Líneas y espacios', 'Notas en el pentagrama', 'Clave de Sol', 'Clave de Fa'],
        lessonId: null,
      },
      {
        number: 8,
        title: 'Tonos y semitonos',
        topics: [
          'Qué es un tono',
          'Qué es un semitono',
          'Distancias entre notas',
          'Su lugar en el teclado',
        ],
        lessonId: null,
      },
      {
        number: 9,
        title: 'Alteraciones musicales',
        topics: ['Sostenido', 'Bemol', 'Becuadro', 'Cómo cambian la altura de una nota'],
        lessonId: null,
      },
      {
        number: 10,
        title: 'Intervalos',
        topics: [
          'Qué es un intervalo',
          'De la segunda a la octava',
          'Mayores, menores y justos',
          'Reconocerlos de oído',
        ],
        lessonId: null,
      },
    ],
  },
  {
    number: 3,
    title: 'Escalas y tonalidades',
    modules: [
      {
        number: 11,
        title: 'Escalas mayores',
        topics: [
          'Qué es una escala',
          'Fórmula de tonos y semitonos',
          'Construcción de Do mayor',
          'Otras escalas mayores',
        ],
        lessonId: null,
      },
      {
        number: 12,
        title: 'Grados de la escala',
        topics: [
          'Qué son los grados',
          'Grados I al VII',
          'La tónica',
          'Función básica de cada grado',
          'Introducción al solfeo relativo',
        ],
        lessonId: null,
      },
      {
        number: 13,
        title: 'Escalas menores',
        topics: [
          'Escala menor natural',
          'Escala menor armónica',
          'Escala menor melódica',
          'Relación entre mayores y menores',
        ],
        lessonId: null,
      },
      {
        number: 14,
        title: 'Tonalidades y armaduras',
        topics: [
          'Qué es una tonalidad',
          'Armaduras',
          'Tonalidades mayores y menores',
          'Tonalidades relativas',
          'Círculo de quintas',
        ],
        lessonId: null,
      },
    ],
  },
];

export function moduleById(id: string | undefined): LessonModule | undefined {
  return LESSON_MODULES.find((module) => module.id === id);
}
