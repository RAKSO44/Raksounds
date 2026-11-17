<!--
  Documento de partida de la Etapa 1 (redactado con ChatGPT). Es contexto,
  no una especificación cerrada: las decisiones tomadas al implementar viven
  en los archivos de cada módulo de esta carpeta y prevalecen sobre este.
  Implementados: Módulos 1 y 2 (ver modulos-1-2.md).
-->

# ETAPA 1 · Reconocimiento musical y ritmo

Especificación funcional y pedagógica para Claude Code

Módulos 1–6  |  18 pantallas interactivas  |  90 ejercicios de práctica  |  React Native

Objetivo: implementar una ruta de aprendizaje tipo Duolingo, con una entrada por módulo en forma de círculo y una card con dos acciones independientes: TEORÍA y PRACTICAR. No es un clon visual: aplicar la lógica de progresión con identidad gráfica original.

# 1. Instrucciones prioritarias para Claude Code

- Leer primero roadmap.md y revisar la arquitectura actual del proyecto. Mantener las decisiones de diseño y convenciones existentes; no asumir librerías ni estructura de carpetas no verificadas.

- Implementar SOLO la Etapa 1 (módulos 1–6), sin anticipar conceptos de pentagrama/claves, tonos/semitonos, intervalos o escalas posteriores.

- Cada módulo tiene DOS secciones, Teoría (máximo 3 pantallas) y Practicar (15 ejercicios por intento). La teoría debe tener contenido breve e interacción real, no pantallas solo de lectura.

- No importar imágenes PNG/JPG/WebP/SVG como assets para ilustraciones. Dibujar con React Native, react-native-svg si ya está o si se justifica, y animaciones nativas/Reanimated según stack existente. SVG se genera como componentes JSX, no se carga como fichero de imagen.

- Crear componentes propios para pentagrama/una línea rítmica, figuras y silencios, barras, división de valores, metrónomo, pulso y teclas; evitar símbolos Unicode como representación musical final por diferencias entre plataformas.

- No enseñar técnica instrumental; el teclado visual es exclusivamente una referencia de alturas. Priorizar audio real o síntesis fiable con baja latencia; verificar las capacidades del stack antes de integrar una librería.

- No cambiar navegación, stores, tema o persistencia sin revisar el código existente. Trabajar incrementalmente y mantener componentes reutilizables.

- Aplicar accesibilidad: botones de al menos 44×44 dp, contraste, etiquetas accesibles, feedback visual además de auditivo y opción de repetir los sonidos.

# 2. Experiencia de navegación y progreso

# 2.1 Ruta principal

Home → Etapa 1 → seis nodos circulares conectados por una ruta ligeramente serpenteante. Nodo actual destacado; bloqueado neutro; completado con color y marca de verificación. Una pulsación abre una card anclada al nodo, como en las referencias de Duolingo, con nombre del módulo, descripción corta, estado de cada sección y dos botones.

| Estado visual | Condición | Acción disponible |
| --- | --- | --- |

| Bloqueado | Módulo anterior no completado según regla de progresión | Card informativa; sin iniciar (o permitir vista previa según configuración) |

| Disponible | Desbloqueado y no terminado | Teoría y Practicar; practicar puede exigir teoría completada |

| Parcial | Teoría completada, práctica pendiente | Teoría: Repasar; Práctica: Comenzar/Continuar |

| Completado | Teoría completada y práctica completada | Ambos botones: Repasar teoría / Repetir práctica |



# 2.2 Card al tocar un círculo

Título: «Módulo N · [nombre]». Subtítulo: beneficio en una frase. Acción 1: «VER TEORÍA» (o «REPASAR TEORÍA»). Acción 2: «PRACTICAR · 15 EJERCICIOS» (o «VOLVER A PRACTICAR»). Cada botón tiene una marca independiente de progreso: Pendiente / En curso / Completado. La card se puede cerrar tocando afuera, con botón X o navegación atrás.

La finalización de teoría NO debe depender de contestar 15 preguntas; se marca al recorrer las pantallas y efectuar la interacción obligatoria de cada una. La práctica solo se completa al finalizar una sesión de 15 ejercicios válidos, con regla de éxito definida abajo. Nunca borrar el estado completado cuando se repite.

# 2.3 Reglas propuestas, configurables

- Ruta inicialmente secuencial: Módulo N+1 se desbloquea al completar Teoría + Práctica del módulo N; dejar regla centralizada y modificable.

- Teoría: completar al llegar al final y ejecutar al menos una interacción demostrativa por pantalla. Permitir volver a cada pantalla en cualquier momento.

