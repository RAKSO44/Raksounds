<!--
  Documento fuente del roadmap pedagógico (Home). Es contexto, no una
  especificación cerrada: las decisiones tomadas módulo a módulo prevalecen.
  Reglas operativas para Claude: .claude/rules/roadmap.md
-->

# Documento de contexto — Aplicación de aprendizaje musical

## 1. Visión general del proyecto

Quiero desarrollar una aplicación educativa para aprender música desde cero, tomando como principal referencia la experiencia de aprendizaje de **Duolingo**.

El objetivo es que una persona sin conocimientos musicales pueda aprender progresivamente a comprender la música, desarrollar su oído musical y adquirir los conocimientos necesarios para interpretar conceptos musicales básicos y leer un chart rítmico sencillo.

La aplicación no debe sentirse como un curso tradicional de música, un libro de teoría o una plataforma de exámenes. Debe ser una experiencia de aprendizaje interactiva, progresiva y práctica.

La idea central es:

**Explicar un concepto pequeño → practicarlo repetidamente → reforzarlo → avanzar al siguiente concepto.**

El usuario no debería necesitar conocimientos previos para comenzar.

## 2. Objetivos de aprendizaje

La aplicación tendrá tres objetivos principales:

1. **Entrenamiento auditivo:** desarrollar progresivamente la capacidad de reconocer y diferenciar elementos musicales mediante la escucha.
2. **Comprensión musical:** entender los conceptos fundamentales de la música, como notas, intervalos, escalas, acordes y armonía.
3. **Lectura musical básica:** aprender a interpretar elementos de notación musical y leer charts rítmicos sencillos.

El entrenamiento auditivo debe estar presente a lo largo de todo el recorrido. No quiero que sea un apartado aislado que se enseñe únicamente al final.

### Lo que NO busca enseñar la aplicación

- Física o acústica del sonido.
- Anatomía o técnica vocal.
- Cómo cantar o utilizar correctamente la voz.
- Técnica de instrumentos musicales.
- Cómo aprender a tocar piano, guitarra u otro instrumento.

Se pueden utilizar recursos visuales como un teclado musical para explicar notas, distancias o acordes, pero únicamente como herramientas didácticas. La aplicación no debe convertirse en un curso para aprender a tocar un instrumento.

## 3. Metodología de aprendizaje

La metodología estará inspirada en Duolingo.

### 3.1. Aprendizaje mediante microlecciones

Cada módulo estará dividido en lecciones pequeñas.

Una lección no debe intentar enseñar demasiadas cosas al mismo tiempo. Como referencia:

- Introducir entre 1 y 3 conceptos nuevos.
- Preferiblemente trabajar con 1 o 2 conceptos por lección.
- Explicar únicamente lo necesario para comprenderlos.
- Pasar rápidamente a la práctica.

La explicación teórica será breve. No quiero páginas extensas de contenido. Como referencia, una lección puede tener una o dos páginas de explicación antes de comenzar los ejercicios.

La definición visual y el diseño final de estas explicaciones se decidirán posteriormente.

### 3.2. Estructura de una microlección

La estructura general será:

1. **Explicación:** presentación del concepto musical.
2. **Ejemplo:** demostración visual o auditiva del concepto.
3. **Práctica:** aproximadamente 15 ejercicios cortos.
4. **Refuerzo:** consolidación del concepto mediante variaciones de los ejercicios.

Las 15 preguntas son una referencia inicial, no una cantidad obligatoria e inamovible.

### 3.3. Repetición y variedad controlada

Este es uno de los principios más importantes del proyecto.

No quiero que una lección se convierta en un examen compuesto por muchas preguntas diferentes que evalúen conocimientos distintos.

Por ejemplo, si una lección enseña qué es un semitono, los ejercicios deben concentrarse en reconocer semitonos.

Una posible distribución sería:

- Preguntas 1–4: reconocer el mismo concepto mediante ejemplos sencillos.
- Preguntas 5–8: repetir la misma mecánica utilizando notas diferentes.
- Preguntas 9–12: introducir pequeñas variaciones que refuercen la comprensión.
- Preguntas 13–15: consolidar lo aprendido con ejemplos ligeramente más exigentes.

La mecánica principal debe mantenerse estable durante la lección.

La variación debe servir para reforzar el aprendizaje, no para introducir conceptos nuevos sin explicación.

### 3.4. Dificultad progresiva

La dificultad debe aumentar gradualmente.

