# Base de datos (Supabase / Postgres) — convenciones OBLIGATORIAS

Antes de diseñar, crear o modificar **cualquier** objeto de base de datos (tabla,
función, política RLS, trigger, migración, Edge Function que toque datos) se usa la
skill **`crear-sql-supabase`**: tiene el flujo, las plantillas y el checklist. Este
archivo es el "qué"; la skill es el "cómo". Ninguna regla de aquí se rompe sin
decirlo antes y por escrito, con el motivo.

Son estándares de un equipo de base de datos profesional (SQL Server) traducidos a
Postgres. Donde Postgres obliga a cambiar algo, la adaptación está marcada con
**(PG)**. Decisiones tomadas el 2026-11-13: PascalCase entre comillas, acceso de la
app **solo por funciones**, un solo proyecto de Supabase mientras no haya usuarios
reales.

## 1. Esquemas y acceso

- **Nada en `public`** (es el `dbo` de Postgres). Los datos viven en esquemas
  **privados por área**, en minúsculas y cortos (p. ej. `progreso`, `usuario`,
  `catalogo`). Esos esquemas **no se exponen** en la API.
- La app **solo** llama funciones del esquema **`api`** (`supabase.rpc(...)`), que es
  el único esquema expuesto además de los que Supabase trae. Equivale a "lecturas y
  escrituras por SP": nunca `supabase.from('T_X')`.
- Las funciones de `api` son `SECURITY INVOKER`: corren con los permisos de quien
  llama, así que **RLS sigue aplicando** como segunda barrera.
- Toda tabla lleva `ENABLE ROW LEVEL SECURITY` y políticas por acción (sin política
  de `DELETE`: el borrado es lógico). Filtro de usuario: `(SELECT auth.uid())`,
  envuelto en `SELECT` para que Postgres lo evalúe una vez y no por fila.
- Permisos explícitos y mínimos: `USAGE` del esquema y `SELECT/INSERT/UPDATE` de la
  tabla a `authenticated`; nada a `anon` salvo justificación. **(PG)** Postgres da
  `EXECUTE` de toda función nueva a `PUBLIC`: se revoca siempre y se concede solo a
  `authenticated`.
- **Nunca** la clave `service_role` en la app ni en el repo. La app usa solo la
  clave publicable (anon), que es pública por diseño.

## 2. Formato general

- Palabras reservadas, funciones y tipos en **MAYÚSCULAS**.
- Indentación con **tabuladores**. Listas con el primer elemento en línea nueva y
  **coma al inicio**, sin espacio tras la coma. `JOIN` al mismo nivel que `FROM`.
- Comentarios dentro del cuerpo solo con `/* */`, nunca `--`, y solo si son
  imprescindibles. El `--` se reserva al bloque de documentación.
- Fechas de documentación en `yyyy-mm-dd`.
- Objetos de una misma funcionalidad empiezan por el nombre de esa funcionalidad.

## 3. Nombres

- **PascalCase en español**, sin tildes, ñ ni caracteres especiales. **(PG)** Todo
  identificador PascalCase va **entre comillas dobles** en todo el SQL
  (`progreso."T_RondaEjercicio"."IdUsuarioAuth"`); sin comillas Postgres lo pasa a
  minúsculas y falla con "relation does not exist". Los esquemas van en minúsculas y
  sin comillas.
- Tablas `T_<Entidad>`, **en singular**, sin preposiciones; la palabra diferenciadora
  va **al final** (`T_Ejercicio`, `T_EjercicioIntervalo`).
- Columnas sin repetir el nombre de la tabla (en `T_Plantilla`: `Texto`, no
  `TextoPlantilla`).
- FK: `Id` + la tabla referida sin `T_` (`IdRondaEjercicio`). Si una tabla se
  referencia dos veces: `IdOrigen_Factura`, `IdOrigen_Proveedor`.
