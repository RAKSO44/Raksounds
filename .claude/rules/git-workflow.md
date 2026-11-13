# Flujo de git

- Se trabaja y se commitea **directamente en `develop`**, que es la rama por
  defecto del repo (`origin/HEAD -> origin/develop`). No crear ramas de feature
  por iniciativa propia: solo si el usuario lo pide. Aquí NO aplica el reflejo de
  "si estás en la rama por defecto, crea una rama antes de commitear".
  Motivo: el usuario prefiere un historial lineal en `develop` antes que ramas
  que luego hay que mantener y mezclar.
- `main` solo recibe merges de `develop` cuando el usuario lo pide. Nunca se
  commitea directo en `main`: si `main` y `develop` divergen, los arreglos
  terminan duplicados de dos formas distintas y el merge entra en conflicto.
- Si hay que sacar trabajo de una rama vieja, `git cherry <destino> <rama>`
  confirma con `-` que el commit ya está integrado antes de borrarla con `-D`.
- El repo es **público**. `docs/commands.md` está en `.gitignore` porque tiene
  credenciales: nunca subirlo, ni subir datos personales (teléfono, etc.).
- Formato de commits: skill `commit` (Conventional Commits, en inglés).