- Práctica: 15 ejercicios por sesión; al completar los 15 se registra el intento. Para primera aprobación, objetivo propuesto ≥12/15 correctos (80 %); si es menor, ofrecer repetir sin penalización y con correcciones. No bloquear nunca el repaso.

- Si se interrumpe una sesión, conservar la posición y las preguntas generadas (o semilla y respuestas), no regenerarlas silenciosamente. Reiniciar solo si el usuario lo solicita.

- Feedback inmediato breve. Error: mostrar respuesta correcta, explicación de una frase y reproducción/repetición opcional. Evitar cuentas regresivas en la primera etapa.

- Registrar mejor puntuación, último intento, intentos totales, fecha de primer completado, teoría completada y práctica completada por módulo.

- Si el audio está apagado o falla, en retos auditivos indicar el problema y permitir reintento; no calificar audios no reproducidos.

# 3. Sistema de ejercicios y aleatorización

Cada módulo contiene una plantilla exacta de 15 posiciones por intento. Las posiciones cubren el MISMO concepto con repetición y pequeñas variaciones; las respuestas y estímulos concretos pueden cambiar mediante generación controlada. No reemplazar las 15 posiciones con 15 preguntas temáticamente inconexas.

| Motor / mecánica | Propósito | Condiciones |
| --- | --- | --- |

| choice | Elegir entre 2–4 respuestas | Distractores plausibles, nunca duplicados |

| sequence | Ordenar fichas de notas o figuras | Corregir secuencia completa; alternativa accesible sin drag |

| audio-choice | Escuchar y elegir | Botón de repetir; reproducir antes de habilitar respuesta |

| tap-sync | Tocar al ritmo | Tolerancia temporal ajustable; calibrar latencia |

| compare | Escuchar/ver dos ejemplos y comparar | Igualar nivel y timbre para no sesgar |

| build-rhythm | Completar un compás con fichas | Validación matemática de duración |

| highlight | Tocar un elemento en diagrama | Áreas táctiles grandes; labels |



Variación: generador con PRNG/seed de sesión, pools por nivel, restricciones pedagógicas y verificador de unicidad. Para cada pregunta guardar tipo, parámetros, opciones ya mezcladas, respuesta correcta, y explicación. Semilla reproducible para tests. Evitar repetir el mismo ejemplo consecutivamente; nivel de dificultad: preguntas 1–5 guiadas, 6–10 aplicación, 11–15 consolidación.

Ejemplo de estructura conceptual: ExerciseDefinition { id, moduleId, conceptId, mechanic, difficulty, generator(params, seed), validator, feedback }. Persistir un ExerciseInstance serializable con stimulus, options, correctAnswer, userAnswer y estado. No guardar funciones en la persistencia.

# 4. Lineamientos visuales y audio

- Elementos vectoriales originales: círculo de módulo con elevación/relieve dibujado, icono contextual (nota, metrónomo, figura, silencio, compás, chart), estrella/check, ruta de nodos y card. Evitar copiar mascotas, iconos exactos, marcas o ilustraciones de Duolingo.

- Audio: notas de referencia (por ejemplo C4–B4 y C5 para octavas), clic de metrónomo y patrones rítmicos. Asegurar afinación/frecuencias correctas, liberación de recursos y que una reproducción nueva detenga o sincronice la anterior según pantalla.

- Música vectorial: dibujar cabezas ovaladas, plicas, banderas, barras de corcheas, silencios, puntillos, arcos de ligadura, barras de compás y líneas como paths/rects/circles. No depender de glifos musicales de una fuente del dispositivo.

- Animación: iluminar nota activa, elevar/cambiar tamaño el círculo del pulso, extender barras temporales, dividir figuras en dos, señalar acentos y mover cursor de reproducción. Respetar Reduce Motion.

- En compases, explicar que 2/4, 3/4, 4/4 significan respectivamente 2, 3 y 4 unidades de negra por compás; diferenciar agrupación de pulsos de simple conteo.

- En figuras, enseñar equivalencias relativas (1 redonda = 2 blancas = 4 negras = 8 corcheas = 16 semicorcheas); no afirmar que la negra equivale siempre a un pulso fuera de contexto.

- En puntillo: aumenta una duración en 50 %. Ligadura de prolongación: une dos notas de la misma altura; no confundir con ligadura de expresión.

- En charts rítmicos: usar patrones de compás 4/4 y una sola línea rítmica, sin enseñar lectura de alturas ni claves en esta etapa.

# 5. Contenido implementable por módulo

# Módulo 1 — Las notas musicales

