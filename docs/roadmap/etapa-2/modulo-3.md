# Etapa 2 · Módulo 3 (Figuras musicales) — decisiones de implementación

Hecha a partir de bocetos del usuario (2026-11-20). Estas decisiones
prevalecen sobre `roadmap.md`. Por ahora solo existe la **teoría**; la
práctica no está diseñada y su botón muestra el aviso "Próximamente"
(`hasPractice` en `domain/lessons/practice.ts`).

## Figuras vectoriales como objetos (decisión de arquitectura)

Pedido explícito del usuario: las figuras NO son sprites, emojis ni
caracteres de una fuente musical. Son objetos propios con propiedades,
porque luego habrá ejercicios, juegos, una línea rítmica y un pentagrama
dinámicos que las usen.

- `domain/rhythm/figures.ts`: cada figura es un `RhythmFigure` con
  `units` (duración en semicorcheas: 16, 8, 4, 2, 1), `head`
  (hueca/rellena), `stem` y `flags`. Las relaciones (`halfOf`, `doubleOf`,
  `durationRatio`, `figureBeats`, `figureDurationMs`) salen de esos datos.
- `domain/rhythm/glyph.ts`: la geometría vectorial se CONSTRUYE desde las
  propiedades (no hay un dibujo por figura), en espacios de pentagrama. Da
  la caja y el centro de la cabeza: el punto que se apoya en una línea.
- `domain/rhythm/rhythmBar.ts`: una barra con duración máxima, figuras
  pegadas sin huecos; insertar, quitar y mover; "no cabe" y
  "no sobrepasar la duración" son la misma regla.
- La UI solo pinta: `features/home/components/notation/` (`FigureGlyph`,
  `FigureTile`, `RhythmBarView`). Si otra feature (Ejercicios) las necesita,
  se mueven a `shared/`.

## Teoría — tres hojas

1. **¿Qué son?** (rehecha con un boceto del 2026-11-21) "Son símbolos que
   *representan la duración* de las notas." Separadores discontinuos entre
   las tres partes:
   - "Así como los números nos ayudan a representar cantidades:" 4 manzanas
     y 1 manzana (dibujadas en SVG, con el labio de los botones), en
     columnas: los dos puntos y la primera manzana de cada fila alineados.
     "En música, las figuras nos ayudan a representar la *duración de los
     sonidos*" (solo resaltada, sin óvalo; abre "Tiempo que permanece
     sonando una nota"). Blanca y negra, cada una con una línea de
     duración con topes (la de la blanca, el doble de larga). Al tocar la
     figura suena y un cursor rojo recorre su línea como el oxímetro del
     pulso, llegando al final justo cuando acaba la nota. Volver a tocarla
     antes de que acabe reinicia nota y cursor.
   - "¡Genial! Pero, ¿respecto a qué cuentan? 🤔 (emoji, pedido por el
     usuario) ¿Segundos? ¿Minutos? Necesitamos una *referencia* para
     "contar" con estas figuras…". "referencia" va resaltada pero SIN
     definición: la respuesta se descubre al tocar el corazón del pulso
     (`PulseHeart`, el del Módulo 2, centrado), que da un latido y abre
     debajo un globo a TODO el ancho (`wide` en `TooltipHost`, con scroll
     automático, sin ícono): "¡Exacto! El pulso es nuestra referencia, y lo
     estudiaremos en el módulo de "Compases y métrica"".