Por ejemplo:

- Primero, reconocer un concepto con ejemplos muy evidentes.
- Después, reconocerlo con ejemplos diferentes.
- Finalmente, resolver casos un poco menos evidentes.

No se debe saltar de un concepto básico a otro considerablemente más avanzado dentro de la misma lección.

### 3.5. Retroalimentación inmediata

Cada ejercicio debe permitir que el usuario sepa si respondió correctamente.

Cuando se equivoque, la aplicación debe ofrecer una corrección breve y útil. La intención es que el usuario comprenda el error y continúe practicando.

### 3.6. Entrenamiento auditivo

El oído musical debe desarrollarse desde las primeras etapas.

La progresión debe comenzar con ejercicios sencillos, por ejemplo:

- Diferenciar sonidos iguales y diferentes.
- Reconocer cuál de dos notas es más aguda o más grave.
- Comparar notas utilizando referencias auditivas.
- Reconocer distancias entre notas.
- Identificar patrones y elementos musicales mediante la escucha.

No se debe exigir oído absoluto. Se puede utilizar una nota de referencia generada por la aplicación para desarrollar el oído relativo.

### 3.7. Ejercicios de canto (pendiente de definir)

Los módulos marcados con **Canto (candidato)** son los que conviene que
tengan algún ejercicio de voz. El formato concreto se decide al llegar a
cada módulo. Mientras tanto, la intención es:

- **Opcionales**, como los ejercicios de voz de Duolingo, que se pueden
  activar o desactivar. Cómo se activan está por decidir.
- **Fáciles y sin frustración.** Siempre con un sonido de referencia, pocas
  notas, tolerancia generosa y sin importar la octava. La práctica exigente
  ya existe en la sección Ejercicios, con sus niveles; en el Home el canto
  confirma lo aprendido, no lo examina.
- Progresión dentro de la ruta: unísono → un paso → fragmentos de escala →
  intervalos fáciles → arpegios.
- No llevan canto los módulos de ritmo (2–6), que ya se practican con toques,
  ni los de notación, teoría pura o demasiado exigentes para cantar al
  empezar (7, 9, 14, 15, 16, 18, 20, 21, 23, 24, 25).

| Módulo | Ejercicio de canto candidato |
|---|---|
| 1. Las notas musicales | Cantar la nota que suena (unísono) |
| 8. Tonos y semitonos | Unísono y subir un tono desde la referencia |
| 10. Escalas mayores | Do‑Re‑Mi → cinco notas → escala completa |
| 11. Grados de la escala | Volver a la tónica; cantar los grados 1, 3 y 5 |
| 12. Intervalos | Octava, 5.ª justa y 3.ª mayor desde una nota |
| 13. Escala menor natural | Tres primeras notas en mayor y en menor |
| 17. Acordes mayores y menores | Cantar la fundamental y luego la 3.ª de un acorde |
| 19. Arpegios | Arpegio 1‑3‑5 mayor, luego menor |
| 22. Funciones armónicas | Cantar la tónica a la que resuelve la dominante |

## 4. Organización general del contenido

El contenido estará dividido en etapas y módulos. El siguiente orden es la estructura general del recorrido educativo.

Los módulos representan temas principales. No significa que cada uno deba desarrollarse en una sola lección. Cada módulo podrá dividirse en tantas microlecciones como sean necesarias.

**Cambios de orden (2026-11-19):**
- La escala mayor (ahora Módulo 10) y los grados (11) pasan antes que los
  intervalos (12): así la calidad de un intervalo se mide desde la tónica.
- Las menores armónica y melódica salen de la Etapa 3 y van a la Etapa 5
  (Módulo 23), detrás de las funciones armónicas.
- El círculo de quintas se separa de tonalidades y armaduras (Módulo 15).
- El resultado son 25 módulos en lugar de 23.

**Ritmo y altura son ramas independientes.** Los módulos de ritmo (2–6) no
son prerrequisito de ningún módulo de altura, y viceversa.

**Regla: los módulos de altura no dependen del pentagrama.** Desde el
Módulo 8 en adelante (tonos, alteraciones, escalas, grados, intervalos,
acordes y arpegios) el visual principal es el **teclado**. El pentagrama
(Módulo 7) puede aparecer como apoyo, pero ninguna explicación ni ejercicio
de esos módulos puede exigir saber leerlo. Así el Módulo 7 se puede saltar
sin perderse. El becuadro (Módulo 9) es un signo de partitura: se presenta
de forma ligera, sin depender del Módulo 7.