Objetivo de aprendizaje: Identificar los siete nombres, orden, ciclo y octavas.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. Las 7 notas

TEXTO EXACTO EN UI: «La música utiliza 7 nombres: DO, RE, MI, FA, SOL, LA y SI.»

VISUAL VECTORIAL: Siete fichas vectoriales que crecen en altura; mini teclado opcional sin enseñar técnica.

INTERACCIÓN OBLIGATORIA: Al tocar una ficha: resaltar y reproducir una altura de escala de Do mayor. CTA: «Toca al menos 3 notas».

MICROCOPY / CTA: «Toca una nota para escucharla».  |  Completar pantalla cuando: Tres notas distintas reproducidas.

### Pantalla 2. El orden se repite

TEXTO EXACTO EN UI: «Después de SI, vuelve DO. También podemos ir hacia atrás.»

VISUAL VECTORIAL: Camino circular de 7 fichas y una octava visual al final.

INTERACCIÓN OBLIGATORIA: Botón «¿Cuál sigue?» oculta el DO final, elección entre 3; al acertar, animar ciclo y reproducir ascenso. Alternar «Subir / Bajar».

MICROCOPY / CTA: «DO · RE · MI · FA · SOL · LA · SI · ?»  |  Completar pantalla cuando: Responder y probar ambas direcciones.

### Pantalla 3. La octava

TEXTO EXACTO EN UI: «Dos DO pueden sonar diferentes: uno más grave y otro más agudo.»

VISUAL VECTORIAL: Dos puntos DO en registro grave/agudo; teclado esquemático DO–DO.

INTERACCIÓN OBLIGATORIA: Botones «DO grave», «DO agudo», «Comparar» y línea que conecta ambos. Revelación «Entre ellos hay una octava».

MICROCOPY / CTA: «El mismo nombre, otra altura».  |  Completar pantalla cuando: Escuchar ambos registros.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | choice · Toca el nombre de la nota mostrada | nota aleatoria de DO–SI | Ficha correcta entre 3 nombres; sin alturas nuevas |

| 02 | audio-choice · Escucha y elige la ficha iluminada al finalizar | nota aleatoria DO–SI con ficha reproducible | La ficha activada; fase guiada de asociación |

| 03 | sequence · Ordena DO–RE–MI | rotar entre tramos consecutivos de 3 notas | Orden ascendente |

| 04 | choice · ¿Qué nota va después de X? | X aleatoria DO–LA | Siguiente nombre |

| 05 | choice · ¿Qué nota va antes de X? | X aleatoria RE–SI | Anterior nombre |

| 06 | sequence · Completa una secuencia de 4 | inicio aleatorio y 1 hueco | Secuencia ascendente |

| 07 | choice · ¿Qué va después de SI? | SI fijo, distractores variables | DO |

| 08 | choice · ¿Qué va antes de DO? | DO fijo, sentido descendente | SI |

| 09 | sequence · Orden descendente de 4 notas | tramo generado de DO–SI | Orden descendente |

| 10 | choice · Completa secuencia que cruza SI→DO | ej. LA–SI–?–RE | DO |

| 11 | compare · Escucha dos DO de registros diferentes | DO3/DO4 o DO4/DO5 | Identificar el más agudo |

| 12 | compare · Escucha dos registros de una misma nota | nota DO/RE/MI, octavas controladas | Identificar el más grave |

| 13 | choice · ¿Son los dos sonidos de nombre igual? | mismo nombre en octavas vs distinta nota | Igual nombre cuando son octavas |

| 14 | sequence · Ordena 6 notas comenzando en X | arranque variable, ciclo SI–DO permitido | Ciclo correcto |

| 15 | audio-choice · Reconoce una octava entre dos pares | un par a octava, otro de notas diferentes | Par del mismo nombre en dos registros |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# Módulo 2 — Pulso y tempo

Objetivo de aprendizaje: Sentir la regularidad del pulso y ajustar su velocidad en BPM.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. Siente el pulso

TEXTO EXACTO EN UI: «El pulso es un golpe regular que podemos seguir.»

VISUAL VECTORIAL: Círculo vectorial que late y cuatro marcas que se resaltan.

INTERACCIÓN OBLIGATORIA: «Escuchar pulso» a 80 BPM; usuario toca TAP durante 6–8 pulsos. Mostrar feedback por cercanía temporal.

MICROCOPY / CTA: «Toca siguiendo el pulso».  |  Completar pantalla cuando: Completar una demostración TAP (modo guiado).

### Pantalla 2. Lento y rápido

TEXTO EXACTO EN UI: «El tempo es la velocidad del pulso.»

