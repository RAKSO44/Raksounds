# Módulo 4 — Silencios y prolongaciones (decisiones)

Estado: **teoría implementada (5 hojas)**. La práctica todavía no existe: la
entrada de Ejercicios del módulo muestra "Próximamente" (`generatePractice`
devuelve `[]`).

## Teoría (`components/theory/theoryPages.ts` → `rests`)

1. **¿Qué es un silencio?** — "Es una figura musical que representa una
   pausa" (resaltado, sin subrayar: no abre definición). Botón de reproducir
   morado arriba, con la instrucción al lado (sin "Prueba:" ni recuadro
   punteado). Debajo, la línea rítmica con cuatro negras: tocar una la cambia
   por su silencio. Al reproducir, la línea roja del pulso la recorre. Cierra
   con "Nota que:" (dos puntos, con mayúscula).
2. **¿Qué silencios existen?** — La tabla de figuras con la columna
   **Silencio** (sin columna de pulsos: la redonda no vale 4 pulsos en todos
   los compases, y el compás es del Módulo 5). Tocar la figura o su silencio
   abre el detalle (cuánto dura y un truco: el de redonda cuelga de la
   línea, el de blanca se sienta en ella). Luego, con un ✓: "Como ves, ocupar
   lo mismo NO ES sonar igual", con blanca / negra negra / negra + silencio,
   cada una con su reproductor y su línea.
3. **El puntillo** — Según el boceto del usuario (2026-11-24): reproductor
   morado + interruptor (blanca con puntillo; encendido en rojo) + ":
   Activa el puntillo y escucha la diferencia". Debajo, la línea con la
   figura y la **barra de duración** partida en pulsos: lo que vale la figura
   va rayado en gris y lo que suma el puntillo, en rojo ("+ la mitad de lo
   que dura la figura"). Dos ✓: se puede poner a cualquier figura (también
   silencios) y siempre suma la mitad.
4. **La ligadura** — Mismo esquema con un interruptor de ligadura entre la 2.ª
   y la 3.ª de cuatro negras (la barra de duración muestra un sonido menos y
   la parte ligada en rojo). Tras la línea punteada: "¿Y para qué la
   ligadura, si ya existe el puntillo?": blanca ligada a corchea (duración que
   ninguna figura escribe sola) y la equivalencia blanca con puntillo =
   blanca ligada a negra.
5. **¡Experimenta un poco!** — La barra del Módulo 3 con una fila de
   silencios y dos herramientas (puntillo y ligadura): con una encendida,
   tocar una figura de la barra se lo pone o se lo quita; si no cabe o no se
   puede, la barra tiembla.

## Regla: nada fijo

Todo sale de datos (`domain/rhythm/rhythmItem.ts`): un `RhythmItem` es
`{ figure, rest, dotted, tied }`. Duración (`itemUnits`), sonidos
(`sounds`, con lo que prolonga marcado), clip (`itemsClip`, también con
silencio final hasta `lengthUnits`) y dibujo (`itemGlyph`, `restGlyph`,
`tiePath`, `phraseGlyph` en `glyph.ts`) se calculan de esas propiedades, así
que la práctica podrá usar cualquier combinación. Los silencios se dibujan a
partir de las mismas propiedades que su figura (sin plica → cuelga; hueca
con plica → se sienta; sin corchetes → zigzag; N corchetes → N bolitas).
Puntillo y ligadura son **marcas** del dibujo y se pintan con el color
`prolongation` (rojo).

## Pendiente

- Práctica del Módulo 4.
- En la barra, un silencio va en el recuadro del color de su figura (decisión
  abierta en la propuesta; se puede cambiar).
