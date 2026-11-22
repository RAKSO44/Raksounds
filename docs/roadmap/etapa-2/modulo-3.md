# Etapa 2 · Módulo 3 (Figuras musicales) — decisiones de implementación

Hecha a partir de bocetos del usuario (2026-11-20). Estas decisiones
prevalecen sobre `roadmap.md`. La **práctica** (2026-11-21) está al final.

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

## Teoría — cuatro hojas

(Eran tres; el 2026-11-22 el usuario separó la pregunta del pulso en una
hoja propia, la 3, y "¡Experimenta un poco!" pasó a ser la 4.)

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
   - (2026-11-22) Tras el separador, solo: "Vemos que, según las barritas
     al costado de esas 2 figuras musicales, la de arriba (𝅗𝅥) dura el doble
     que la de abajo (♩)", con las figuras en su ficha en línea. La pregunta
     "¿respecto a qué cuentan?" y el corazón pasaron a la hoja 3. El texto
     dice "las figuras **musicales** nos ayudan a representar…".
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
   "Para recordar:" pasó a la hoja 4 (2026-11-22).
3. **¿Respecto a qué cuentan?** (título puesto por Claude; el usuario no
   dio uno). "¡Genial! Ya aprendimos cuánto duran las figuras musicales…",
   "Los números cuentan manzanas 🍎 (la manzana SVG en línea). Las figuras
   musicales, ¿qué cuentan?", "¿Qué es esa "unidad"? ¿Segundos? ¿Minutos?",
   "…necesitamos un sistema de tiempo. Algo que: • Sea constante • Podamos
   decidir su velocidad" y el corazón centrado. Tocarlo despliega debajo,
   DENTRO de la hoja (`InlineTip`), "Exacto 😊. **El pulso** es nuestro
   sistema de tiempo totalmente personalizable. / No los segundos, ni los
   minutos, ni las manzanas. / **¡Es el pulso!**" (en rojo lo resaltado, con
   saltos de línea tras "personalizable." y "manzanas."). Pedido del usuario
   (2026-11-22): el globo flotante tapaba lo de abajo; ahora empuja con
   suavidad todo lo que sigue, la hoja baja lo justo para leerlo entero, y
   al cerrarse (tocar fuera, el globo o el corazón) todo vuelve a su sitio.
   Tras un separador:
   - "Aprenderemos a fondo cómo usar este sistema en el módulo "Compases y
     métrica"" (el usuario escribió "Etapa 2: Compases y métricas", pero la
     Etapa 2 se llama "Ritmo" y "Compases y métrica" es su Módulo 5).
   - Reproducir/pausar + oxímetro con una **negra** en cada pulso. Luego un
     recuadro discontinuo "Un pulso = una negra ♩".
   - "Con eso, ¡ya podemos deducir los pulsos que valdrían las demás
     figuras musicales!": otro reproducir/pausar + oxímetro y las cinco
     figuras en fichas que se eligen y se quitan (sin ninguna, suena solo
     el pulso).
   - (2026-11-22) Estos dos eran corazones con "Presiona el ♥…": el usuario
     pidió botones de reproducir/pausar, sin ese texto, alineados con el
     trazo del oxímetro. Pausar detiene del todo: al reproducir de nuevo
     arranca desde el pulso fuerte. Suena sin fin hasta pausar. Arrancar
     uno detiene el otro (el metrónomo es uno solo).
   - La figura elegida se repite encajada en los pulsos
     (`figureNotesInBeat`): 2 corcheas o 4 semicorcheas por pulso, una
     negra en cada uno, la blanca cada dos y la redonda cada cuatro, con el
     fuerte. Cambiar de figura no corta lo que suena en ese pulso: lo
     programado para los siguientes se anula, una nota larga se apaga en el
     próximo golpe y desde ahí entra la nueva.
   - **Las figuras viajan DENTRO de la marca de su golpe** (`HeardBeat.figures`):
     la que suena con el golpe va justo sobre la marca roja, con la cabeza
     en el trazo, y las de en medio (segunda corchea, semicorcheas) detrás, a
     la distancia que la línea recorre hasta que suenan; la línea se recorta
     por la izquierda, así cada una asoma cuando suena. Antes cada figura
     tenía su propio temporizador y animación y a veces quedaba corrida de
     su marca (reportado por el usuario). Con figuras, las marcas son más
     bajas (14/24 px en vez de 20/44) y las figuras más grandes (8 px por
     espacio en vez de 6): las protagonistas son ellas.
4. **¡Experimenta un poco!** Una barra que admite **una redonda** (el boceto
   decía 2, pero en un teléfono la semicorchea quedaría en ~10 px; decidido
   con el usuario). Debajo, las cinco figuras.

