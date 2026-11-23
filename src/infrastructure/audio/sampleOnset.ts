/**
 * Dónde EMPIEZA a sonar una muestra decodificada, en muestras desde el inicio.
 *
 * Un MP3 no arranca en su primera muestra: el codificador antepone ~576
 * muestras de silencio, el decodificador suma ~529 y el marco "Info" de LAME
 * se decodifica como 1152 más si el decodificador no lo reconoce (el de
 * react-native-audio-api en nativo no lo hace; el del navegador, sí). Más el
 * aire que traiga la grabación. Son 25–50 ms según la plataforma: una nota
 * programada en el instante de un golpe sonaba claramente DESPUÉS del golpe.
 *
 * Se mide en la muestra ya decodificada (no se supone ningún número), así que
 * vale para cualquier archivo, formato o decodificador: es el primer punto
 * donde la señal alcanza `threshold` veces el pico de `samples`. El ataque
 * de un piano sube a su pico en pocos ms, así que el umbral exacto apenas
 * mueve el resultado; lo importante es quedar muy por encima del ruido.
 */
export function sampleOnset(samples: Float32Array, threshold: number): number {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return 0;
  const level = peak * threshold;
  return Math.max(
    0,
    samples.findIndex((sample) => Math.abs(sample) >= level),
  );
}
