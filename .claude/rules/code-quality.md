# Calidad de código — anti-espagueti

## Componentes

- Un componente = una responsabilidad. Si una pantalla pasa de ~150 líneas o
  mezcla varias preocupaciones, extraer subcomponentes.
- Las pantallas (`features/*/screens/`) solo **componen**: layout + wiring de
  hooks. La lógica vive en hooks (`features/*/hooks/`) y en `domain/`.
- Nada de lógica de negocio (fórmulas, cálculos musicales, decisiones de
  dominio) dentro de componentes ni hooks: eso pertenece a `domain/`.
- Un componente que se repite (o se prevé usar) en 2+ features se extrae a
  `shared/design-system/`. Antes de crear un botón/texto/card nuevo, revisar
  si ya existe uno en el design system.
- Props tipadas con `interface`, sin `any`. Preferir props explícitas sobre
  objetos "bolsa de todo".

## Estilos

- `StyleSheet.create` + tokens de `shared/theme/` (colores, espaciados,
  tipografía, radios). **Nunca** valores hardcodeados (`#fff`, `16`) en
  componentes: si falta un token, se agrega al theme.
- Sin frameworks de estilos (ni NativeWind ni similares).

## Estado

- Estado local (`useState`) primero. Zustand solo cuando un estado deba
  cruzar entre features o sobrevivir a la navegación — instalar recién cuando
  se use la primera vez.
- Evitar prop drilling de más de 2 niveles: señal de que falta un hook o un
  store.

## TypeScript

- Modo `strict` siempre. Prohibido `any`; `as` solo con un comentario que
  justifique por qué es seguro.
- Preferir `readonly` en estructuras del dominio y tipos de unión literal
  (`ScaleType`) sobre strings sueltos.

## Principios generales

- Funciones puras en `domain/`: sin efectos secundarios, sin estado mutable.
- YAGNI: no crear abstracciones, opciones ni configuraciones "para el futuro".
  Se abstrae cuando hay 2+ usos reales, no antes.
- DRY con criterio: duplicar dos líneas es mejor que una abstracción
  incorrecta.
- Comentarios solo donde la lógica (musical o no) no sea obvia; el código se
  explica solo con buenos nombres.
- Nombres de archivo: `PascalCase.tsx` para componentes, `camelCase.ts` para
  lógica.