## Hoja 4 — reglas de la barra

- Texto (2026-11-22): "Esta barrita puede contener el tamaño de una
  redonda. ¡Llénala de la forma que quieras y escucha cómo suena!" (antes
  "La siguiente barra puede contener una redonda:"). Debajo de las figuras, un recuadro
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

Piano, DO central, negra = un pulso a **72 BPM** (`FIGURE_DEMO_BPM`,
`domain/lessons/figureTheory.ts`; antes 80, el pulso del Módulo 2). Pedido
del usuario: que la semicorchea no suene "ultra rápido" y la redonda no dure
una eternidad. A 72: semicorchea ~208 ms, redonda ~3,3 s, sonando entera.
Vale para todo el módulo (teoría y práctica).

**Reproducir la barra** (2026-11-22). Donde antes iban dos ✓ ("Puedes
llenarla de muchas formas" / "No puedes sobrepasar…"), un botón de
reproducir con el texto al costado "Llena por completo la barra para
escuchar cómo suena." Se habilita al llenarla y el texto pasa a "¡Escucha
cómo suena! Recuerda que asumimos que un pulso es una negra." Al tocarlo
suena el pulso de fondo (4 golpes) con las figuras encima y una línea roja
vertical recorre la barra; al acabar, simplemente deja de sonar. Mientras
suena el ícono es "pausa" (no se deshabilita): tocarlo la corta y vuelve a
"reproducir". Cambiar la barra o tocar una figura también la corta.

Al final, separador y "Para recordar:" ✓ las figuras necesitan una
*referencia* (abre "¡Esa referencia es el pulso! ♥") sobre la cual contar,
y ✓ son "las letras" que usaremos para aprender a leer y escribir música.

## Otros cambios del mismo pedido

- La Etapa 1 se llama **Introducción** (antes "Primeros pasos").
- El Home no muestra la barra de desplazamiento (el scroll sigue igual).

## Práctica (2026-11-21, revisada con el usuario)

Diecisiete ejercicios (`domain/lessons/module3Practice.ts`); se completa con
14/17. Van de reconocer a aplicar:

| # | Ejercicio | Mecánica |
|---|---|---|
| 1 | ¿Cómo se llama esta figura? (redonda, blanca o negra en grande) | choice |
| 2 | ¿Cuál de estas es la X? (tres figuras dibujadas) | choice con figuras |
| 3 | ¿Cómo se llama esta figura? (corchea o semicorchea: la pareja que más se confunde) | choice |
| 4 | ¿Cuál dura más / menos? (vecinas o a dos pasos) | choice con figuras |
| 5 | ¿Qué figura dura la mitad de 𝅗𝅥? | choice con figuras |
| 6 | Ordena de la que más dura a la que menos (4 figuras) | sequence |
| 7 | Si 𝅝 vale 1 unidad, ¿cuánto vale ♪? (tres valores seguidos: 1/2, 1/4, 1/8…) | choice |
| 8 | ¿Qué opción tiene la misma duración que esta figura? (filas de una figura más corta) | choice con figuras |
| 9 | Completa la barra (trae figuras fijas; lo que falta no cabe en UNA figura) | fill-bar |
| 10 | La primera nota es una negra. ¿Qué figura es la segunda? | choice, de oído |
| 11 | ¿Qué figuras son estas? (corcheas o semicorcheas unidas por barras) | choice |
| 12 | Escucha y elige cómo se escribe (una figura y dos de otra, reordenadas) | choice, de oído |
| 13 | Escucha y escribe el ritmo en la barra (trae puesta la primera figura) | fill-bar, dictado |
| 14 | Llena la barra con exactamente N figuras, o combinando dos figuras (al azar) | fill-bar |
| 15 | Escucha y elige cómo se escribe (dos y dos de figuras cortas, reordenadas) | choice, de oído |
| 16 | Escucha y escribe el ritmo en la barra (vacía, con semicorcheas) | fill-bar, dictado |
| 17 | Ordena de la que menos dura a la que más (las 5) | sequence |

Decisiones:

- **Límites de lo enseñado.** Ni silencios ni compases. Las correcciones
  comparan con "la mitad de", como la tabla de la teoría. (Antes tampoco
  "la negra dura un pulso"; desde el 2026-11-22 la teoría lo fija y la
  práctica lo asume: ver "Pulso de fondo".)
- **Pulso de fondo** (2026-11-22, pedido del usuario). Antes del primer
  ejercicio una pantalla dice "Para todos los ejercicios, asumiremos que una
  negra ♩ siempre vale un pulso." con "Continuar" (`practiceIntro`; también
  en "Reintentar fallos"). Todo sonido de figuras de la práctica suena sobre
  el pulso, un golpe por negra desde la primera nota (`rhythmClip(…,
  { pulse: true })`): la figura grande, las opciones, "Escucha", la
  referencia del 10, los dictados y las figuras de la barra. Excepción:
  "Ordena de la que más dura…" (6 y 17), donde las fichas ya **no suenan**.
  Se quitó "Recuerda que la duración es referencial" bajo la ficha grande:
  la referencia ahora es el pulso.