VISUAL VECTORIAL: Dos secuencias con espacios amplios/cortos y metrónomo animado.

INTERACCIÓN OBLIGATORIA: Selector 60 / 90 / 120 BPM con reproducción sincronizada y comparación A/B.

MICROCOPY / CTA: «Más rápido, más pulsos por minuto».  |  Completar pantalla cuando: Escuchar al menos dos velocidades.

### Pantalla 3. BPM

TEXTO EXACTO EN UI: «BPM significa pulsos por minuto.»

VISUAL VECTORIAL: Tarjeta con contador BPM y barra que pulsa.

INTERACCIÓN OBLIGATORIA: Controles +/- o slider seguro 40–200 BPM; presets 60, 90, 120; mostrar «60 BPM = 1 pulso por segundo».

MICROCOPY / CTA: «Cambia los BPM y escucha».  |  Completar pantalla cuando: Modificar BPM y escuchar la diferencia.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | audio-choice · Escucha: ¿hay pulsos regulares? | metrónomo constante vs irregular | Regular |

| 02 | tap-sync · Toca 4 pulsos con guía | BPM 70–90, inicio visual | Taps próximos a las marcas |

| 03 | audio-choice · ¿Cuál va más rápido, A o B? | 60 vs 110 BPM | Más rápido |

| 04 | audio-choice · ¿Cuál va más lento? | 65 vs 120 BPM | Más lento |

| 05 | choice · Identifica el pulso en una animación | ciclo regular vs destellos irregulares | Animación regular |

| 06 | tap-sync · Sigue 6 pulsos | BPM 65–95 | Desviación dentro de tolerancia |

| 07 | compare · Compara dos tempos cercanos | 75 vs 100 BPM | Más rápido |

| 08 | choice · Si aumenta BPM, ¿qué ocurre? | caso 60→120 | Aumenta velocidad |

| 09 | choice · ¿Qué significa BPM? | variantes de distractores | Pulsos por minuto |

| 10 | choice · A 60 BPM, ¿cuántos pulsos hay por segundo? | 60 BPM fijo | 1 |

| 11 | audio-choice · Elige ritmo a 120 BPM | audios 60/90/120 | 120 BPM |

| 12 | compare · ¿Es el segundo tempo igual o distinto? | 90/90 vs 90/110 | Igual/distinto |

| 13 | tap-sync · Toca pulso sin resaltado constante | BPM 75–105, guía inicial | Sincronía dentro de tolerancia |

| 14 | choice · Ordena Lento–Moderado–Rápido | presets 60,90,120 | Orden BPM creciente |

| 15 | audio-choice · Identifica el pulso más rápido entre 3 | 3 BPM separados ≥25 | Audio con BPM máximo |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# Módulo 3 — Figuras musicales

Objetivo de aprendizaje: Comprender duraciones relativas entre redonda, blanca, negra, corchea y semicorchea.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. Sonidos largos y cortos

TEXTO EXACTO EN UI: «Las figuras indican cuánto dura un sonido.»

VISUAL VECTORIAL: Redonda y dos blancas dibujadas con SVG; barra temporal.

INTERACCIÓN OBLIGATORIA: Alternar «Redonda» / «Blanca»: misma altura y volumen, duración relativa 2:1.

MICROCOPY / CTA: «¿Cuál dura más?»  |  Completar pantalla cuando: Comparar ambos audios.

### Pantalla 2. Divide una figura

TEXTO EXACTO EN UI: «Cada figura se divide en dos del valor siguiente.»

VISUAL VECTORIAL: Árbol vectorial: redonda → 2 blancas → 4 negras → 8 corcheas → 16 semicorcheas.

INTERACCIÓN OBLIGATORIA: Botón «Dividir» revela un nivel por vez; barra y reproducción rítmica cambian; «Unir» regresa.

MICROCOPY / CTA: «Una redonda equivale a dos blancas».  |  Completar pantalla cuando: Revelar hasta semicorcheas.

### Pantalla 3. Escucha la duración

TEXTO EXACTO EN UI: «Dos figuras pueden durar distinto aunque suenen igual de agudas.»

VISUAL VECTORIAL: Tarjetas grandes con figuras vectoriales y barras de tiempo.

INTERACCIÓN OBLIGATORIA: Reproducir dos notas del mismo timbre/altura y elegir la más larga; 3 minirondas.

MICROCOPY / CTA: «Escucha. ¿Cuál duró más?»  |  Completar pantalla cuando: Completar comparación interactiva.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | choice · Reconoce redonda | figura entre 3 símbolos | Redonda |