**Ruta recomendada para canto.** Un alumno que viene a cantar escalas y
arpegios puede seguir este camino sin confundirse:

1. **Imprescindible:** 1 Notas → 8 Tonos y semitonos → 9 Alteraciones →
   10 Escalas mayores.
2. **Muy recomendado:** 11 Grados → 12 Intervalos → 13 Escala menor natural.
3. **Para arpegios:** 16 Construcción de acordes → 17 Acordes mayores y
   menores → 19 Arpegios.

Se pueden saltar sin problema 2–6 (ritmo), 7 (pentagrama) y 14–15
(armaduras y círculo de quintas). Las Etapas 4 y 5 completas quedan para
quien quiera entender armonía.

# Etapa 1 — Reconocimiento musical y ritmo

El objetivo es familiarizar al usuario con los elementos musicales más básicos y comenzar a desarrollar su comprensión rítmica.

### Módulo 1. Las notas musicales
- Las siete notas musicales.
- Orden ascendente y descendente.
- Repetición de las notas.
- Octavas.

**Ejercicios propuestos:**
- Ordenar notas musicales.
- Identificar la nota siguiente o anterior.
- Reconocer secuencias de notas.
- Diferenciar notas que pertenecen a distintas octavas.

**Canto (candidato, a revisar sobre lo ya construido):** escuchar una nota y
cantarla (unísono). Es el ejercicio de voz más sencillo posible y sirve de
primer contacto con el micrófono.

### Módulo 2. Pulso y tempo
- Qué es el pulso musical.
- Qué es el tempo.
- BPM.
- Diferencias entre lento, moderado y rápido.

**Ejercicios propuestos:**
- Identificar pulsos mediante audio.
- Reconocer si un pulso es más rápido o lento que otro.
- Seguir un pulso constante.
- Identificar tempos aproximados.

### Módulo 3. Figuras musicales
- Redonda.
- Blanca.
- Negra.
- Corchea.
- Semicorchea.
- Relación entre las duraciones.

**Ejercicios propuestos:**
- Reconocer figuras musicales.
- Comparar la duración de dos figuras.
- Identificar equivalencias rítmicas.
- Escuchar y reconocer patrones de figuras.

### Módulo 4. Silencios y prolongaciones
- Silencios musicales.
- Puntillo.
- Ligadura.
- Relación entre duración y silencio.

**Ejercicios propuestos:**
- Reconocer silencios.
- Identificar la duración de figuras con puntillo.
- Diferenciar figuras ligadas de figuras separadas.
- Completar patrones rítmicos sencillos.

### Módulo 5. Compases y métrica
- Qué es un compás.
- Barras de compás.
- Numerador y denominador.
- Compases 2/4, 3/4 y 4/4.

**Ejercicios propuestos:**
- Contar pulsos.
- Identificar la cantidad de pulsos de un compás.
- Reconocer compases visualmente.
- Diferenciar patrones según su métrica.

### Módulo 6. Lectura de charts rítmicos
- Representación de patrones rítmicos.
- Agrupación de figuras.
- Lectura de patrones básicos.
- Relación entre notación y ejecución rítmica.

**Ejercicios propuestos:**
- Leer patrones rítmicos sencillos.
- Escuchar un patrón y seleccionar su representación.
- Identificar errores en un chart.
- Completar patrones incompletos.
- Asociar notación con audio.

# Etapa 2 — Comprensión de notas y distancias

El objetivo es comprender cómo se representan las notas y cómo se relacionan entre sí.

### Módulo 7. Pentagrama y claves
- Líneas y espacios.
- Notas en el pentagrama.
- Clave de Sol.
- Introducción opcional a la clave de Fa.

**Ejercicios propuestos:**
- Identificar notas en líneas y espacios.
- Reconocer notas en el pentagrama.
- Completar secuencias.
- Relacionar representaciones con nombres de notas.

### Módulo 8. Tonos y semitonos
- Qué es un tono.
- Qué es un semitono.
- Distancias entre notas.
- Representación en un teclado musical.

**Ejercicios propuestos:**
- Identificar semitonos.
- Identificar tonos.
- Comparar distancias.
- Reconocer tonos y semitonos mediante audio.
- Seleccionar la nota que se encuentra a una distancia determinada.