- Funciones de la API (el papel de los SP):
  - Una tabla: `SP_T<Tabla>_Obtener`, `SP_T<Tabla>_ObtenerPor<Filtro>`,
    `SP_T<Tabla>_Insertar`, `SP_T<Tabla>_Actualizar<Informacion>`,
    `SP_T<Tabla>_Actualizar` (cuando lo que cambia es el `Estado`).
  - Con JOIN: **sin guion**, `SP_<Entidad>ObtenerPor<Filtro>`, donde la entidad es
    la tabla del `FROM` (lo que es cada fila devuelta), nunca la pantalla. Si
    pagina, `Paginado` en el nombre.
  - No se crean nombres `_Registrar`, `_Guardar`, `_Listar`, `_Crear`.
- **(PG)** Parámetros: prefijo `p_` + PascalCase (`"p_IdRondaEjercicio"`). Es el `@`
  de SQL Server: sin él, un parámetro con el nombre de una columna es ambiguo. El
  nombre es el del dato filtrado (`"p_IdRondaEjercicio"` filtra `RE."Id"`).
- Funciones auxiliares (no API): `F_<Nombre>`. Triggers: `TR_T<Tabla>_<Accion>`.
  CTE: `CTE_<Nombre>`. Índices: `IX_T<Tabla>_<Columna>`. Políticas RLS:
  `POL_T<Tabla>_<Accion>` (`POL_TRondaEjercicio_Select`).
- Constraints con nombre explícito:
  - `PK_T_<Tabla>`
  - `FK_T_<Tabla>_<ReferenciadaSinT_>_<CampoFK>` (`FK_T_RondaEjercicio_Usuario_IdUsuario`)
  - `UQ_T_<Tabla>_<Columna>`
- Alias de tabla = iniciales en mayúscula (`T_RondaEjercicio` → `RE`). Alias de
  identificador = `Id` + tabla sin `T_` (`RE."Id" AS "IdRondaEjercicio"`), sin
  abreviar. Los PK/FK nunca cambian de nombre en la salida.

## 4. Tablas

- PK `"Id" INTEGER GENERATED ALWAYS AS IDENTITY` (`BIGINT` si puede superar el
  millón de filas: todo lo que crece por usuario y por uso, como rondas o
  respuestas).
- **(PG)** Excepción de identidad: el usuario lo da Supabase Auth como `UUID`. Las
  tablas que pertenecen a un usuario llevan `"IdUsuarioAuth" UUID NOT NULL` con FK a
  `auth.users (id)`: es la columna que usa RLS.
- **FK obligatoria** en toda relación.
- **Auditoría obligatoria al final, en este orden**:

  | Columna | Tipo |
  |---|---|
  | `Estado` | `BOOLEAN NOT NULL` (borrado lógico) |
  | `UsuarioCreacion` | `VARCHAR(50) NOT NULL` |
  | `UsuarioModificacion` | `VARCHAR(50) NOT NULL` |
  | `FechaCreacion` | `TIMESTAMPTZ NOT NULL` |
  | `FechaModificacion` | `TIMESTAMPTZ NOT NULL` |

  **(PG)** Sin `RowVersion`: Postgres no tiene `timestamp`/`rowversion`; si alguna vez
  hace falta concurrencia optimista se usa la columna de sistema `xmin`. Sin
  `IdMigracion`.
- `UsuarioCreacion`/`UsuarioModificacion` = **quien ejecuta la operación**. Desde la
  app, la función pone `(SELECT auth.uid())::TEXT`, **nunca** un parámetro (el
  cliente podría mentir). En una migración o carga manual, el usuario de quien la
  ejecuta (`ocruzalegui`).
- `Estado` (borrado lógico) ≠ `Activo` (habilitado por negocio): si el negocio
  necesita habilitar/deshabilitar, es otra columna.
- **Sin `DEFAULT` ni `CHECK`**: los valores los pone la función o la migración, y la
  validación va en la app/Edge Function. (La identidad `GENERATED` no es un
  `DEFAULT`.)
