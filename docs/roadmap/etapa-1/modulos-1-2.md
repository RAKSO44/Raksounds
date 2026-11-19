# Etapa 1 · Módulos 1 y 2 — decisiones de implementación

Punto de partida: `especificacion.md` (misma carpeta). Aquí queda lo que se
decidió al implementarlo, sobre todo donde se aparta del documento. Estas
decisiones prevalecen.

## Alcance

- Solo **Módulo 1 (Las notas musicales)** y **Módulo 2 (Pulso y tempo)** tienen
  lección. Desde el 2026-11-17 la ruta muestra también los Módulos 3–15
  (Etapas 1 a 3) como "Próximamente" (título + temario del roadmap); al
  tocarlos solo sale un aviso.
- Cada módulo tiene dos entradas independientes desde su tarjeta: **Teoría**
  (3 pantallas) y **Práctica** (15 ejercicios).

## Progreso (sin desbloqueos)

- Se guarda en el dispositivo (MMKV, como los ajustes), no en Supabase:
  `features/home/progressStore.ts`. Las reglas viven en
  `domain/lessons/progress.ts`.
- **Nada se bloquea** (decisión del 2026-11-17, reemplaza a la anterior): se
  entra a cualquier módulo, a su teoría o a su práctica, en cualquier orden.
  El progreso solo se señala en el nodo: teoría leída → labio dorado; práctica
  completada → cara dorada.
- La teoría se marca como leída con el ✓ de la última hoja. Ninguna hoja exige
  hacer algo antes de pasar a la siguiente.
- La práctica se completa con **12/15 o más**. Un intento peor nunca quita el
  completado; se guardan mejor resultado, último, intentos y fechas.
