---
name: crear-sql-supabase
description: Diseñar, crear, modificar o revisar objetos de la base de datos de Raksound en Supabase (tablas, funciones de la API, políticas RLS, triggers, migraciones, Edge Functions que tocan datos) siguiendo las convenciones de .claude/rules/base-de-datos.md. Úsala SIEMPRE antes de escribir cualquier SQL que cree o cambie algo, y al revisar SQL ya escrito.
---

# Crear objetos SQL en Supabase — Raksound

Las convenciones viven en `.claude/rules/base-de-datos.md`: **léelas enteras antes de
empezar**, cada vez. Esta skill es el flujo para aplicarlas, las plantillas
(`plantillas.sql`) y el checklist final. Ante una duda, gana la regla escrita; si una
regla no encaja con el caso, se le dice al usuario cuál y por qué **antes** de
romperla.

El usuario viene de SQL Server: explica las diferencias de Postgres en palabras
simples y marca lo riesgoso.

## Flujo obligatorio

### 1. Entender qué se pide

Qué objeto, en qué esquema de área vive, quién lo consume en la app (`src/`) y si es
lectura o escritura. Recordar el alcance del MVP (`CLAUDE.md`): si la tarea abre
persistencia, confirmar que el usuario lo pidió.

### 2. Inspeccionar la base real (MCP `supabase`, solo lectura)

Nunca diseñar de memoria. Con `list_tables`, `list_migrations` y `execute_sql`
(`SELECT` sobre `information_schema` / `pg_catalog`):

- ¿Ya existe el objeto o uno que haga lo mismo? (reutilizar antes de crear;
  unificar tablas equivalentes)
- Nombres, tipos y nulabilidad exactos de las columnas y PK referenciadas.
- Índices, políticas RLS y permisos actuales de las tablas que se van a tocar.
- Los datos: cardinalidad, nulos, duplicados. Una relación que parece 1:1 puede ser
  1:N.

### 3. Recomendar contra las reglas (antes de escribir)

Si hay más de una forma de resolverlo, presenta las opciones y di de cada una
**qué regla cumple y cuál rompe** (como mínimo: §4 Tablas y §5 Funciones del
archivo de reglas). Di qué se reutiliza. Lo que es lógica (validar, decidir,
calcular, abrir JSON) va a `domain/` o a una Edge Function, no a la función SQL.
Sigue el flujo hasta el consumidor: si el cambio rompe algo en `src/`, se arregla en
el mismo cambio.

### 4. Escribir la migración

Copia la plantilla que corresponda de `plantillas.sql`. Un archivo por objeto
(tabla + su RLS + permisos + comentarios; las funciones de una tabla pueden ir
juntas), con la cabecera y el rollback.

### 5. Mostrar y esperar el OK

**Nunca** aplicar DDL ni escribir datos sin aprobación explícita en el chat.
Muestra la migración completa y explica qué hace cada bloque. El hook
`aprobar-escritura-supabase.mjs` además detiene toda escritura del MCP para que el
usuario la apruebe: no intentes rodearlo.

### 6. Aplicar

Con el OK: `apply_migration` con el **mismo nombre** que el archivo (sin el
timestamp ni `.sql`) y el mismo SQL, y guarda el archivo en
`supabase/migrations/<timestamp>_<nombre>.sql`. Lo aplicado y lo versionado deben
ser idénticos: comprueba con `list_migrations`.

### 7. Verificar contra la base, no contra el script

- Los objetos existen con la firma esperada (consultas de verificación al final de
  `plantillas.sql`): columnas, constraints, `relrowsecurity`, políticas, permisos,
  `prosecdef = false` y `proconfig` con `search_path=""`.
- Prueba la función **como usuario autenticado** (bloque `SET LOCAL ROLE
  authenticated` de `plantillas.sql`, dentro de `BEGIN ... ROLLBACK`): caso normal,
  límite, inexistente y el de **otro usuario** (RLS debe devolver vacío).
- `get_advisors` de seguridad y de rendimiento: cero avisos nuevos, o se explica cada
  uno.
- Rendimiento: `EXPLAIN ANALYZE` de las lecturas; sin `Seq Scan` inesperados en
  tablas que crecen.