| 02 | choice · Reconoce blanca | figura entre 3 símbolos | Blanca |

| 03 | choice · Reconoce negra | figura entre 3 símbolos | Negra |

| 04 | choice · Reconoce corchea | figura entre 3 símbolos | Corchea |

| 05 | choice · Reconoce semicorchea | figura entre 3 símbolos | Semicorchea |

| 06 | compare · ¿Qué figura dura más? | redonda vs blanca | Redonda |

| 07 | compare · ¿Qué figura dura menos? | blanca vs negra | Negra |

| 08 | choice · 1 blanca equivale a ¿cuántas negras? | blanca fija | 2 |

| 09 | choice · 1 redonda equivale a ¿cuántas blancas? | redonda fija | 2 |

| 10 | choice · 1 negra equivale a ¿cuántas corcheas? | negra fija | 2 |

| 11 | sequence · Ordena figuras de mayor a menor | 3–5 tipos elegidos | Duración relativa descendente |

| 12 | choice · Completa equivalencia 1 redonda = ? negras | redonda fija | 4 |

| 13 | choice · Completa equivalencia 1 corchea = ? semicorcheas | corchea fija | 2 |

| 14 | audio-choice · Escucha dos duraciones y elige la más larga | misma nota, proporción 2:1 | Audio largo |

| 15 | build-rhythm · Elige figuras que igualan 1 blanca | 2 negras o 4 corcheas según set | Suma exacta de duración relativa |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# Módulo 4 — Silencios y prolongaciones

Objetivo de aprendizaje: Distinguir sonido/silencio y reconocer puntillo y ligadura de prolongación.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. El silencio ocupa tiempo

TEXTO EXACTO EN UI: «A veces no suena nada, pero el tiempo continúa.»

VISUAL VECTORIAL: Cuatro casillas en línea; 3.ª con silencio de negra dibujado.

INTERACCIÓN OBLIGATORIA: Reproducir negra, negra, silencio, negra con cursor que avanza aun en la pausa. Botón «Mostrar silencio».

MICROCOPY / CTA: «Escucha el espacio vacío».  |  Completar pantalla cuando: Escuchar y señalar la pausa.

### Pantalla 2. Alarga las notas

TEXTO EXACTO EN UI: «Un puntillo añade la mitad. La ligadura suma duraciones de notas de igual altura.»

VISUAL VECTORIAL: Barra de duración y dos diagramas: negra con puntillo / dos negras ligadas.

INTERACCIÓN OBLIGATORIA: Pestañas Normal / Puntillo / Ligadura; la barra se alarga y el audio demuestra 1, 1.5 y 2 unidades relativas.

MICROCOPY / CTA: «Toca para prolongar».  |  Completar pantalla cuando: Probar las tres variantes.

### Pantalla 3. Encuentra la pausa

TEXTO EXACTO EN UI: «Los silencios también tienen una duración.»

VISUAL VECTORIAL: Cuatro fichas y una casilla editable.

INTERACCIÓN OBLIGATORIA: Escuchar un patrón con silencio de negra; tocar casilla correcta y reemplazar figura por signo de silencio.

MICROCOPY / CTA: «¿Dónde está el silencio?»  |  Completar pantalla cuando: Identificar la posición audible.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | choice · Identifica el silencio de negra | símbolo correcto entre figuras y silencios | Silencio de negra |

| 02 | audio-choice · ¿En qué posición hubo una pausa? | 4 pasos, pausa aleatoria | Índice de pausa |

| 03 | highlight · Toca la pausa en la línea temporal | 4 casillas, silencio en una | Casilla sin evento de sonido |

| 04 | choice · ¿El silencio detiene el paso del tiempo? | verdadero/falso | No |

| 05 | audio-choice · Elige patrón de 4 con una pausa | 2 patrones de distinta posición | Patrón oído |

| 06 | choice · Reconoce puntillo en la figura | negra con/sin punto | Figura puntillada |

| 07 | choice · El puntillo añade ¿cuánto? | figura base aleatoria | La mitad de su duración |

| 08 | compare · ¿Qué dura más: negra o negra con puntillo? | mismos valores base | Negra con puntillo |

| 09 | choice · 1 negra con puntillo equivale a ¿cuántas corcheas? | negra puntillada fija | 3 |

| 10 | highlight · Reconoce ligadura de prolongación | dos notas misma altura vs sin arco | Notas unidas por arco |

| 11 | choice · ¿Qué hace la ligadura? | dos notas iguales ligadas | Suma sus duraciones |

