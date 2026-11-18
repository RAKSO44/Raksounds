# Etapa 1 · Módulos 1 y 2 — decisiones de implementación

Punto de partida: `especificacion.md` (misma carpeta). Aquí queda lo que se
decidió al implementarlo, sobre todo donde se aparta del documento. Estas
decisiones prevalecen.

## Alcance

- Solo **Módulo 1 (Las notas musicales)** y **Módulo 2 (Pulso y tempo)** tienen
  lección. Desde el 2026-11-17 la ruta muestra también los Módulos 3–10
  (Etapas 1 y 2) como "Próximamente" (título + temario del roadmap); al
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
  "Comprobar" se habilita con solo haber tocado las dos. Corrección: "Los dos
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

## Módulo 2 — cambios respecto al documento

- El metrónomo es un "toc" sintetizado, programado en el reloj de audio
  (`infrastructure/audio/MetronomePlayer.ts`), no con `setTimeout`.
- **Tap**: 4 golpes de entrada sin calificar y después los golpes a seguir.
  Tolerancia ±150 ms ("justo" hasta ±75 ms), aprobado con el 75 % de los
  golpes y como mucho medio toque de sobra por golpe. Se descuenta la latencia
  constante del equipo (de -60 a +250 ms, p. ej. auriculares Bluetooth). Se
  puede repetir la pasada antes de comprobar. Detalle en
  `domain/lessons/tapSync.ts`.
- **13** "sin resaltado constante": la luz solo acompaña la entrada; el sonido
  sigue.
- **05** (visual): las opciones son luces que parpadean, sin sonido.
- **14**: se ordenan tres BPM al azar (separados ≥ 20) de lento a rápido.
- La teoría 2 rotula los presets como **Lento 60 / Moderado 90 / Rápido 120**:
  es donde se enseña ese vocabulario.
- El pulso se ve por **color** (la luz se enciende y se apaga), nunca por
  tamaño: el sistema de diseño prohíbe animar escala.

## Corrección

- Al fallar se muestra una explicación de una frase. Los sonidos se pueden
  volver a escuchar también después de corregir.
- En las secuencias, las fichas bien puestas quedan en verde y la primera que
  rompe el orden en rojo.
- Ningún ejercicio auditivo se puede responder sin haber escuchado sus
  sonidos. Una nota suelta cuenta al tocarla; un clip largo (pulsos del Módulo
  2), al terminar (si el audio no arranca, la respuesta sigue cerrada).
- Resultado: sin "Volver a practicar". Si hubo fallos, "Reintentar fallos"
  (amarillo, sobre "Continuar") repite solo esas posiciones con ejercicios
  NUEVOS del mismo tipo. Al volver, el resultado muestra "+N" y sube a la nueva
  cuenta; ese total cuenta para completar la práctica y no suma un intento.

## Pendiente de probar en dispositivo

- Latencia real del tap en Android (con y sin auriculares Bluetooth).
- Lector de pantalla, pantallas pequeñas, app en segundo plano a mitad de un
  metrónomo.