### 8. Cerrar

- Regenera los tipos (`generate_typescript_types`) si cambió la API.
- `npx jest`, `npx tsc --noEmit`, `npx eslint src` limpios si se tocó `src/`.
- Commit (skill `commit`) solo si el usuario lo pide.

## Checklist final (recórrelo entero antes de mostrar el SQL)

**Nombres y formato**

- [ ] PascalCase en español, sin tildes/ñ, **entre comillas dobles**; esquemas en
      minúsculas sin comillas
- [ ] Nada en `public`; tabla en esquema privado de área; función en `api`
- [ ] Tabla `T_` en singular, diferenciador al final, columnas sin repetir el nombre
- [ ] Constraints `PK_` / `FK_` / `UQ_` con nombre explícito; índices `IX_`, políticas
      `POL_`, CTE `CTE_`, funciones auxiliares `F_`, triggers `TR_`
- [ ] Función: `SP_T<Tabla>_<Accion>` (una tabla) o `SP_<Entidad>ObtenerPor<Filtro>`
      (JOIN, entidad = tabla del `FROM`), `Paginado` si pagina
- [ ] Parámetros `p_` + PascalCase, con el nombre del dato filtrado
- [ ] Alias de tabla por iniciales; Id expuesto como `Id<Tabla>`
- [ ] Tabuladores, MAYÚSCULAS, coma al inicio, `JOIN` al nivel del `FROM`
- [ ] Comentarios internos solo `/* */`; sin comentarios innecesarios

**Tablas**

- [ ] `"Id"` `INTEGER`/`BIGINT GENERATED ALWAYS AS IDENTITY`
- [ ] FK en toda relación; `IdUsuarioAuth` con FK a `auth.users` si es del usuario
- [ ] Auditoría al final y en orden: `Estado`, `UsuarioCreacion`,
      `UsuarioModificacion`, `FechaCreacion`, `FechaModificacion`
- [ ] Sin `DEFAULT` ni `CHECK`; `NOT NULL` con valor con significado
- [ ] Nada calculable guardado; ninguna tabla equivalente ya existente
- [ ] `COMMENT ON` en la tabla y en **cada** columna
- [ ] RLS activado, políticas por acción con `(SELECT auth.uid())`, sin política de
      `DELETE`
- [ ] Permisos: `USAGE` + `SELECT/INSERT/UPDATE` a `authenticated`, nada a `anon`
- [ ] Índices: solo `IdUsuarioAuth`, FK o con medición que lo justifique

**Funciones**

- [ ] Bloque de documentación exacto + `COMMENT ON FUNCTION`
- [ ] `LANGUAGE sql`, `SECURITY INVOKER`, `SET search_path = ''`, `STABLE`/`VOLATILE`
- [ ] CRUD simple: un `SELECT`, `INSERT` o `UPDATE`; sin lógica, upsert ni JSON
- [ ] `RETURNS TABLE (...)`: un solo resultado con columnas declaradas
- [ ] Escritura devuelve `Id<Tabla>`; auditoría con `(SELECT auth.uid())::TEXT` y
      `NOW()`, nunca recibida como parámetro
- [ ] Sin hardcodeo salvo `Estado`; `ORDER BY` solo la PK; paginación `LIMIT/OFFSET`
- [ ] Filtro explícito por `IdUsuarioAuth` además de RLS (ayuda al planificador)
- [ ] `REVOKE EXECUTE ... FROM PUBLIC, anon` + `GRANT EXECUTE ... TO authenticated`
- [ ] Nada de la sección 6 (malas prácticas) de las reglas

**Migración**

- [ ] Nombre `<yyyymmddhhmmss>_<TipoObjeto>_<Nombre>_<Accion>.sql`
- [ ] Cabecera `/* */` con objeto, tipo de cambio, autor, fecha, descripción y
      rollback
- [ ] Idempotente donde se pueda; no edita una migración ya aplicada
- [ ] Datos solo de catálogo, por `Codigo`; sin datos de prueba
- [ ] Mostrada completa y aprobada antes de aplicar; verificada después