| 12 | compare · Escucha negra vs dos negras ligadas | misma altura; tiempo 1 vs 2 | Duración ligada mayor |

| 13 | choice · ¿Puede unir alturas distintas para prolongación? | misma o distinta altura | No, deben tener misma altura |

| 14 | build-rhythm · Completa patrón con silencio de negra | 4/4, 3 negras y un silencio | Suma 4 unidades de negra |

| 15 | audio-choice · Escucha y distingue pausa frente a prolongación | patrones equivalentes en tiempo | Patrón con pausa correcta |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# Módulo 5 — Compases y métrica

Objetivo de aprendizaje: Agrupar pulsos y reconocer barras y compases 2/4, 3/4 y 4/4.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. Pulsos en grupos

TEXTO EXACTO EN UI: «Los pulsos pueden organizarse en grupos que se repiten.»

VISUAL VECTORIAL: Círculos de pulso agrupados en 2, 3 o 4; primero acentuado.

INTERACCIÓN OBLIGATORIA: Selector de agrupación con acentos y resaltado; escucha 2 grupos por ajuste.

MICROCOPY / CTA: «Escucha el primer pulso de cada grupo».  |  Completar pantalla cuando: Comparar dos agrupaciones.

### Pantalla 2. Barras de compás

TEXTO EXACTO EN UI: «Una barra vertical separa los compases.»

VISUAL VECTORIAL: Una línea rítmica con ocho negras y espacios para líneas divisorias.

INTERACCIÓN OBLIGATORIA: Botón «Agrupar de 4 en 4» inserta barra; cursor ilumina los bloques.

MICROCOPY / CTA: «Separa los grupos».  |  Completar pantalla cuando: Ver la barra y agrupación.

### Pantalla 3. 2/4, 3/4 y 4/4

TEXTO EXACTO EN UI: «Arriba: cuántas unidades. Abajo: qué figura vale una unidad. El 4 señala la negra.»

VISUAL VECTORIAL: Fracciones grandes 2/4, 3/4, 4/4 y figuras de negra en un compás.

INTERACCIÓN OBLIGATORIA: Cambiar selector; renderizar 2/3/4 negras; escuchar grupo y resaltar acento.

MICROCOPY / CTA: «¿Cuántas negras caben?»  |  Completar pantalla cuando: Explorar tres compases.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | audio-choice · Reconoce agrupación de 2 | acentos cada 2 vs cada 3 | Grupo de 2 |

| 02 | audio-choice · Reconoce agrupación de 3 | acentos cada 3 vs cada 4 | Grupo de 3 |

| 03 | audio-choice · Reconoce agrupación de 4 | acentos cada 4 vs cada 2 | Grupo de 4 |

| 04 | highlight · Toca el primer pulso acentuado | grupo 2–4, primer pulso visual | Primer pulso |

| 05 | choice · ¿Qué representa una barra de compás? | diagrama sencillo | Separación de compases |

| 06 | highlight · Coloca barra tras 2 negras | 4 negras, 2/4 | Separar cada 2 |

| 07 | highlight · Coloca barra tras 3 negras | 6 negras, 3/4 | Separar cada 3 |

| 08 | highlight · Coloca barra tras 4 negras | 8 negras, 4/4 | Separar cada 4 |

| 09 | choice · ¿Cuántas negras completan 2/4? | 2/4 | 2 |

| 10 | choice · ¿Cuántas negras completan 3/4? | 3/4 | 3 |

| 11 | choice · ¿Cuántas negras completan 4/4? | 4/4 | 4 |

| 12 | choice · ¿Qué significa el número inferior 4? | compás x/4 | Negra como unidad |

| 13 | build-rhythm · Completa compás 2/4 con negras | faltan 1–2 negras | Suma total 2 negras |

| 14 | build-rhythm · Completa compás 3/4 con negras | faltan 1–3 negras | Suma total 3 negras |

| 15 | audio-choice · Relaciona grupo acentuado con 2/4,3/4,4/4 | alternar agrupaciones audibles | Compás correspondiente (patrones de negras) |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# Módulo 6 — Lectura de charts rítmicos

Objetivo de aprendizaje: Leer, escuchar y completar patrones simples de una línea.

## A. Teoría interactiva · máximo 3 pantallas

### Pantalla 1. Del símbolo al sonido

TEXTO EXACTO EN UI: «Cada figura representa una duración dentro del ritmo.»

VISUAL VECTORIAL: Chart de una línea, cuatro negras y cursor de lectura.

INTERACCIÓN OBLIGATORIA: Botones «Reproducir» y «Mostrar conteo», resalta figuras de izquierda a derecha en 4/4.

