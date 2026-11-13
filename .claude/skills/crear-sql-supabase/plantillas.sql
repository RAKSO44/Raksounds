/*
	Plantillas de la skill crear-sql-supabase.
	"ejemplo" y "T_Entidad" son marcadores: se reemplazan por el esquema de area y la
	tabla reales. Cada bloque numerado es un archivo de migracion distinto.
*/


/* =====================================================================
	1. Configuracion inicial de la API (una sola vez en el proyecto)
	Archivo: <timestamp>_Esquema_Api_Create.sql
	Ademas, en el Dashboard: Project Settings > Data API > Exposed schemas,
	agregar "api". Ese paso no se puede hacer con SQL.
===================================================================== */

/*
	Objeto: api
	Tipo de Cambio: CREATE SCHEMA
	Autor: Oscar Alonso Cruzalegui Castillo
	Fecha: yyyy-mm-dd
	Descripcion: Esquema unico que expone la API; solo contiene funciones.

	Rollback:
	DROP SCHEMA api;
*/
CREATE SCHEMA IF NOT EXISTS api;

GRANT USAGE ON SCHEMA api TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMENT ON SCHEMA api IS 'API de Raksound: funciones que la app llama con supabase.rpc(). No contiene tablas.';


/* =====================================================================
	2. Esquema de area (uno por area, cuando nace la primera tabla)
	Archivo: <timestamp>_Esquema_Ejemplo_Create.sql
===================================================================== */

CREATE SCHEMA IF NOT EXISTS ejemplo;

GRANT USAGE ON SCHEMA ejemplo TO authenticated;

COMMENT ON SCHEMA ejemplo IS 'Descripcion del area. Privado: no se expone en la API.';


/* =====================================================================
	3. Tabla de un usuario
	Archivo: <timestamp>_T_Entidad_Create.sql
===================================================================== */

