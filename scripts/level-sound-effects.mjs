// @ts-check
/**
 * Nivela los efectos de los ejercicios (acierto, error, ronda superada / no
 * superada) al volumen de las notas del piano.
 *
 *     node scripts/level-sound-effects.mjs
 *
 * Entrada y salida: assets/audio/effects/*.mp3 (se reescriben en su sitio).
 * Referencia:       assets/audio/piano-chromatic/*.mp3 (solo se miden).
 *
 * Por qué hace falta: los efectos vienen de Pixabay, cada uno masterizado a su
 * aire. Medidos en LUFS (sonoridad percibida, EBU R128) el error sonaba 10 dB
 * por encima del acierto, y los dos por encima de cualquier nota. El pico
 * (dBFS) no sirve para igualarlos: un golpe corto y uno sostenido con el mismo
 * pico se oyen muy distintos.
 *
 * Cómo: se mide la sonoridad de cada nota del banco en el tiempo que suena un
 * toque (1.5 s) y se toma la MEDIANA como objetivo; cada efecto recibe una
 * ganancia fija (sin compresión, para no cambiar su carácter) hasta quedar en
 * ese objetivo. Como en la app los efectos pasan por la misma ganancia de bus
 * que el piano (`MASTER_GAIN`), igual sonoridad en archivo = igual volumen
 * al oído.
 *
 * Es idempotente: un efecto que ya está a menos de `TOLERANCE_LU` del objetivo
 * no se vuelve a codificar (cada pasada por MP3 pierde un poco de calidad).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EFFECTS_DIR = join(ROOT, 'assets/audio/effects');
const PIANO_DIR = join(ROOT, 'assets/audio/piano-chromatic');

/** Lo que suena un toque de tecla (`MIN_SOUNDING_S` del sampler). */
const NOTE_WINDOW_S = 1.5;
/** Por debajo de esta diferencia no se oye: no vale la pena recodificar. */
const TOLERANCE_LU = 0.3;

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

/** Sonoridad integrada (LUFS) de un archivo, opcionalmente solo de sus primeros segundos. */
function loudness(file, seconds) {
  const filters = [seconds === undefined ? null : `atrim=0:${seconds}`, 'ebur128']
    .filter(Boolean)
    .join(',');
  const { stderr } = spawnSync(
    ffmpeg,
    ['-hide_banner', '-nostats', '-i', file, '-af', filters, '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  // El resumen final de ebur128 trae la línea "I: -18.2 LUFS"; las líneas
  // por bloque usan "I:" también, así que se toma la ÚLTIMA.
  const matches = [...stderr.matchAll(/^\s*I:\s+(-?[\d.]+) LUFS/gm)];
  const last = matches.at(-1);
  if (!last) throw new Error(`No se pudo medir la sonoridad de ${file}`);
  return Number(last[1]);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const mp3s = (dir) => readdirSync(dir).filter((name) => name.endsWith('.mp3'));

const target = median(mp3s(PIANO_DIR).map((name) => loudness(join(PIANO_DIR, name), NOTE_WINDOW_S)));
console.log(`Objetivo (mediana de las notas): ${target.toFixed(1)} LUFS\n`);

for (const name of mp3s(EFFECTS_DIR)) {
  const file = join(EFFECTS_DIR, name);
  const before = loudness(file);
  const gain = target - before;

  if (Math.abs(gain) < TOLERANCE_LU) {
    console.log(`${name.padEnd(12)} ${before.toFixed(1)} LUFS  (ya nivelado)`);
    continue;
  }

  const tmp = join(EFFECTS_DIR, `.${name}.tmp.mp3`);
  execFileSync(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      file,
      '-af',
      `volume=${gain.toFixed(2)}dB`,
      '-c:a',
      'libmp3lame',
      '-q:a',
      '2',
      tmp,
    ],
    { stdio: 'inherit' },
  );
  renameSync(tmp, file);

  console.log(
    `${name.padEnd(12)} ${before.toFixed(1)} → ${loudness(file).toFixed(1)} LUFS  ` +
      `(${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB)`,
  );
}