MICROCOPY / CTA: «Sigue las figuras mientras suenan».  |  Completar pantalla cuando: Reproducir un chart.

### Pantalla 2. Cambia el patrón

TEXTO EXACTO EN UI: «Puedes combinar figuras y silencios sin cambiar la duración del compás.»

VISUAL VECTORIAL: Tres charts: 4 negras; negra-silencio-negra-negra; negra-2 corcheas-negra-negra.

INTERACCIÓN OBLIGATORIA: Selector A/B/C; reproducción específica para cada patrón y cursor sincronizado.

MICROCOPY / CTA: «Prueba otro ritmo».  |  Completar pantalla cuando: Escuchar al menos dos patrones.

### Pantalla 3. Mi primer chart

TEXTO EXACTO EN UI: «Escucha y elige el patrón que corresponde.»

VISUAL VECTORIAL: Tres tarjetas de charts 4/4.

INTERACCIÓN OBLIGATORIA: Reproducir patrón de 2 negras, silencio, negra; elegir representación correcta; feedback inmediato y repetir.

MICROCOPY / CTA: «¿Cuál escuchaste?»  |  Completar pantalla cuando: Acierto guiado o corrección + reintento.

## B. Práctica · 15 ejercicios por intento

| # | Mecánica / reto | Parámetros variables | Respuesta / validación |
| --- | --- | --- | --- |

| 01 | audio-choice · Escucha cuatro negras y escoge chart | 4/4 vs 4/4 con silencio | 4 negras |

| 02 | audio-choice · Escucha silencio en segundo tiempo | patrón ♩ silencio ♩ ♩ | Chart con pausa en 2 |

| 03 | audio-choice · Escucha silencio en tercer tiempo | patrón ♩ ♩ silencio ♩ | Chart con pausa en 3 |

| 04 | highlight · Señala figura que suena ahora | cursor en 4 negras | Figura activa |

| 05 | choice · Identifica chart de cuatro negras | 3 opciones | 4 negras |

| 06 | choice · Identifica chart con dos corcheas | 3 opciones, 4/4 | Chart con par de corcheas |

| 07 | build-rhythm · Completa 4/4 con una negra faltante | 3 negras colocadas | 1 negra |

| 08 | build-rhythm · Completa 4/4 con silencio de negra | 3 negras colocadas | Silencio de negra |

| 09 | build-rhythm · Sustituye una negra por dos corcheas | chart 4/4 | Conserva duración |

| 10 | compare · ¿Estos dos charts duran igual? | 4 negras vs 2 blancas | Sí |

| 11 | audio-choice · Compara negra sostenida vs dos corcheas | audio 4/4 con subdivisión | Chart con dos corcheas |

| 12 | sequence · Ordena fichas para chart escuchado | 4 eventos simples, evitar ambigüedad de posiciones | Secuencia correcta |

| 13 | highlight · Ubica el silencio al escuchar chart | pausa en tiempo 1–4 | Índice correcto |

| 14 | build-rhythm · Corrige compás incompleto | 4/4 con total 3 o 3.5 unidades | Agregar figura de valor restante |

| 15 | audio-choice · Lee y reconoce chart combinado | 4/4 con negras, 2 corcheas y silencio | Chart que coincide con audio |



Corrección: respuesta breve y específica del concepto. En ejercicios auditivos, reproducir ejemplo nuevamente tras error; en secuencias, resaltar la posición que rompió el orden. No introducir conceptos que aún no aparecieron en la teoría.

# 6. Diseño de datos y componentes propuestos

Son nombres orientativos: Claude debe adaptar a la arquitectura real después de inspeccionarla.

| Componente / servicio | Responsabilidad |
| --- | --- |

| StagePath / ModuleNode | Dibujar ruta, nodos circulares, bloqueo, progreso y selección. |

| ModuleActionCard | Abrir desde nodo; botones Teoría / Practicar y estados independientes. |

| TheoryPlayer / TheoryScreen | Navegación de 1–3 pantallas, interacción cumplida y avance. |

| PracticeSession / ExerciseRenderer | Reproducir 15 instancias, respuestas, feedback, reintentos y resumen. |

| MusicGlyph / RhythmLine / BeatVisualizer | Símbolos y partitura rítmica vectorial reutilizable. |

| AudioEngine / MetronomeEngine | Sonidos/temporización de patrones, cancelación y replays. |

| ExerciseGenerator / Validator | Semilla, variación restringida, respuesta correcta y tests. |

| ProgressRepository | Guardar progreso, sesiones, puntuaciones y reanudación. |