- **De oído siempre hay referencia**: una figura sola no dura un tiempo
  fijo. El 10 da la negra; el 12 y el 15 comparan las figuras del mismo
  ritmo entre sí; en los dictados la referencia es la barra (dura una
  redonda) y, en el 13, además la primera figura ya puesta.
- **Fuera "¿Qué nota dura más?" de oído** (pedido del usuario): dos notas
  sueltas A/B no dicen qué figura es cada una; afirmarlo al corregir no
  tenía sentido. Lo reemplazan el segundo "Escucha y elige" (15) y los dos
  dictados.
- **Fuera la balanza** (pedido del usuario: no gustó). La equivalencia es
  ahora el 8: la figura en grande y tres filas de una figura más corta.
  Parejas de 4 y 8 (la de 2 ya es el ejercicio 5); las filas son siempre
  pares (2/4/8 o 4/6/8): un impar se descartaría sin pensar.
- **Las opciones con figura suenan al tocarlas**, salvo en los de oído y en
  el 11 (`mutedOptions`), donde se resolverían comparando sonidos sin leer.
  Tras corregir suenan todas y conservan los colores de la corrección.
- **Duraciones exactas** (pedido del usuario: "que suene bien"). Antes cada
  nota duraba al menos 1,5 s (`noteOff` garantiza un mínimo para las teclas)
  y la corchea y la semicorchea sonaban igual. Ahora una figura es un clip
  `rhythm` y cada nota se programa en el reloj de audio con
  `IAudioPlayer.playTimed`: suena justo lo que vale al tempo del módulo
  (hoy 72 BPM) y se apaga con un apagador de 60 ms. Las notas de un ritmo van pegadas, sin
  huecos. Vale también para la teoría.
- El 14 pide 3, 5, 6 o 7 figuras (2, 4 u 8 saldrían solas) o combinar
  blanca+negra, blanca+corchea o negra+corchea.
- **Llenar la barra** reutiliza la barra de "¡Experimenta un poco!"
  (`FigurePlayground`, con `palette`, `given`, `disabled` y `onChange`).
  Siempre dice "La barra dura una redonda 𝅝" (pedido del usuario). Las
  figuras que trae son fijas: querer quitarlas hace temblar la barra.
  "Comprobar" se habilita con la barra llena y vale cualquier forma que
  cumpla la regla (`judgeFilledBar`); si falla, debajo aparece "Una forma
  correcta:".
- **Dictados** (regla `dictation`): el parlante toca el ritmo entero las
  veces que haga falta y solo vale ese ritmo en ese orden; al fallar se
  muestra "Lo que sonó:". Se arman con trozos que suman un pulso de negra
  (blanca, negra, dos corcheas; en el 16 también cuatro semicorcheas), con
  al menos dos figuras distintas y no más de 8.
- Una figura sola en su ficha grande va sin el marco común (centrada). En
  filas de botones vecinos todas apoyan la cabeza a la misma altura; en las
  opciones apiladas y en la ficha grande, cada fila se mide con SUS figuras
  y queda centrada (con el marco común, una fila de negras se veía caída).
- **Centro óptico** (pedido del usuario: las corcheas unidas "se sienten a
  la derecha aunque estén centradas"). El ojo centra por el peso visual, no
  por la caja: en un grupo unido la barra (lo más pesado) va sobre las
  plicas, a la derecha de las cabezas, y su tinta quedaba 0,3–0,4 espacios
  a la derecha del centro de la caja. Cada dibujo calcula su tinta
  (`FigureGlyph.ink`: área y centro de masa horizontal, con los corchetes
  muestreados como polígono) y la ficha grande y las opciones apiladas se
  centran por ella. En filas alineadas (botones vecinos) no se corrige:
  ahí manda que las cabezas coincidan.
- **Calificación de un doble toque.** Dos "Comprobar" en el mismo fotograma
  añadían dos resultados y desde ahí cada ejercicio mostraba el veredicto de
  otro (una barra bien llena salió "No es correcto"). Ahora cada resultado
  va en su posición y un segundo "Comprobar" se ignora.