- **Evitar `NULL`**: si un valor no aplica, `0` o `'No Aplica'` en una columna
  `NOT NULL`. Muchas FK opcionales excluyentes indican una relación polimórfica
  (`IdOriginal` + `Id<Tabla>Clasificacion`).
- No guardar lo que se puede calcular (contadores, totales, "última fecha", rachas):
  se calcula al consultar.
- Antes de crear una tabla, buscar si ya existe una equivalente: dos tablas con la
  misma estructura y propósito se unifican.
- Categorías = **catálogo + FK**, nunca texto libre repetido. Un catálogo lleva
  `Codigo VARCHAR(50)` (valores en PascalCase), `Nombre`, `Descripcion` y `Orden`.
- Texto: `VARCHAR(n)` cuando el largo es una regla del dato, `TEXT` si no.
  **(PG)** No existe `nvarchar`: la base es UTF-8 y guarda cualquier carácter.
  Fechas siempre `TIMESTAMPTZ` (UTC).
- `UNIQUE` solo si protege una escritura que la app podría duplicar.
- Índices no únicos: **solo con justificación** (medición con `EXPLAIN ANALYZE` o
  aviso de `get_advisors`). **(PG)** Excepción: Postgres no indexa las FK solo, y la
  columna de RLS (`IdUsuarioAuth`) se filtra en cada consulta: esas sí se indexan.
- **Documentación obligatoria** de la tabla y de **cada** columna, auditoría incluida:
  **(PG)** `COMMENT ON TABLE` / `COMMENT ON COLUMN` (el `MS_Description` de Postgres).

## 5. Funciones de la API (los "SP")

- Bloque de documentación antes del `CREATE`, con este formato exacto (un espacio
  tras los dos puntos, sin alinear, campos que no aplican con texto explícito):

  ```sql
  -- =============================================
  -- Author: Oscar Alonso Cruzalegui Castillo
  -- Fecha Creacion: yyyy-mm-dd
  -- Descripcion: ...
  -- Parametros entrada: p_X: ... | Ninguna
  -- Excepciones: Ninguna
  -- Retorna: ...
  -- Version: 1.0.0
  -- Ejemplo Validacion: SELECT * FROM api."SP_..."(...);
  -- =============================================
  ```

  Al modificar: `Author Modificacion`, `Fecha Modificacion` y `Descripcion
  Modificacion` justo después de `Descripcion`, y se sube `Version`. **(PG)** Postgres
  no guarda comentarios fuera del cuerpo, así que la `Descripcion` se repite con
  `COMMENT ON FUNCTION`.
- **Solo CRUD simple**: un `SELECT`, un `INSERT` o un `UPDATE` (baja lógica incluida).
  Sin validaciones de negocio (`IF ... RAISE`), sin upsert, sin resolver catálogos,
  sin bucles y **sin extraer JSON** (`->`, `->>`, `json_to_recordset`...). La lógica
  va en la app (`domain/`) o, si el cliente no es de fiar para ese dato, en una
  **Edge Function**.
- `LANGUAGE sql` por defecto; `plpgsql` solo si es imprescindible.
  `SECURITY INVOKER` y `SET search_path = ''` siempre (todo objeto con su esquema).
  `STABLE` en lecturas, `VOLATILE` en escrituras.
- **(PG)** Atomicidad: cada llamada es una transacción y un error la revierte entera
  (lo que daba `SET XACT_ABORT ON`); no se escribe `BEGIN`/`COMMIT`. Si se usa un
  bloque `EXCEPTION`, termina en `RAISE;`: nunca se traga el error.
- **Un solo resultado**, con columnas declaradas: `RETURNS TABLE (...)`. Si hacen
  falta dos conjuntos, son dos funciones. Dos funciones que devuelven lo mismo y
  solo cambia el filtro se unifican, y si quedan dos caminos de filtro son dos
  funciones (la app elige), no un `IF`.
