// PreToolUse del MCP de Supabase: toda escritura pide aprobación explícita.
// Las lecturas (SELECT, list_tables, get_advisors...) pasan sin preguntar; DDL, DML,
// migraciones, Edge Functions y operaciones de proyecto/branch se detienen en "ask"
// para que el usuario vea el SQL antes de que se ejecute.

const HERRAMIENTAS_ESCRITURA = new Set([
  'apply_migration',
  'deploy_edge_function',
  'create_edge_function_secret',
  'create_branch',
  'delete_branch',
  'merge_branch',
  'reset_branch',
  'rebase_branch',
  'create_project',
  'pause_project',
  'restore_project',
  'confirm_cost',
  'update_storage_config',
  'create_notebook',
  'run_notebook',
  'delete_notebook',
  'submit_feedback',
  'delete_feedback',
]);

const PALABRAS_ESCRITURA = [
  'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'UPSERT', 'CREATE', 'ALTER', 'DROP',
  'TRUNCATE', 'GRANT', 'REVOKE', 'COMMENT', 'COPY', 'VACUUM', 'REINDEX', 'CLUSTER',
  'REFRESH', 'CALL', 'DO', 'LOCK', 'IMPORT', 'SECURITY', 'OWNER',
];

const DESTRUCTIVAS = ['DROP', 'TRUNCATE', 'DELETE'];

function preguntar(motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `Supabase: ${motivo}. Revisa el SQL completo antes de aprobar.`,
      },
    }),
  );
  process.exit(0);
}

function sinComentariosNiTextos(sql) {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, ' $$cuerpo$$ ')
    .replace(/'(?:[^']|'')*'/g, "''");
}

let entrada = '';
process.stdin.on('data', (c) => (entrada += c));
process.stdin.on('end', () => {
  let datos;
  try {
    datos = JSON.parse(entrada);
  } catch {
    preguntar('no se pudo leer la llamada');
  }

  const nombre = String(datos?.tool_name ?? '').split('__').pop();

  if (HERRAMIENTAS_ESCRITURA.has(nombre)) {
    const sql = String(datos?.tool_input?.query ?? '');
    const mayus = sinComentariosNiTextos(sql).toUpperCase();
    const destructiva = DESTRUCTIVAS.find((p) => new RegExp(`\\b${p}\\b`).test(mayus));
    preguntar(
      destructiva
        ? `${nombre} contiene ${destructiva} (solo si el usuario lo pidió explícitamente)`
        : `${nombre} modifica el proyecto`,
    );
  }

  if (nombre === 'execute_sql') {
    const sql = String(datos?.tool_input?.query ?? '');
    const limpia = sinComentariosNiTextos(sql);
    const mayus = limpia.toUpperCase();

    const palabra = PALABRAS_ESCRITURA.find((p) => new RegExp(`\\b${p}\\b`).test(mayus));
    if (palabra) {
      const destructiva = DESTRUCTIVAS.includes(palabra);
      preguntar(
        destructiva
          ? `execute_sql contiene ${palabra} (destructivo: solo si el usuario lo pidió explícitamente)`
          : `execute_sql contiene ${palabra}`,
      );
    }

    // Un SELECT puede escribir si llama a una función de escritura de la API.
    if (/\bSP_\w*_(?:INSERTAR|ACTUALIZAR)\w*/.test(mayus)) {
      preguntar('execute_sql llama a una función de escritura de la API');
    }
  }

  process.exit(0);
});
