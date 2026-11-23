// @ts-check
/**
 * Genera el banco cromático de piano (C4–C6) a partir de las muestras reales
 * del Salamander Grand Piano (Yamaha C5), que vienen muestreadas cada 3
 * semitonos (C, D#, F#, A por octava).
 *
 *     node scripts/build-piano-samples.mjs
 *
 * Entrada:  assets/audio/piano/*.mp3          (muestras originales, CC BY)
 * Salida:   assets/audio/piano-chromatic/*.flac (25 archivos, un semitono cada uno)
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
 *
 * Cada archivo EMPIEZA EN SU ATAQUE (ver `ATTACK_PRE_ROLL_S`): un nodo de audio
 * nuevo lee desde la muestra 0, así que todo lo que haya antes del martillo es
 * retraso puro respecto del metrónomo. Las grabaciones traen 10–15 ms de aire
 * y se recortan aquí, una vez, en vez de medirlo en el teléfono al arrancar.
 *
 * Por qué FLAC y no MP3: un MP3 no puede empezar en su primera muestra. El
 * codificador antepone ~1100 muestras de silencio por diseño del formato, y el
 * decodificador nativo de react-native-audio-api (dr_mp3) no lee la cabecera
 * de LAME que dice cuánto saltar: cada nota sonaba 25–50 ms tarde aunque el
 * original se hubiera recortado. FLAC es sin pérdida y sin ese retardo (se
 * decodifica exactamente lo que se escribió), pesa un tercio de un WAV y lo
 * decodifican miniaudio (nativo, más rápido que el MP3) y los navegadores.
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
 * Las muestras originales duran 6–16 s, más de lo que la app usa: un toque
 * suena 1.5 s y al soltar la nota cae en 0.7 s. Solo una nota MANTENIDA puede
 * llegar al final del archivo, y con 4 s se cortaba mientras el dedo seguía
 * puesto. 8 s cubren cualquier nota sostenida razonable (el piano ya se ha
 * apagado casi del todo para entonces) y el banco sigue siendo pequeño.
 */
const DURATION_S = 8;
/** Fundido final largo: a los 7 s la nota ya es casi silencio y debe extinguirse, no cortarse. */
const TAIL_FADE_S = 1;

/**
 * Lo que se conserva antes del ataque, con un fundido de entrada de ese mismo
 * largo: el arranque del golpe (sube en ~1 ms) queda entero y el archivo
 * empieza en silencio exacto, sin click. 2 ms está muy por debajo de lo que el
 * oído percibe como "a destiempo" (~10 ms).
 */
const ATTACK_PRE_ROLL_S = 0.002;
/** El ataque empieza donde la señal llega a esta fracción de su pico (−20 dB). */
const ATTACK_THRESHOLD = 0.1;
/** Tramo inicial donde se busca el ataque: cubre de sobra el aire y el pico del martillo. */
const ATTACK_SCAN_S = 0.5;

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

/**
 * Primera muestra (a 44.1 kHz, ya transpuesta) que se conserva: el ataque —el
 * primer punto donde cualquiera de los dos canales llega a `ATTACK_THRESHOLD`
 * del pico— menos `ATTACK_PRE_ROLL_S`. Se mide sobre la misma cadena de
 * filtros que el archivo final, así que el corte cae donde se midió.
 */
function attackStart(inFile, pitch) {
  const pcm = execFileSync(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      inFile,
      '-af',
      [...pitch, `atrim=0:${ATTACK_SCAN_S}`].join(','),
      '-ac',
      '2',
      '-f',
      'f32le',
      '-',
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const samples = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const firstLoud = samples.findIndex((sample) => Math.abs(sample) >= peak * ATTACK_THRESHOLD);
  if (peak === 0 || firstLoud < 0) throw new Error(`Sin ataque en ${inFile}`);
  // Intercalado estéreo: dos valores por instante.
  const onset = Math.floor(firstLoud / 2);
  return Math.max(0, onset - Math.round(ATTACK_PRE_ROLL_S * SAMPLE_RATE));
}

for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi += 1) {
  const source = nearestSource(midi);
  const semitones = midi - source;
  // Resampleo puro: subir el "sample rate" declarado en 2^(n/12) desplaza la
  // altura n semitonos (y la duración, imperceptible a ±1). Luego se vuelve a
  // 44.1 kHz para que todos los archivos compartan formato.
  const ratio = Math.pow(2, semitones / 12);
  const pitch = [
    `asetrate=${Math.round(SAMPLE_RATE * ratio)}`,
    `aresample=${SAMPLE_RATE}`,
    `volume=${GAIN_DB}dB`,
  ];

  const inFile = join(SRC_DIR, `${fileNameFor(source)}.mp3`);
  const outFile = join(OUT_DIR, `${fileNameFor(midi)}.flac`);
  const start = attackStart(inFile, pitch);

  const filters = [
    ...pitch,
    // El archivo arranca en su ataque: se descarta el aire previo.
    `atrim=start_sample=${start}`,
    'asetpts=PTS-STARTPTS',
    `afade=t=in:d=${ATTACK_PRE_ROLL_S}`,
    `atrim=0:${DURATION_S}`,
    // Fundido final para que el recorte no produzca un click audible.
    `afade=t=out:st=${DURATION_S - TAIL_FADE_S}:d=${TAIL_FADE_S}`,
  ].join(',');

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
      'flac',
      '-sample_fmt',
      's16',
      '-compression_level',
      '12',
      outFile,
    ],
    { stdio: 'inherit' },
  );

  const shift = semitones === 0 ? 'exacta' : `${semitones > 0 ? '+' : ''}${semitones} st`;
  const trimmed = ((start / SAMPLE_RATE) * 1000).toFixed(1);
  console.log(
    `${fileNameFor(midi).padEnd(4)} (MIDI ${midi})  ←  ${fileNameFor(source).padEnd(4)} [${shift}]  −${trimmed} ms de aire`,
  );
}

console.log(`\n${LAST_MIDI - FIRST_MIDI + 1} muestras escritas en assets/audio/piano-chromatic/`);