**Teclas negras:** se nombran todas como **sostenido** (Do#, Re#, Fa#…) sin
explicar todavía qué es una alteración, igual que el Módulo 1 usa "octava" sin
explicar qué es un intervalo. Basta con algo como "la tecla negra entre Do y
Re se llama Do#; en el siguiente módulo verás por qué". Los bemoles no
aparecen hasta el Módulo 9.

**Canto (candidato):** cantar la nota de referencia (unísono) y, después,
subir un tono desde ella.

### Módulo 9. Alteraciones musicales
- Sostenido.
- Bemol.
- Becuadro.
- Modificación de la altura de una nota.
- Enarmonías: una misma tecla con dos nombres (Do# = Reb, Mi# = Fa).

**Ejercicios propuestos:**
- Identificar alteraciones.
- Reconocer notas alteradas.
- Comparar notas naturales y alteradas.
- Identificar cambios de altura mediante audio.
- Dar el otro nombre de una tecla (Do# ↔ Reb).

Aquí se cierra lo que dejó abierto el Módulo 8: las teclas negras que se
llamaron "sostenido" también tienen nombre de bemol. Las enarmonías son
prerrequisito del Módulo 10, donde el nombre correcto depende de la escala.

# Etapa 3 — Escalas, intervalos y tonalidades

El objetivo es comprender cómo se organizan las notas dentro de una escala, medir las distancias entre ellas y cómo se relacionan las tonalidades.

### Módulo 10. Escalas mayores
- Qué es una escala.
- Fórmula de tonos y semitonos (T‑T‑S‑T‑T‑T‑S).
- Construcción de Do mayor.
- Construcción de otras escalas mayores.
- Una letra por nota: cada nombre aparece una sola vez (Fa mayor lleva Sib, no La#).

**Ejercicios propuestos:**
- Ordenar notas de una escala.
- Identificar patrones de tonos y semitonos.
- Completar escalas.
- Reconocer escalas mediante audio.
- Elegir el nombre correcto de una nota alterada dentro de una escala.

Enlace con lo anterior: las siete notas del Módulo 1 **son** la escala de Do
mayor, y sus semitonos (Mi‑Fa y Si‑Do) son los que el Módulo 8 enseñó con
teclas blancas. La fórmula explica por qué suenan así.

**Canto (candidato):** cantar Do‑Re‑Mi con guía, luego cinco notas, luego la
escala completa.

### Módulo 11. Grados de la escala
- Qué son los grados.
- Grados I al VII.
- Tónica.
- Función básica de cada grado.
- Introducción al solfeo relativo.

**Ejercicios propuestos:**
- Identificar grados.
- Reconocer la tónica.
- Completar secuencias.
- Identificar grados mediante referencias auditivas.

**Canto (candidato):** volver a la tónica tras escuchar un fragmento; cantar
los grados 1, 3 y 5.

### Módulo 12. Intervalos
- Qué es un intervalo.
- Distancia entre dos notas.
- Intervalos desde segunda hasta octava.
- Intervalos mayores, menores y justos.
- Introducción a su reconocimiento auditivo.

**Ejercicios propuestos:**
- Identificar intervalos visualmente.
- Contar distancias entre notas.
- Comparar intervalos.
- Reconocer intervalos sencillos mediante audio.

Va después de la escala mayor y los grados porque la calidad se entiende
midiendo desde la tónica: de la tónica a cada grado de la escala mayor hay
una 2.ª mayor, 3.ª mayor, 4.ª justa, 5.ª justa, 6.ª mayor, 7.ª mayor y la
octava (ya vista en el Módulo 1). Un intervalo menor es un semitono más
pequeño que el mayor. Así no hay que memorizar tablas de semitonos.

**Canto (candidato):** cantar intervalos fáciles desde una nota dada: octava,
5.ª justa y 3.ª mayor primero.

### Módulo 13. Escala menor natural
- Escala menor natural.
- Su fórmula de tonos y semitonos.
- Diferencia de sonoridad con la mayor (3.ª, 6.ª y 7.ª más bajas).
- Relación entre escalas mayores y menores: las mismas notas empezando en el VI grado.

**Ejercicios propuestos:**
- Diferenciar escalas mayores y menores.
- Identificar sus patrones.
- Completar escalas.
- Reconocer diferencias mediante audio.

Las menores armónica y melódica se ven en la Etapa 5 (Módulo 23), cuando ya
se conoce la función de dominante que las justifica.

**Canto (candidato):** cantar las tres primeras notas en mayor y en menor
para contrastar la 3.ª.

### Módulo 14. Tonalidades y armaduras
- Qué es una tonalidad.
- Armaduras.
- Tonalidades mayores y menores.
- Tonalidades relativas.

**Ejercicios propuestos:**
- Reconocer armaduras.
- Relacionar tonalidades mayores y menores.
- Identificar tonalidades.

### Módulo 15. Círculo de quintas
- Qué es el círculo de quintas.
- Orden de sostenidos y bemoles.
- Tonalidades vecinas.
- Relativas menores dentro del círculo.

**Ejercicios propuestos:**
- Completar relaciones del círculo de quintas.
- Deducir la armadura de una tonalidad por su posición.
- Identificar tonalidades vecinas.

# Etapa 4 — Acordes y arpegios

El objetivo es comprender cómo se construyen los acordes y cómo se relacionan sus notas.

### Módulo 16. Construcción de acordes
- Qué es un acorde.
- Fundamental.
- Construcción por terceras.
- Tríadas.

**Ejercicios propuestos:**
- Identificar las notas de un acorde.
- Construir tríadas.
- Ordenar notas.
- Reconocer acordes visualmente.

### Módulo 17. Acordes mayores y menores
- Estructura de acordes mayores.
- Estructura de acordes menores.
- Diferencias entre ambos.
- Reconocimiento auditivo.

**Ejercicios propuestos:**
- Diferenciar acordes mayores y menores.
- Construir acordes.
- Identificar sus notas.
- Reconocer diferencias mediante audio.

**Canto (candidato):** escuchar un acorde y cantar su fundamental; después,
su 3.ª.

### Módulo 18. Acordes disminuidos y aumentados
- Estructura de acordes disminuidos.
- Estructura de acordes aumentados.
- Diferencias respecto a las tríadas mayores y menores.

**Ejercicios propuestos:**
- Reconocer estructuras.
- Comparar tipos de acordes.
- Construir acordes.
- Diferenciarlos auditivamente.

### Módulo 19. Arpegios
- Qué es un arpegio.
- Relación entre acordes y arpegios.
- Arpegios mayores y menores.

**Ejercicios propuestos:**
- Identificar notas de un arpegio.
- Relacionar arpegios con acordes.
- Reconocer patrones ascendentes y descendentes.
- Identificar arpegios mediante audio.

**Canto (candidato, muy recomendado):** cantar el arpegio mayor 1‑3‑5 con
guía; después sin guía y en menor.

### Módulo 20. Inversiones
- Posición fundamental.
- Primera inversión.
- Segunda inversión.
- Relación entre inversiones y estructura de acordes.

**Ejercicios propuestos:**
- Identificar inversiones.
- Ordenar notas de acordes.
- Diferenciar posición fundamental e inversiones.
- Reconocer inversiones visualmente y mediante audio.

# Etapa 5 — Armonía

El objetivo es comprender cómo se relacionan los acordes dentro de una tonalidad y cómo se construyen progresiones armónicas.

### Módulo 21. Acordes diatónicos
- Qué son los acordes diatónicos.
- Construcción de acordes dentro de una escala.
- Relación entre escalas y acordes.

**Ejercicios propuestos:**
- Identificar acordes de una tonalidad.
- Construir acordes diatónicos.
- Reconocer relaciones entre grados y acordes.

### Módulo 22. Funciones armónicas
- Tónica.
- Subdominante.
- Dominante.
- Función de los acordes dentro de una tonalidad.

**Ejercicios propuestos:**
- Clasificar acordes por función.
- Identificar funciones armónicas.
- Reconocer relaciones mediante audio.

**Canto (candidato):** tras escuchar el acorde de dominante, cantar la tónica
a la que resuelve.

### Módulo 23. Escalas menores armónica y melódica
- La sensible: por qué la menor natural no "empuja" hacia la tónica.
- Escala menor armónica (7.º grado elevado) y el acorde de dominante en menor.
- Escala menor melódica: suaviza el salto de tono y medio de la armónica.
- Comparación de las tres menores.

**Ejercicios propuestos:**
- Diferenciar las tres menores mediante audio.
- Completar escalas.
- Identificar el grado alterado.

Va aquí y no en la Etapa 3 porque su razón de ser es armónica: la sensible
existe para que el acorde de dominante (Módulo 22) sea mayor también en
menor.

### Módulo 24. Progresiones armónicas
- Qué es una progresión.
- Progresiones I–IV–V.
- Progresiones I–V–vi–IV.
- Relación entre acordes y tonalidad.

**Ejercicios propuestos:**
- Ordenar acordes de una progresión.
- Identificar progresiones.
- Reconocer patrones mediante audio.
- Completar progresiones incompletas.

### Módulo 25. Círculos armónicos
- Qué es un círculo armónico.
- Progresiones recurrentes.
- Relación entre acordes y círculo de quintas.
- Diferencia entre círculo armónico y círculo de quintas.

**Ejercicios propuestos:**
- Identificar patrones recurrentes.
- Completar círculos armónicos.
- Reconocer progresiones.
- Relacionar acordes con tonalidades.

---

## 5. Principios que deben respetarse durante el desarrollo

Estos principios son requisitos del proyecto y deben tenerse presentes al implementar cualquier módulo.

1. **No sobrecargar las lecciones:** introducir pocos conceptos nuevos a la vez.
2. **Priorizar la práctica:** la explicación debe ser breve y los ejercicios deben ocupar una parte importante de la experiencia.
3. **Repetir antes de avanzar:** el usuario debe practicar suficientemente un concepto antes de pasar al siguiente.
4. **Evitar ejercicios innecesariamente variados:** no convertir cada lección en una colección de pruebas diferentes.
5. **Mantener una dificultad gradual:** no introducir conocimientos que todavía no se han enseñado.
6. **Integrar el entrenamiento auditivo:** utilizar audio de forma progresiva a lo largo del recorrido.
7. **Respetar los prerrequisitos:** los conceptos deben enseñarse en un orden lógico.
8. **No enseñar instrumentos:** los recursos visuales de instrumentos son herramientas para explicar música, no objetivos de aprendizaje.
9. **Mantener una experiencia similar a Duolingo:** sesiones cortas, objetivos claros, práctica frecuente y retroalimentación inmediata.
10. **No definir anticipadamente todo el contenido:** las explicaciones y los ejercicios concretos se diseñarán y revisarán módulo por módulo.

## 6. Forma de trabajo y desarrollo progresivo

No se pretende desarrollar todos los módulos de una sola vez.

El proyecto se construirá progresivamente, trabajando un módulo o una parte de un módulo a la vez.

El flujo de trabajo será:

1. Seleccionar el módulo que se va a desarrollar.
2. Definir sus conceptos y prerrequisitos.
3. Dividirlo en microlecciones.
4. Diseñar la explicación de cada microlección.
5. Definir los ejercicios repetitivos correspondientes.
6. Implementar la experiencia en la aplicación.
7. Probar la progresión, las respuestas y la retroalimentación.
8. Revisar y ajustar antes de continuar.

Cada módulo debe poder desarrollarse y probarse sin necesidad de que todos los módulos posteriores estén implementados.

### Actualización del contexto

Este documento funciona como contexto general del proyecto, no como una especificación inmutable.

A medida que se avance:

- Se podrán modificar módulos y microlecciones.
- Se podrán agregar o quitar ejercicios.
- Se podrán definir nuevas reglas de aprendizaje.
- Se podrán documentar decisiones técnicas y de diseño.
- Se podrán actualizar los módulos que ya hayan sido desarrollados.

Las decisiones específicas que se definan durante el desarrollo deben prevalecer sobre las propuestas generales de este documento cuando exista alguna diferencia.

---

## 7. Instrucciones para Claude Code

Utiliza este documento como contexto pedagógico y funcional del proyecto.

Antes de implementar una funcionalidad relacionada con el aprendizaje, ten presentes los objetivos, la metodología y las restricciones descritas aquí.

**Importante:**

- No desarrolles todos los módulos de forma automática.
- No inventes contenido educativo para módulos que todavía no se están trabajando.
- No asumas que la lista de ejercicios propuesta es definitiva.
- No introduzcas mecánicas nuevas sin una justificación pedagógica.
- No confundas un módulo con una microlección.
- No conviertas las microlecciones en exámenes.
- No avances a conceptos que dependan de conocimientos todavía no enseñados.

Cuando se trabaje un módulo, concéntrate únicamente en el alcance que se haya solicitado.

Si falta definir una decisión pedagógica importante, consúltala antes de asumirla.

El objetivo es construir una aplicación de aprendizaje musical coherente, modular y progresiva, que realmente enseñe música mediante práctica constante y no solamente presente información teórica.