/*
	Objeto: ejemplo."T_Entidad"
	Tipo de Cambio: CREATE TABLE
	Autor: Oscar Alonso Cruzalegui Castillo
	Fecha: yyyy-mm-dd
	Descripcion: Que guarda la tabla y para que.

	Rollback:
	DROP TABLE ejemplo."T_Entidad";
*/
CREATE TABLE IF NOT EXISTS ejemplo."T_Entidad"
(
	"Id" BIGINT GENERATED ALWAYS AS IDENTITY
	,"IdUsuarioAuth" UUID NOT NULL
	,"IdEntidadTipo" INTEGER NOT NULL
	,"Nombre" VARCHAR(100) NOT NULL
	,"Estado" BOOLEAN NOT NULL
	,"UsuarioCreacion" VARCHAR(50) NOT NULL
	,"UsuarioModificacion" VARCHAR(50) NOT NULL
	,"FechaCreacion" TIMESTAMPTZ NOT NULL
	,"FechaModificacion" TIMESTAMPTZ NOT NULL
	,CONSTRAINT "PK_T_Entidad" PRIMARY KEY ("Id")
	/* ON DELETE CASCADE solo hacia auth.users: borrar la cuenta debe borrar sus datos. */
	,CONSTRAINT "FK_T_Entidad_AuthUsers_IdUsuarioAuth" FOREIGN KEY ("IdUsuarioAuth") REFERENCES auth.users (id) ON DELETE CASCADE
	,CONSTRAINT "FK_T_Entidad_EntidadTipo_IdEntidadTipo" FOREIGN KEY ("IdEntidadTipo") REFERENCES ejemplo."T_EntidadTipo" ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_TEntidad_IdUsuarioAuth" ON ejemplo."T_Entidad" ("IdUsuarioAuth");
CREATE INDEX IF NOT EXISTS "IX_TEntidad_IdEntidadTipo" ON ejemplo."T_Entidad" ("IdEntidadTipo");

ALTER TABLE ejemplo."T_Entidad" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POL_TEntidad_Select" ON ejemplo."T_Entidad"
	FOR SELECT
	TO authenticated
	USING ("IdUsuarioAuth" = (SELECT auth.uid()));

CREATE POLICY "POL_TEntidad_Insert" ON ejemplo."T_Entidad"
	FOR INSERT
	TO authenticated
	WITH CHECK ("IdUsuarioAuth" = (SELECT auth.uid()));

CREATE POLICY "POL_TEntidad_Update" ON ejemplo."T_Entidad"
	FOR UPDATE
	TO authenticated
	USING ("IdUsuarioAuth" = (SELECT auth.uid()))
	WITH CHECK ("IdUsuarioAuth" = (SELECT auth.uid()));

REVOKE ALL ON ejemplo."T_Entidad" FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON ejemplo."T_Entidad" TO authenticated;

COMMENT ON TABLE ejemplo."T_Entidad" IS 'Que guarda, de quien es y quien la escribe.';
COMMENT ON COLUMN ejemplo."T_Entidad"."Id" IS 'Identificador de la entidad.';
COMMENT ON COLUMN ejemplo."T_Entidad"."IdUsuarioAuth" IS 'Usuario dueno de la fila (auth.users.id). Columna de RLS.';
COMMENT ON COLUMN ejemplo."T_Entidad"."IdEntidadTipo" IS 'Tipo de entidad (ejemplo.T_EntidadTipo).';
COMMENT ON COLUMN ejemplo."T_Entidad"."Nombre" IS 'Nombre visible de la entidad.';
COMMENT ON COLUMN ejemplo."T_Entidad"."Estado" IS 'Borrado logico: TRUE vigente, FALSE dado de baja.';
COMMENT ON COLUMN ejemplo."T_Entidad"."UsuarioCreacion" IS 'Quien creo la fila: auth.uid() desde la app, usuario del desarrollador en migraciones.';
COMMENT ON COLUMN ejemplo."T_Entidad"."UsuarioModificacion" IS 'Quien hizo la ultima modificacion.';
COMMENT ON COLUMN ejemplo."T_Entidad"."FechaCreacion" IS 'Fecha y hora de creacion (UTC).';
COMMENT ON COLUMN ejemplo."T_Entidad"."FechaModificacion" IS 'Fecha y hora de la ultima modificacion (UTC).';


/* =====================================================================
	4. Catalogo (sin usuario dueno: lectura para todos los autenticados)
	Archivo: <timestamp>_T_EntidadTipo_Create.sql
	Se aplica ANTES que la tabla que lo referencia (orden: catalogos, tablas,
	funciones). Las filas se siembran en la misma migracion, resueltas por Codigo.
===================================================================== */

CREATE TABLE IF NOT EXISTS ejemplo."T_EntidadTipo"
(
	"Id" INTEGER GENERATED ALWAYS AS IDENTITY
	,"Codigo" VARCHAR(50) NOT NULL
	,"Nombre" VARCHAR(100) NOT NULL
	,"Descripcion" TEXT NOT NULL
	,"Orden" INTEGER NOT NULL
	,"Estado" BOOLEAN NOT NULL
	,"UsuarioCreacion" VARCHAR(50) NOT NULL
	,"UsuarioModificacion" VARCHAR(50) NOT NULL
	,"FechaCreacion" TIMESTAMPTZ NOT NULL
	,"FechaModificacion" TIMESTAMPTZ NOT NULL
	,CONSTRAINT "PK_T_EntidadTipo" PRIMARY KEY ("Id")
	,CONSTRAINT "UQ_T_EntidadTipo_Codigo" UNIQUE ("Codigo")
);

ALTER TABLE ejemplo."T_EntidadTipo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POL_TEntidadTipo_Select" ON ejemplo."T_EntidadTipo"
	FOR SELECT
	TO authenticated
	USING ("Estado" = TRUE);

REVOKE ALL ON ejemplo."T_EntidadTipo" FROM PUBLIC, anon;
GRANT SELECT ON ejemplo."T_EntidadTipo" TO authenticated;

INSERT INTO ejemplo."T_EntidadTipo"
(
	"Codigo"
	,"Nombre"
	,"Descripcion"
	,"Orden"
	,"Estado"
	,"UsuarioCreacion"
	,"UsuarioModificacion"
	,"FechaCreacion"
	,"FechaModificacion"
)
VALUES
	('PrimerTipo', 'Primer tipo', 'No Aplica', 1, TRUE, 'ocruzalegui', 'ocruzalegui', NOW(), NOW())
	,('SegundoTipo', 'Segundo tipo', 'No Aplica', 2, TRUE, 'ocruzalegui', 'ocruzalegui', NOW(), NOW())
ON CONFLICT ("Codigo") DO NOTHING;

/* COMMENT ON TABLE / COLUMN de cada columna, igual que en la plantilla 3. */


/* =====================================================================
	5. Funciones CRUD de una tabla
	Archivo: <timestamp>_SP_TEntidad_Create.sql
===================================================================== */

-- =============================================
-- Author: Oscar Alonso Cruzalegui Castillo
-- Fecha Creacion: yyyy-mm-dd
-- Descripcion: Registra una entidad del usuario autenticado.
-- Parametros entrada: p_IdEntidadTipo: tipo de la entidad, p_Nombre: nombre visible
-- Excepciones: Ninguna
-- Retorna: IdEntidad de la fila creada
-- Version: 1.0.0
-- Ejemplo Validacion: SELECT * FROM api."SP_TEntidad_Insertar"(1, 'Prueba');
-- =============================================

CREATE OR REPLACE FUNCTION api."SP_TEntidad_Insertar"
(
	"p_IdEntidadTipo" INTEGER
	,"p_Nombre" VARCHAR
)
RETURNS TABLE
(
	"IdEntidad" BIGINT
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
	INSERT INTO ejemplo."T_Entidad"
	(
		"IdUsuarioAuth"
		,"IdEntidadTipo"
		,"Nombre"
		,"Estado"
		,"UsuarioCreacion"
		,"UsuarioModificacion"
		,"FechaCreacion"
		,"FechaModificacion"
	)
	VALUES
	(
		(SELECT auth.uid())
		,"p_IdEntidadTipo"
		,"p_Nombre"
		,TRUE
		,(SELECT auth.uid())::TEXT
		,(SELECT auth.uid())::TEXT
		,NOW()
		,NOW()
	)
	RETURNING "Id" AS "IdEntidad";
$$;

REVOKE EXECUTE ON FUNCTION api."SP_TEntidad_Insertar"(INTEGER, VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api."SP_TEntidad_Insertar"(INTEGER, VARCHAR) TO authenticated;
COMMENT ON FUNCTION api."SP_TEntidad_Insertar"(INTEGER, VARCHAR) IS 'Registra una entidad del usuario autenticado. Retorna IdEntidad.';

-- =============================================
-- Author: Oscar Alonso Cruzalegui Castillo
-- Fecha Creacion: yyyy-mm-dd
-- Descripcion: Cambia el nombre de una entidad del usuario autenticado.
-- Parametros entrada: p_IdEntidad: entidad a modificar, p_Nombre: nombre nuevo
-- Excepciones: Ninguna
-- Retorna: IdEntidad modificado (vacio si no existe o no es del usuario)
-- Version: 1.0.0
-- Ejemplo Validacion: SELECT * FROM api."SP_TEntidad_ActualizarNombre"(1, 'Nuevo');
-- =============================================

CREATE OR REPLACE FUNCTION api."SP_TEntidad_ActualizarNombre"
(
	"p_IdEntidad" BIGINT
	,"p_Nombre" VARCHAR
)
RETURNS TABLE
(
	"IdEntidad" BIGINT
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
	UPDATE ejemplo."T_Entidad" E
	SET
		"Nombre" = "p_Nombre"
		,"UsuarioModificacion" = (SELECT auth.uid())::TEXT
		,"FechaModificacion" = NOW()
	WHERE
		E."Id" = "p_IdEntidad"
		AND E."IdUsuarioAuth" = (SELECT auth.uid())
	RETURNING E."Id" AS "IdEntidad";
$$;

/* REVOKE / GRANT / COMMENT ON FUNCTION igual que en la anterior. */

-- =============================================
-- Author: Oscar Alonso Cruzalegui Castillo
-- Fecha Creacion: yyyy-mm-dd
-- Descripcion: Da de baja (borrado logico) una entidad del usuario autenticado.
-- Parametros entrada: p_IdEntidad: entidad a dar de baja
-- Excepciones: Ninguna
-- Retorna: IdEntidad dado de baja (vacio si no existe o no es del usuario)
-- Version: 1.0.0
-- Ejemplo Validacion: SELECT * FROM api."SP_TEntidad_Actualizar"(1);
-- =============================================

CREATE OR REPLACE FUNCTION api."SP_TEntidad_Actualizar"
(
	"p_IdEntidad" BIGINT
)
RETURNS TABLE
(
	"IdEntidad" BIGINT
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
	UPDATE ejemplo."T_Entidad" E
	SET
		"Estado" = FALSE
		,"UsuarioModificacion" = (SELECT auth.uid())::TEXT
		,"FechaModificacion" = NOW()
	WHERE
		E."Id" = "p_IdEntidad"
		AND E."IdUsuarioAuth" = (SELECT auth.uid())
	RETURNING E."Id" AS "IdEntidad";
$$;

-- =============================================
-- Author: Oscar Alonso Cruzalegui Castillo
-- Fecha Creacion: yyyy-mm-dd
-- Descripcion: Lista paginada de las entidades vigentes del usuario autenticado.
-- Parametros entrada: p_NumeroPagina: pagina desde 1, p_TamanoPagina: filas por pagina (20: filas de una linea)
-- Excepciones: Ninguna
-- Retorna: IdEntidad, IdEntidadTipo, Nombre, FechaCreacion
-- Version: 1.0.0
-- Ejemplo Validacion: SELECT * FROM api."SP_TEntidad_ObtenerPaginado"(1, 20);
-- =============================================

CREATE OR REPLACE FUNCTION api."SP_TEntidad_ObtenerPaginado"
(
	"p_NumeroPagina" INTEGER
	,"p_TamanoPagina" INTEGER
)
RETURNS TABLE
(
	"IdEntidad" BIGINT
	,"IdEntidadTipo" INTEGER
	,"Nombre" VARCHAR
	,"FechaCreacion" TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
	SELECT
		E."Id" AS "IdEntidad"
		,E."IdEntidadTipo"
		,E."Nombre"
		,E."FechaCreacion"
	FROM
		ejemplo."T_Entidad" E
	WHERE
		E."IdUsuarioAuth" = (SELECT auth.uid())
		AND E."Estado" = TRUE
	ORDER BY
		E."Id"
	LIMIT "p_TamanoPagina"
	OFFSET ("p_NumeroPagina" - 1) * "p_TamanoPagina";
$$;


/* =====================================================================
	6. Lectura con JOIN (sin guion; la entidad es la tabla del FROM)
===================================================================== */

-- =============================================
-- Author: Oscar Alonso Cruzalegui Castillo
-- Fecha Creacion: yyyy-mm-dd
-- Descripcion: Entidades vigentes del usuario de un tipo, con el nombre del tipo.
-- Parametros entrada: p_IdEntidadTipo: tipo a filtrar
-- Excepciones: Ninguna
-- Retorna: IdEntidad, Nombre, IdEntidadTipo, NombreEntidadTipo
-- Version: 1.0.0
-- Ejemplo Validacion: SELECT * FROM api."SP_EntidadObtenerPorIdEntidadTipo"(1);
-- =============================================

CREATE OR REPLACE FUNCTION api."SP_EntidadObtenerPorIdEntidadTipo"
(
	"p_IdEntidadTipo" INTEGER
)
RETURNS TABLE
(
	"IdEntidad" BIGINT
	,"Nombre" VARCHAR
	,"IdEntidadTipo" INTEGER
	,"NombreEntidadTipo" VARCHAR
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
	SELECT
		E."Id" AS "IdEntidad"
		,E."Nombre"
		,ET."Id" AS "IdEntidadTipo"
		,ET."Nombre" AS "NombreEntidadTipo"
	FROM
		ejemplo."T_Entidad" E
	INNER JOIN ejemplo."T_EntidadTipo" ET ON ET."Id" = E."IdEntidadTipo"
	WHERE
		E."IdUsuarioAuth" = (SELECT auth.uid())
		AND E."IdEntidadTipo" = "p_IdEntidadTipo"
		AND E."Estado" = TRUE
		AND ET."Estado" = TRUE
	ORDER BY
		E."Id";
$$;


/* =====================================================================
	7. Verificacion despues de aplicar (solo lectura)
===================================================================== */

/* Columnas de una tabla */
SELECT
	C.column_name
	,C.data_type
	,C.is_nullable
	,C.column_default
FROM
	information_schema.columns C
WHERE
	C.table_schema = 'ejemplo'
	AND C.table_name = 'T_Entidad'
ORDER BY
	C.ordinal_position;

/* RLS, politicas y comentario de la tabla */
SELECT
	PC.relname
	,PC.relrowsecurity
	,OBJ_DESCRIPTION(PC.oid, 'pg_class') AS "Descripcion"
FROM
	pg_catalog.pg_class PC
INNER JOIN pg_catalog.pg_namespace PN ON PN.oid = PC.relnamespace
WHERE
	PN.nspname = 'ejemplo';

SELECT
	PP.policyname
	,PP.cmd
	,PP.roles
	,PP.qual
	,PP.with_check
FROM
	pg_catalog.pg_policies PP
WHERE
	PP.schemaname = 'ejemplo';

/* Firma, seguridad y search_path de las funciones de la API */
SELECT
	P.proname
	,PG_GET_FUNCTION_IDENTITY_ARGUMENTS(P.oid) AS "Parametros"
	,PG_GET_FUNCTION_RESULT(P.oid) AS "Retorna"
	,P.prosecdef
	,P.proconfig
	,HAS_FUNCTION_PRIVILEGE('anon', P.oid, 'EXECUTE') AS "AnonPuedeEjecutar"
	,HAS_FUNCTION_PRIVILEGE('authenticated', P.oid, 'EXECUTE') AS "AutenticadoPuedeEjecutar"
FROM
	pg_catalog.pg_proc P
INNER JOIN pg_catalog.pg_namespace PN ON PN.oid = P.pronamespace
WHERE
	PN.nspname = 'api';

/* Probar como usuario autenticado; ROLLBACK deshace cualquier escritura */
BEGIN;
SET LOCAL ROLE authenticated;
SELECT SET_CONFIG('request.jwt.claims', '{"sub":"<uuid-de-un-usuario-de-prueba>","role":"authenticated"}', TRUE);
SELECT * FROM api."SP_TEntidad_ObtenerPaginado"(1, 20);
ROLLBACK;
