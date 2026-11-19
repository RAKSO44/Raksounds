# Flujo de git

- **Nunca asumir en qué rama commitear ni a dónde hacer push.** El usuario
  indica la rama en cada caso; si no lo dijo, se pregunta antes. No crear
  ramas por iniciativa propia.
- `develop` es normalmente la rama de **integración** (`origin/HEAD ->
  origin/develop`): el trabajo suele vivir en ramas de feature que luego se
  integran ahí, aunque a veces el usuario pide commitear directo en `develop`.
  Eso es una indicación puntual, no una regla general.
- `main` solo recibe merges de `develop` cuando el usuario lo pide. Nunca se
  commitea directo en `main`: si `main` y `develop` divergen, los arreglos
  terminan duplicados de dos formas distintas y el merge entra en conflicto.
- Si hay que sacar trabajo de una rama vieja, `git cherry <destino> <rama>`
  confirma con `-` que el commit ya está integrado antes de borrarla con `-D`.
- El repo es **público**. `docs/commands.md` está en `.gitignore` porque tiene
  credenciales: nunca subirlo, ni subir datos personales (teléfono, etc.).
- Formato de commits: skill `commit` (Conventional Commits, en inglés).
