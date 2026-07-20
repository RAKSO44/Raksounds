// @ts-check
/**
 * Genera el banco cromático de piano (C4–C6) a partir de las muestras reales
 * del Salamander Grand Piano (Yamaha C5), que vienen muestreadas cada 3
 * semitonos (C, D#, F#, A por octava).
 *
 *     node scripts/build-piano-samples.mjs
 *
 * Entrada:  assets/audio/piano/*.mp3          (muestras originales, CC BY)
 * Salida:   assets/audio/piano-chromatic/*.mp3 (25 archivos, un semitono cada uno)
 *
 * Por qué se generan aquí y no en tiempo real:
 * transponer en el dispositivo (`setPlaybackRate`) no se aplica desde la muestra
 * 0 — ExoPlayer propaga el rate de forma asíncrona —, así que las notas
 * intermedias arrancaban con la altura de la muestra cruda y se "corregían" a
 * mitad del ataque. Haciendo el resampleo offline el motor siempre reproduce a
 * rate 1 y ese bug desaparece por construcción.
 *
 * Cada nota se resamplea como máximo ±1 semitono desde su muestra más cercana,
 * que es la práctica normal de un sampler: a esa distancia el formante apenas se
 * desplaza y el resultado es indistinguible de una grabación real.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets/audio/piano');
const OUT_DIR = join(ROOT, 'assets/audio/piano-chromatic');

/** Alturas MIDI que existen como grabación real dentro (o al borde) del rango. */
const SOURCE_MIDI = [60, 63, 66, 69, 72, 75, 78, 81, 84];

/** Rango que la Librería puede producir: tónica en C4–B4 + 12 semitonos + C6. */
const FIRST_MIDI = 60;
const LAST_MIDI = 84;

const SAMPLE_RATE = 44100;

/**
 * Ganancia global en dB. Las muestras originales pican entre -8 y -12 dBFS
 * (media ~-36 dB), que en un móvil se oye muy bajo. +7 dB deja la más fuerte
 * (C4, -8.0 dBFS) justo por debajo de 0. Es una ganancia ÚNICA para todas: si
 * se normalizara archivo por archivo se aplanaría la curva natural de volumen
 * del piano, donde los agudos suenan menos que los graves.
 */
const GAIN_DB = 7;

/**
 * Las muestras originales duran 6–16 s, mucho más de lo que la app usa: una
 * nota se corta a 1.5 s si es un toque y se libera en 0.7 s al soltar. 4 s dan
 * margen de sobra para notas mantenidas y recortan el bundle a un tercio.
 */
const DURATION_S = 4;
const TAIL_FADE_S = 0.25;

const NOTE_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];

/** Nombre de archivo estilo Salamander/Tone.js: C4, Cs4, Ds5… (C4 = MIDI 60). */
function fileNameFor(midi) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/**
 * Muestra de origen para una altura: la más cercana en semitonos. Con fuentes
 * cada 3 semitonos la distancia máxima es 1 y nunca hay empate.
 */
function nearestSource(midi) {
  return SOURCE_MIDI.reduce((best, candidate) =>
    Math.abs(candidate - midi) < Math.abs(best - midi) ? candidate : best,
  );
}

function ffmpegPath() {
  // Preferimos un ffmpeg del sistema; si no, el binario de ffmpeg-static.
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    const pkg = join(ROOT, 'node_modules/ffmpeg-static/package.json');
    try {
      readFileSync(pkg);
      return join(ROOT, 'node_modules/ffmpeg-static/ffmpeg.exe');
    } catch {
      throw new Error(
        'No se encontró ffmpeg. Instálalo en el PATH o ejecuta:\n' +
          '  npm install --no-save ffmpeg-static',
      );
    }
  }
}

const ffmpeg = process.env.FFMPEG_PATH ?? ffmpegPath();
mkdirSync(OUT_DIR, { recursive: true });

for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi += 1) {
  const source = nearestSource(midi);
  const semitones = midi - source;
  // Resampleo puro: subir el "sample rate" declarado en 2^(n/12) desplaza la
  // altura n semitonos (y la duración, imperceptible a ±1). Luego se vuelve a
  // 44.1 kHz para que todos los archivos compartan formato.
  const ratio = Math.pow(2, semitones / 12);

  const filters = [
    `asetrate=${Math.round(SAMPLE_RATE * ratio)}`,
    `aresample=${SAMPLE_RATE}`,
    `volume=${GAIN_DB}dB`,
    `atrim=0:${DURATION_S}`,
    // Fundido final para que el recorte no produzca un click audible.
    `afade=t=out:st=${DURATION_S - TAIL_FADE_S}:d=${TAIL_FADE_S}`,
  ].join(',');

  const inFile = join(SRC_DIR, `${fileNameFor(source)}.mp3`);
  const outFile = join(OUT_DIR, `${fileNameFor(midi)}.mp3`);

  execFileSync(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inFile,
      '-af',
      filters,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '96k',
      outFile,
    ],
    { stdio: 'inherit' },
  );

  const shift = semitones === 0 ? 'exacta' : `${semitones > 0 ? '+' : ''}${semitones} st`;
  console.log(
    `${fileNameFor(midi).padEnd(4)} (MIDI ${midi})  ←  ${fileNameFor(source).padEnd(4)} [${shift}]`,
  );
}

console.log(`\n${LAST_MIDI - FIRST_MIDI + 1} muestras escritas en assets/audio/piano-chromatic/`);