- Se puede entrar a la práctica sin haber hecho la teoría ("puedo entrar o a
  la teoría o a los ejercicios").
- **No** se reanuda un intento interrumpido: salir pide confirmación y el
  intento se pierde, igual que en las rondas de Ejercicios. El intento sí se
  genera de una semilla (`generatePractice(id, seed)`), así que reanudarlo
  más adelante solo exige guardar semilla, posición y respuestas.

## Módulo 1 — teoría (rehecha el 2026-11-17 a partir de bocetos del usuario)

Tres hojas con pie ← n → (✓ en la última), sin barras de progreso arriba:

1. **¿Qué son?** Bloques de construcción básicos; siete notas naturales; tabla
   NOTA / CIFRADO / SONIDO (cada título abre su definición, cada altavoz suena).
   Cierra con "¡Asegúrate de recordarlas!".
2. **¿Qué orden siguen?** Teclas blancas C…B numeradas 1–7 con una 8.ª "?"
   (suena el DO agudo); "volvemos al principio, pero más agudo": teclado con el
   8.º DO destacado y una llave entre los dos DO. "octava" abre su definición
   ("un intervalo musical…").
3. **Recuerda:** diez teclas DO…MI con las dos RE marcadas y la cuenta 1–8
   entre ellas: una nota se repite a ocho notas naturales; esa distancia es la
   octava.

Solo teclas blancas: en este módulo no se habla de alteraciones.

## Módulo 1 — práctica, cambios respecto al documento

(Revisado con el usuario el 2026-11-17.) Regla general: toda nota que se ve
se puede tocar y suena, y varias a la vez suenan juntas; la nota que hay que
adivinar no suena hasta corregir.

- **01** "¿Cómo se llama la nota marcada?": la escala DO…SI en barras con solo
  DO rotulado y una barra marcada; se cuenta desde DO. Las barras y las
  alternativas suenan. Al comprobar (acierte o falle) la escala se llena y
  muestra todos los nombres.
- **02** "¿Qué nota sonó?": "Escucha:" + botón celeste (siempre el parlante,
  nunca "repetir"); debajo, la escala SIN nombres (ni DO) y sin marcar, luego
  la pregunta y "Tip: presiona las barras para escuchar las notas". La barra
  que sonó se pinta y aparecen los nombres solo al comprobar.
- **03 / 09 / 14**: "Ordena las notas de forma ascendente / descendente"; el 14
  añade "empezando en X" (al cruzar SI→DO, si no, habría varias respuestas).
  Las fichas suenan, se tocan para poner/quitar o se ARRASTRAN (la ficha viaja
  bajo el dedo): a un hueco vacío, sobre otra colocada (se intercambian; si
  venía de abajo, la de antes vuelve abajo) o de vuelta abajo.
- **04–08, 10** (filas con hueco): las notas de la fila suenan (subiendo de
  verdad: tras SI, el DO de la octava siguiente); el hueco no, hasta
  comprobar. Las alternativas NO suenan.
- **11 / 12** "¿Cuál X es más agudo / grave?": sin luz ni texto de ayuda;
  "Comprobar" se habilita con una opción elegida (pulsarla de nuevo la
  deselecciona). Corrección: "Los dos
  son X; pero en octavas diferentes".
- **13** "¿Las dos notas tienen el mismo nombre?": dos botones celestes con el
  parlante, una nota cada uno, que se pueden tocar a la vez. Corrección: "el
  mismo nombre en diferente octava".
- **15** "Marca las dos notas que comparten el mismo nombre": tres botones con
  parlante (dos son la misma nota a una octava; el tercero, otra nota en
  cualquiera de las dos octavas). Se marcan y desmarcan; "Comprobar" solo con
  exactamente dos. Al comprobar, cada parlante se cambia por su nota.
- **06**: el hueco se completa eligiendo entre 3 nombres (no ordenando).
- **11**: DO4/DO5 o DO5/DO6 (el banco de muestras es C4–C6; no hay DO3).
- **13** y **15**: la nota distinta se aleja al menos dos nombres, para que el
  ejercicio sea de octava y no de distancias pequeñas.
- 04 no usa SI como punto de partida: el salto SI→DO se enseña en 07, 08 y 10.

## Módulo 2 — práctica (rehecha el 2026-11-19 con el usuario)

Once ejercicios: la lección es corta y no hace falta llegar a 15. La
práctica se completa con el 80 % (9/11).

1. ¿Este pulso es regular? (botón "Escuchar" + Sí/No)
2. Tocar con el pulso, lento (65–75 BPM)
3. ¿Cuál tiene el BPM más alto? (A/B, separados 45–55 BPM)
4. ¿Cuál tiene el BPM más bajo?
5. Tocar con el pulso, más rápido (95–105 BPM)
6. Si el tempo pasa de X a Y BPM, la música… (números y sentido al azar;
   el distractor es "más agudo/grave")
7. ¿Qué significa BPM?
8. A 60 BPM, ¿cuántos pulsos hay en un segundo?
9. ¿Cuál va a 120 BPM? (60/90/120, se deja tal cual)
10. ¿Estos dos metrónomos van al mismo BPM? (iguales o a 20–30 BPM)
11. Ordena de más lento a más rápido

Decisiones:

- **Metrónomo propio** (`Metronome`, en SVG): de nogal con labio 3D, escala
  crema con una línea central muy tenue como guía, brazo de acero que llega
  a un extremo JUSTO con cada golpe y pesa de latón. Como en uno mecánico
  real (escala de Maelzel, 40–208), la pesa sube para los tempos lentos y
  baja para los rápidos; mientras el BPM es la pregunta queda a media altura
  para no delatarlo. La placa dice solo el número o "?" (sin "BPM").
  Encendido: madera y vaivén; apagado: la misma madera atenuada bajo un velo
  neutro (no "otro objeto") y brazo al centro. Los cambios son fundidos
  cortos que se notan sin llamar la atención, y el brazo no salta al cambiar
  de tempo. Varilla, pesa y eje en colores planos, sin bordes ni brillos
  (pulido, no hiperrealista). La placa es de alto fijo y el número va
  centrado dentro, con aire respecto al eje. Tamaño ~100 × 124.
- **Ningún pulso se corta solo.** Elegir una opción la hace sonar sin fin;
  elegir otra cambia a esa; pulsar la elegida la deselecciona y la apaga.
  Tras corregir, las opciones siguen encendiendo y apagando su pulso.
- **Tocar con el pulso**: el metrónomo arranca solo y no se apaga. No hay
  golpes de entrada ni botón de empezar: se empieza cuando se quiere y
  cuenta desde el primer toque. Cuatro toques, cada uno pinta su punto; con
  el cuarto TAP se bloquea y "Comprobar" se habilita. Los toques deben caer
  en golpes **seguidos** (saltarse uno es fallo); tolerancia ±150 ms ("justo"
  hasta ±75 ms), aprobado con 3 de 4, latencia constante descontada.
- **¿Mismo BPM?**: dos metrónomos pequeños que se encienden y apagan
  tocándolos; suena uno a la vez. El BPM aparece en la placa al corregir.
- Quitados: la luz que parpadea, el tap sin luz y las repeticiones de "¿cuál
  va más rápido?". El "toc" sigue siendo sintetizado y programado en el
  reloj de audio (`MetronomePlayer`).

## Módulo 2 — teoría (rehecha el 2026-11-18 a partir de bocetos del usuario)

Dos hojas.

1. **¿Qué es el pulso?** "Es una sucesión constante de golpes" (*constante*
   abre "Siempre la misma velocidad"). Un **corazón** a 80 BPM y a su lado una
   línea tipo **oxímetro**; abajo, "Nota que: ✓ la distancia entre pulsos es
   igual ✓ algunos pulsos son más fuertes que otros".
2. **¿Qué es el tempo?** La velocidad del pulso; se mide en **BPM** (*tempo*
   abre "Velocidad que tiene el pulso"). El mismo corazón con "BPM: n", la
   línea y un **slider** de 40 a 200 (arranca en 100); debajo, la indicación
   de tempo (*Allegro*…), que solo cambia al mover la barra y abre
   "Indicaciones de tempo. Se usan en partituras".

Decisiones (del usuario):

- El corazón es un **interruptor**: un toque arranca un pulso sin fin
  (`IMetronome.loop`, programado en el reloj de audio con lookahead), otro lo
  detiene. En la hoja 2 el slider cambia el tempo **en vivo**.
- **Acento cada 4** (`isAccent`): el golpe fuerte suena más agudo y a pleno,
  deja una marca más alta en la línea, late más y su "BUM" es más grande.
- Con cada golpe: háptica seca, el corazón **late** (crece un poco y vuelve,
  sin rebote: única excepción a la prohibición de animar escala) y suelta un
  "BUM" hacia arriba en una dirección al azar.
- La línea avanza a **velocidad constante** (cada marca tarda lo mismo en
  cruzarla): la distancia entre marcas es el tempo hecho espacio.
- Indicaciones (`TEMPO_MARKINGS`): Largo < 60 · Adagio 60–75 · Andante
  76–107 · Moderato 108–119 · Allegro 120–167 · Presto 168–200.

## Corrección

- Al fallar se muestra una explicación de una frase. Los sonidos se pueden
  volver a escuchar también después de corregir.
- En las secuencias, las fichas bien puestas quedan en verde y la primera que
  rompe el orden en rojo.
- Escuchar no es requisito para responder: las opciones se pueden elegir
  desde el principio (decisión del usuario, 2026-11-18).
- Resultado: sin "Volver a practicar". Si hubo fallos, "Reintentar fallos"
  (neutro, sobre "Continuar") repite solo esas posiciones con ejercicios
  NUEVOS del mismo tipo. Al volver, el resultado muestra "+N" y sube a la nueva
  cuenta; ese total cuenta para completar la práctica y no suma un intento.

## Pendiente de probar en dispositivo

- Latencia real del tap en Android (con y sin auriculares Bluetooth).
- Lector de pantalla, pantallas pequeñas, app en segundo plano a mitad de un
  metrónomo.

### Ajustes 2026-11-18

- Ningún ejercicio exige escuchar antes de responder: las opciones se eligen
  desde el principio y no hay aviso de "Escucha antes de responder".
- ¿Cuál es más agudo/grave?: "Comprobar" se activa con una opción elegida;
  pulsar la elegida la deselecciona.
- El resultado ya no muestra el número de intentos (se sigue guardando).
- "Reintentar fallos" pasa a ser un botón neutro (el amarillo era demasiado
  fuerte junto a "Continuar").
- Definiciones de la teoría: globo sin color (superficie y borde, como los de
  Duolingo), letra un poco más grande y una sola frase corta.

### Ajustes 2026-11-19

- "Reintentar fallos" vuelve a su altura de antes (sin el espacio extra sobre
  "Continuar"); su texto sigue centrado.
- Botones con ícono a la izquierda (escuchar, TAP): el texto mide lo que
  mide. Antes tenía base 0 y, en un botón que no ocupa todo el ancho, se
  partía letra por letra y estiraba el botón hacia abajo.
- Metrónomo rehecho en SVG: en Android el `skewX` de las vistas no se aplica
  y la pirámide salía rectangular. Sin destello amarillo en el eje.
- "¿Este pulso es regular?": el botón de escuchar es solo el parlante.
- "¿Cuál tiene el BPM más alto/bajo?": la pista dice solo "Toca una opción
  para escucharla".
- Teoría del tempo: "Significa Pulsos Por Minuto (Beats Per Minute)".