# 6.1 Modelo de progreso mínimo

ModuleProgress: { moduleId, theory: { completed, visitedScreenIds, interactionDoneIds, completedAt }, practice: { completed, bestScore, lastScore, attempts, completedAt }, unlockedAt }. PracticeSession: { sessionId, moduleId, seed, exerciseInstances[15], currentIndex, answers[], startedAt, finishedAt?, result? }. Persistir con mecanismo existente de la app; migración compatible hacia adelante.

# 6.2 Generación robusta

- Generar primero la respuesta correcta, después distractores distintos, y por último mezclar las opciones de manera reproducible.

- Un ejercicio aleatorio NO puede generar más de una respuesta correcta; validar pools, registros, octavas y transiciones circulares.

- En actividades con sonido, el estímulo y el tiempo deben derivarse de la misma instancia y no de estados visuales independientes.

- Normalizar duración con unidades enteras: semicorchea=1, corchea=2, negra=4, blanca=8, redonda=16; puntillos suman 50 % si el valor lo permite. Esto evita errores de punto flotante.

- Para patrones 4/4, total=16 unidades; para 3/4, total=12; para 2/4, total=8. El silencio conserva duración aunque no genere nota.

- Tap-sync: medir respecto del inicio real del audio, considerar latencia/hardware y accesibilidad; no exigir precisión imposible ni penalizar por glitches.

- Separar “orden de nombre de notas” y “altura sonora real”: DO–RE–MI–FA–SOL–LA–SI puede reproducirse con notas naturales en octava definida; no confundir octava con repetir una misma muestra sin cambio de altura.

# 7. Criterios de aceptación (Definition of Done)

- Existen exactamente 6 nodos de módulo para Etapa 1, con estados bloqueado, disponible, parcial y completado.

- Tocar cada nodo abre una card con las DOS acciones y estados independientes.

- Cada teoría contiene máximo 3 pantallas; todas tienen interacción significativa, textos breves y representaciones vectoriales.

- Cada práctica genera exactamente 15 ejercicios con validación, feedback y resultado final; contenidos y dificultades respetan el módulo.

- Terminar teoría sola NO colorea el módulo como completado; completar ambas secciones SÍ lo hace, y el progreso persiste tras cerrar la app.

- Repetir teoría o práctica no elimina avances ni bloquea contenidos ya completados.

- Preguntas aleatorias admiten semillas reproducibles; reanudar intento mantiene las mismas preguntas.

- Todos los diagramas, figuras, metrónomo, gráficos y notas se dibujan con primitivas de React Native/SVG, sin assets de imagen importados.

- Audio funciona o muestra error controlado; cancelar/reanudar no deja metrónomos sonando en segundo plano.

- Tests unitarios: equivalencias, compases, octavas/nombres, unicidad de respuestas, sesiones 15/15, progreso y persistencia.

- Pruebas manuales Android/iOS: pantallas pequeñas, lector de pantalla, Reduce Motion, interrupción telefónica y app en background.

# 8. Orden recomendado de implementación

1. Inspeccionar app y roadmap; documentar estructura existente y puntos de integración.

1. Construir contrato de datos, progreso y ruta con cards de dos botones; conectar persistencia.

1. Construir sistema vectorial/audio común y plantillas genéricas de teoría y práctica.

1. Implementar módulos 1–2; verificar sonidos, tap-sync, estado y navegación.

1. Implementar módulos 3–4; verificar valores relativos, puntillos, ligaduras y silencios.

1. Implementar módulos 5–6; verificar compases y suma exacta de duraciones.

1. Probar todas las 90 posiciones, variaciones aleatorias, regreso/reanudación y progresión completa.

# 9. Límites pedagógicos y referencias

Este documento define la Etapa 1 según roadmap.md del proyecto. Prioriza escucha y teoría mínima, no técnica instrumental. El módulo 6 usa lectura rítmica sencilla; lectura de notas en pentagrama y claves queda para la Etapa 2. Referencias bibliográficas para revisión musical: Open Music Theory (openmusictheory.github.io / viva.pressbooks.pub/openmusictheory), capítulo de valores rítmicos y notación; LibreTexts Music Theory, apartados de pulso, tempo y métrica. Confirmar exactitud terminológica durante QA.

Instrucción final a Claude Code: No implementar todos los módulos posteriores. Si falta una capacidad técnica del proyecto, proponer una solución compatible y probarla; evitar introducir assets rasterizados como atajo. Entregar por incrementos revisables y no dar por finalizada una pantalla hasta validar interacción, feedback, audio y persistencia.