2. **¿Qué figuras musicales existen?** Las cinco, de la que dura más a la
   que dura menos, en una tabla Nombre / Figura / Valor relativo (redonda =
   1 unidad, blanca 1/2 unidad… semicorchea 1/16), con el MISMO estilo
   que la tabla de las notas del Módulo 1: columnas separadas por líneas,
   filas sin divisiones, todo centrado, cabecera gris y el valor en morado
   (como el cifrado). En la tabla las figuras NO suenan: se
   **seleccionan** (solo la ficha se pinta de color de marca, no la fila).
   Tocar la ya elegida la deselecciona. Debajo, un
   recuadro discontinuo "Selecciona una figura musical para ver su detalle"
   que, al elegir una, muestra su nombre y un detalle corto
   (`components/theory/figureDetails.ts`); si el recuadro queda fuera de
   la vista, la hoja baja suave hasta él (`reveal` de `TooltipHost`). Se va de la que más dura a la que
   menos: cada figura se compara solo con la anterior ("dura la mitad
   de…"), nunca "dura el doble"; la redonda no se compara. El de la
   corchea y la semicorchea
   enseña que juntas se escriben unidas por barras (1 o 2), y que es lo
   mismo que escribirlas sueltas (`beamedGlyph` en `domain/rhythm/glyph.ts`).
   Las figuras dentro de un texto van en una ficha morada tenue; las
   seguidas comparten ficha y apoyan la cabeza a la misma altura.
   "Para recordar:" ✓ las figuras necesitan una *referencia* para saber qué
   tanto duran (abre "¡Esa referencia es el pulso! ♥") y ✓ son "las letras"
   que usaremos para aprender a leer y escribir música. Se quitaron los
   ejemplos falsos con ✗.
3. **¡Experimenta un poco!** Una barra que admite **una redonda** (el boceto
   decía 2, pero en un teléfono la semicorchea quedaría en ~10 px; decidido
   con el usuario). Debajo, las cinco figuras.

## Hoja 3 — reglas de la barra

- Texto: "La siguiente barra puede contener una redonda:" (en palabras; se
  probó con la figura dibujada en línea y se prefirió el texto). Debajo de las figuras, un recuadro
  punteado con dos viñetas: "**Toca** o **arrastra** las figuras para llenar
  la barra." y "**Mantén presionadas** las figuras en la barra para
  quitarlas." (en morado).
- Las figuras de abajo **no se acaban**: se arrastran o se tocan (van al
  final).
- Cada figura colocada va en un recuadro **sólido de su propio color**
  (redonda azul, blanca verde, negra morada, corchea naranja, semicorchea
  rosa; relleno con un velo del mismo color y borde en un tono intermedio:
  con el color entero el borde resultaba demasiado fuerte), con esquinas apenas
  redondeadas y **exactamente del ancho de su duración**: los recuadros se
  tocan, sin hueco entre uno y otro. La cabeza va sobre la línea al inicio de
  su espacio; la línea se dibuja por encima de los recuadros.
- Lo que viaja bajo el dedo es **ese mismo recuadro a tamaño real**, flotando
  por encima del dedo: desde que se empieza a arrastrar se ve cuánto ocupará
  (antes viajaba la figura sola, chica y tapada por el dedo, y no se notaba
  que se estaba arrastrando).
- **Vista previa en vivo**: al acercar la copia a la barra, la figura aparece
  en el sitio donde caería (la copia se desvanece) y las demás se corren; al
  moverla, el sitio cambia; al alejarla, todo vuelve a como estaba. Soltar
  aplica exactamente lo que se ve; soltar lejos no cambia nada (una de la
  paleta se descarta, una colocada vuelve a su sitio).
- Para que la ayuda no provoque acciones involuntarias: se entra en la zona
  de la barra a 16 px y se sale recién a 56 px (`dropEnterSlop` /
  `dropExitSlop`), y el sitio solo cambia al pasar la mitad de la figura
  vecina por media semicorchea (`stickyInsertionIndex`). Con el dedo quieto
  en una frontera, nada parpadea.
- Una colocada arrastrada **se mueve** (se inserta donde cae y las demás se
  corren). Antes se intercambiaba al soltarla sobre otra; con la vista previa
  el intercambio era confuso y se quitó.
- **Mantenerla presionada la quita.** Tocarla la hace sonar, sin realce
  visual: el destello al sonar (en la barra y en las fichas de abajo) se
  quitó porque era muy fuerte y en corcheas y semicorcheas duraba menos que
  el sonido. Quizás se retome más adelante.
- Háptica del arrastre: un **tic suave** (`hapticTick`) cada vez que la
  figura encaja en un sitio nuevo de la vista previa o la deja al alejarse;
  al soltar, el toque de colocar/mover (también si vuelve a su mismo sitio).
- Si no cabe, no hay vista previa y al soltarla cerca la barra **tiembla**
  con háptica de error. Colocar, mover y quitar dan un toque suave; al
  llenarse, háptica de éxito. La barra **no** se pinta de verde al llenarse
  (pedido del usuario). Nada crece ni rebota.

## Sonido

Piano, DO central, negra = un pulso a 80 BPM (el pulso del Módulo 2):
redonda 3 s, blanca 1,5 s, negra 0,75 s… (`figureClip`,
`domain/lessons/figureTheory.ts`). La barra no tiene botón para
reproducirse entera.

## Otros cambios del mismo pedido

- La Etapa 1 se llama **Introducción** (antes "Primeros pasos").
- El Home no muestra la barra de desplazamiento (el scroll sigue igual).