- Las escrituras devuelven el Id afectado con su nombre:
  `RETURNING RE."Id" AS "IdRondaEjercicio"`.
- Sin hardcodeo: el único literal permitido es `Estado`. Lo que la función necesite
  se recibe como parámetro.
- Listas que crecen: `p_NumeroPagina` (desde 1) y `p_TamanoPagina`,
  `ORDER BY` la PK, `LIMIT` / `OFFSET`. `LIMIT 1` para leer una fila es válido.
- `ORDER BY` solo por la PK; cualquier otro orden lo hace la app.
- Lista de Ids como parámetro: **(PG)** arreglo (`INTEGER[]`) con `= ANY(...)`, en
  vez de tipo tabla.
- Comparar con `NULL` da `UNKNOWN`: se usa `IS NULL` / `IS NOT NULL`. Con criterios
  opcionales, `OR` entre bloques y paréntesis alrededor antes del filtro común.

## 6. Prohibido (malas prácticas)

`SELECT *` · funciones sobre la columna filtrada (`WHERE EXTRACT(YEAR FROM ...)`;
usar rangos) · funciones escalares por fila · `DISTINCT` de parche ·
`UNION` (usar `UNION ALL`) · cursores y bucles · subconsultas correlacionadas (usar
`JOIN`/`LATERAL`) · `LIKE '%texto'` · consultas sin `WHERE` ni límite ·
`ROW_NUMBER()` para paginar · `ORDER BY random()` · `OR` en `JOIN` · conversiones
implícitas (parámetro del mismo tipo que la columna) · `LEFT JOIN` "por si acaso" ·
CTE anidados en exceso · funciones que llaman a funciones sin documentarlo · vistas
salvo justificación escrita (las lecturas van por función) · transacciones largas.

## 7. Migraciones (el "pase a producción")

- Todo cambio de esquema es una **migración** en `supabase/migrations/`, versionada
  en git. Nada se crea "a mano" en el Dashboard.
- Nombre: `<yyyymmddhhmmss>_<TipoObjeto>_<Nombre>_<Accion>.sql`
  (`20261113150000_T_RondaEjercicio_Create.sql`). Un objeto (con su RLS, permisos y
  comentarios) por migración; las funciones de una tabla pueden ir juntas.
- Cabecera `/* */` con Objeto, Tipo de cambio, Autor, Fecha, Descripción y
  **Rollback**. Idempotente donde se pueda (`IF NOT EXISTS`, `CREATE OR REPLACE`).
- Una migración **aplicada no se edita nunca**: el cambio va en una nueva. Antes de
  aplicarla se pule hasta que sea la versión final.
- Datos en migraciones: **solo catálogos**, resueltos por `Codigo`, nunca por un Id
  fijo. Nada de datos de prueba.
- Cambiar la firma o el tipo de retorno de una función exige `DROP` + `CREATE`
  (**(PG)** `CREATE OR REPLACE` no puede): requiere aprobación explícita y revisar
  antes quién la consume en `src/`.
- Todo DDL o escritura se **muestra completo y se aplica solo con el OK** del
  usuario (lo refuerza el hook `.claude/hooks/aprobar-escritura-supabase.mjs`).
  Tras aplicar se **verifica contra la base**, no contra el script.

## 8. Encaje con la arquitectura de la app

- El cliente de Supabase es infraestructura: vive en `src/infrastructure/` detrás
  de una interfaz de `domain/`, como el audio. `domain/` nunca importa
  `@supabase/supabase-js`.
- Los tipos de TypeScript de la API se generan (`generate_typescript_types`), no se
  escriben a mano.
- Recordatorio de alcance: la persistencia sigue **fuera del MVP** (ver
  `CLAUDE.md`). No se crean tablas hasta que el usuario abra esa etapa.
