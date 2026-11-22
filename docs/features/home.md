# Home — ruta de aprendizaje

**Módulo 1 (Las notas musicales)** y **Módulo 2 (Pulso y tempo)** de la
Etapa 1, y **Módulo 3 (Figuras musicales)** de la Etapa 2. Documento de
partida y decisiones en `docs/roadmap/etapa-1/` (las decisiones de
`modulos-1-2.md` prevalecen sobre la especificación) y
`docs/roadmap/etapa-2/modulo-3.md`.

- Las etapas y módulos de la ruta viven en `domain/lessons/stages.ts`. Arriba
  hay UNA sola tarjeta fija (`StageBanner`) con la etapa en curso; entre etapas,
  una línea con su título (`StageDivider`), y al llegar arriba la tarjeta cambia
  de texto y color (`useStageScroll`). Tocarla abre OTRA pantalla (ruta
  `/stages`, `StagesScreen`, con la transición normal) con la lista de etapas;
  la actual va seleccionada "transparente" (cara tenue + borde de su color,
  como un `selectable`). Elegir una vuelve atrás y el Home salta a esa etapa
  (`stageSelection.ts` hace de puente). Sin animación de expansión. La última
  etapa con la que se interactuó (elegirla en la lista o tocar uno de sus
  módulos; desplazarse no cuenta) se guarda en MMKV y la app abre en ella. Cada
  etapa tiene su color (`stageTone`: turquesa, azul, rosa y verde) en su
  tarjeta, nodos y botones. **Ningún color se repite entre etapas** (pedido
  del usuario): una etapa nueva necesita un tono nuevo. Nunca el morado de la
  cabecera ni el dorado del progreso; tampoco el naranja (se confunde con el
  dorado) ni el rojo (se lee como error).
- Cada módulo es un círculo con su título al lado (`ModuleRow`); al tocarlo, el
  mismo círculo se estira (ancho y alto, nunca escala) hasta una tarjeta con su
  temario y DOS botones: **Teoría** (libro) y **Ejercicios** (play). Abrir uno
  cierra el otro; tocar el temario lo devuelve a círculo.
- **NADA SE BLOQUEA**: se entra a cualquier módulo, teoría o práctica en
  cualquier orden. El progreso solo se indica: teoría leída → labio dorado;
  práctica completada (≥ 80 %: 12/15, 9/11, 14/17) → cara dorada; en la tarjeta, cada botón se
  vuelve dorado. El cambio se anima al volver al Home (color + un destello
  que cruza el nodo, `useStatusTransition`), nunca a escondidas.
- Teoría: una o más hojas (el Módulo 3 tiene 4) que se pasan con ← n → (el ✓ final la marca como
  leída); nada obliga a interactuar para avanzar. Los términos destacados
  (`RichText`) y los títulos de tabla abren una definición (`TooltipHost`):
  globo sin color (superficie + borde, como Duolingo) con UNA frase corta,
  del ancho que pide esa frase y centrado bajo el término.
- Práctica: ejercicios generados de una semilla, plantilla fija por módulo
  (Módulo 1: 15; Módulo 2: 11; Módulo 3: 17 — no hace falta llegar a 15 ni repetir un
  tipo de ejercicio que ya salió; `practiceLength`).
  Reglas en `domain/lessons/progress.ts`; guardado en
  `features/home/progressStore.ts`. En el resultado, si hubo fallos,
  "Reintentar fallos" (botón neutro) repite SOLO esas posiciones, regeneradas; lo
  recuperado se suma al intento ("+3", 12 → 15) y cuenta para completarlo
  (`recordRetry`: no suma un intento nuevo).
- Los ejercicios son DATOS (`domain/lessons/exercise.ts`): mecánicas `choice`,
  `clip-choice` (cada opción es un sonido), `tempo-choice` (cada opción es
  un pulso sin fin), `sequence` (ordenar tocando o arrastrando,
  `domain/lessons/sequenceBoard.ts`), `pick` (marcar los sonidos que van
  juntos), `tap` (4 toques libres sobre un pulso continuo, en golpes
  seguidos, `judgeTapsOnPulse` en `domain/lessons/tapSync.ts`) y
  `fill-bar` (llenar la barra rítmica, `judgeFilledBar`). Una opción o
  ficha puede ser una figura escrita (`notation`) en vez de texto. Los
  estímulos son `Clip`s; los hace sonar `useClipPlayer` (piano para notas,
  metrónomo para golpes, y notas de duración EXACTA para las figuras:
  `rhythm`, `IAudioPlayer.playTimed`).
- **El metrónomo de la práctica es `Metronome`** (`features/home/components/`),
  dibujado con `react-native-svg` como un objeto real pero limpio: pirámide
  de nogal con labio 3D, escala crema con una línea central tenue, brazo de
  acero que llega a un extremo con cada golpe y pesa de latón a la altura de
  su BPM (más arriba = más lento, `metronomeWeightPosition`; a media altura
  mientras el tempo es la pregunta). La placa dice solo el número o "?".
  Encendido/apagado es un fundido corto: apagado = madera atenuada; al cambiar de tempo el
  brazo sigue su vaivén sin saltos.
  Los pulsos de los ejercicios NUNCA se cortan solos: el usuario los enciende
  y apaga (`useMetronomes`, uno sonando a la vez); en "tocar con el pulso"
  arranca solo y no se apaga.
- **Toda tecla que suena en pantalla se puede pulsar junto a otras y suenan a
  la vez** (`playNote`: una nota suelta no corta nada). Toda nota visible
  suena al tocarla, salvo la que hay que adivinar hasta corregir.
- El metrónomo (`IMetronome`) programa cada golpe en el reloj de audio, nunca
  con `setTimeout`: así se puede calificar un toque contra el golpe real.
