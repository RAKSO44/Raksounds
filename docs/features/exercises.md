# Ejercicios

## Auditivos

Entrenamiento auditivo por rondas de 10 ejercicios. Dos tipos, que se pueden practicar
sueltos o mezclados ("Mixto"):

1. **Identificación de intervalo**: suenan la nota base (visible) y otra nota oculta; hay
   que decir qué intervalo forman eligiendo entre opciones que son INTERVALOS
   ("5ª justa", "3ª menor"), nunca notas.
2. **Identificación de nota**: suena la nota base y hay que encontrar cuál de tres
   candidatas está al intervalo pedido. Las opciones NO muestran su nota: son sonido, y
   pulsarlas las hace sonar tantas veces como haga falta.

Reglas de negocio clave:

- La dificultad se elige antes de empezar: **7 niveles acumulativos** (cada uno añade
  intervalos a los del anterior), del 8ª/5ª justas al tritono. Viven en
  `domain/ear-training/levels.ts`; el color de cada franja lo decide `tier`, no la UI.
- La nota base sale de las 12 tónicas y siempre en la octava 4, para que la nota más
  aguda posible (base + 8ª) caiga dentro del banco de muestras C4–C6.
- Corregir es un paso explícito: "Confirmar" solo se habilita con una opción elegida y,
  tras corregir, el MISMO botón pasa a decir "Continuar".
- Al terminar la ronda se REEMPLAZA la pantalla del ejercicio por la de
  resultados (`exercise/summary`): aciertos, tiempo medio y repeticiones medias por
  pregunta (cuántas veces hubo que volver a oír una nota YA escuchada),
  intervalos fallados y el acierto más rápido, todo calculado en
  `domain/ear-training/roundSummary.ts`, no en la pantalla. Al corregir suena
  un efecto de acierto/error y al aparecer el resultado uno de ronda superada
  (≥ 50 %) o no superada; el corte vive en `domain/ear-training/roundOutcome.ts`
  y es el mismo que colorea el porcentaje. Ahí el "atrás" del
  sistema equivale a "Continuar"; en la ronda, en cambio, salir (flecha o
  "atrás") pide confirmación con un `ConfirmDialog`. En la raíz de las pestañas
  el "atrás" del sistema también confirma antes de cerrar la app
  (`shared/navigation/ExitConfirmation`).

## Entonación

Se escucha una referencia y se CANTA la respuesta; el micrófono detecta la
altura cantada. Dos tipos, sin modo Mixto:

1. **Entonación de intervalos**: suena la nota base y hay que cantar el
   intervalo pedido, **solo ascendente**. Usa los mismos 7 niveles de
   `levels.ts`.
2. **Entonación de notas**: una SOLA tecla hace sonar a la vez 1, 2, 3 o 4
   notas y hay que cantar la de la función pedida (fundamental, 3ª, 5ª, 7ª).
   Tiene 5 niveles propios (`domain/singing/chordLevels.ts`): una nota →
   díada → tríada en estado fundamental → tríadas invertidas → cuatríadas.
   Las inversiones tienen nivel propio porque en estado fundamental la función
   coincide con la posición y se puede acertar sin oírla.

Reglas de negocio clave:

- Se califica **sin importar la octava** (una voz grave canta una octava abajo
  del piano C4–C6). Consecuencia aceptada: la 8ª justa se acierta repitiendo la
  base.
- ±10 cents = perfecto (hoja morada); ±25 = afinado (verde); ±50 = "casi"
  (hoja ámbar, suena a acierto y vale MEDIO punto: 2 "casi" en 10 dejan la
  ronda en 90 %, `singingScore`); más = otra nota (roja), y la corrección dice
  QUÉ se cantó. Sobre la hoja, una barra de -50 a +50 cents centrada en la nota
  pedida (`domain/singing/tuningGauge.ts`). Todo en `domain/singing/`.
- La tecla del acorde lleva su cifrado con bajo (`C/E`; díadas `C–E`,
  `domain/singing/chordSymbol.ts`). Al corregir se cambia por un teclado
  dibujado en la app (`ChordKeyboard`, geometría en
  `domain/music-theory/keyboard.ts`): solo suenan las teclas del acorde, la
  pedida va señalada con una flecha y otra tecla hace sonar el acorde entero.
- La nota objetivo NO se puede escuchar antes de cantar; aparece al corregir.
- Sin "Confirmar": la toma se cierra sola al callar (`domain/pitch/singingTake.ts`)
  y se califica; solo hay "Continuar". La detección de altura es YIN en TS puro
  (`domain/pitch/pitchDetection.ts`).
- El micrófono es `MicButton` (`shared/design-system/`), copia del de Duolingo:
  cuadrado azul → píldora con puntos → barras con el volumen → gris hundido.
- El permiso del micrófono se pide al ELEGIR "Entonación de intervalos/notas"
  en el menú (`useMicrophoneGate`): si se niega, `MicPermissionDialog` avisa y
  no deja entrar; volver a pulsar vuelve a pedirlo. El micrófono del ejercicio
  lo sigue pidiendo por si acaso.
