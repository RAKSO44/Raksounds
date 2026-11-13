# Notas de plataforma y tooling (lecciones ya pagadas — no repetirlas)

## Dependencias

- Antes de proponer una librería nueva, verificar que sea la recomendación
  vigente de Expo/comunidad y pedir confirmación al usuario. No instalar nada
  hasta que haya código que lo consuma.
- Un módulo nativo nuevo (o un cambio de config nativa) exige **rebuild del dev
  build** (`npx expo run:android`); recargar JS no basta.

## Tooling

- TypeScript 6 ya no incluye los `@types/*` automáticamente: `tsconfig.json`
  lleva `"types": ["jest"]`.
- `expo lint` cachea en `.expo/cache/eslint/`: si reporta errores fantasma
  tras instalar paquetes, borrar esa carpeta.
- La regla de oro (`domain/` puro) la hace cumplir ESLint con
  `no-restricted-imports` en `eslint.config.js`.

## Audio

- Motor y banco de muestras: ver `src/infrastructure/audio/README.md`. Nunca
  volver a un reproductor de medios (expo-audio) para las teclas, ni
  transponer en caliente.
- **Sin boost de volumen.** El banco cromático ya sale con +7 dB y sus picos
  quedan justo bajo 0 dBFS: cualquier ganancia de bus >1 satura (un limitador
  solo cambia recorte duro por saturación). El ajuste de volumen se eliminó a
  pedido del usuario. El bus lleva `MASTER_GAIN = 0.7` (≈ -3 dB de margen, la
  escala completa a la vez aún clavaba el limitador) y se conserva el
  limitador soft-clip para acordes de 5+ notas. No reintroducir un slider que
  amplifique.

## Gestos (multitouch)

- `PushButton` usa `Gesture.LongPress().minDuration(0)` para que el note-on
  sea al tocar, con `maxDistance` finito (`PRESS_SLOP`): al superarlo el gesto
  se cancela y el `ScrollView` toma el control, así arrastrar sigue haciendo
  scroll. Requiere `GestureHandlerRootView` en `src/app/_layout.tsx`.
- En Jest el `GestureDetector` se mockea en `jest.setup.js` con un `Pressable`
  que dispara los mismos callbacks: el reconocimiento real es nativo y nunca
  se activaría en Node.

## Háptica en Android

- `Haptics.impactAsync()` en Android NO llega al motor afinado del fabricante:
  construye una waveform a mano (Medium y Rigid son idénticas, ~43 ms a
  50/255), que se siente como un zumbido flojo. Subir el estilo no lo arregla.
- En Android se usa `Haptics.performAndroidHapticsAsync(type)` (pasa por
  `View.performHapticFeedback`, la misma ruta que el teclado y Duolingo); en
  iOS se mantiene `impactAsync` (Taptic Engine). El mapeo vive en
  `src/shared/haptics/haptics.ts`.

## Persistencia (MMKV v4)

- Preferencias con `react-native-mmkv` + `persist` de zustand. Se eligió MMKV
  por ser **síncrono**: el store rehidrata antes del primer render y el tema no
  parpadea al abrir (AsyncStorage sí parpadearía).
- API v4 (Nitro), distinta de v3: `createMMKV({ id })`, NO `new MMKV()`; el
  borrado es `remove(key)`, NO `delete`. En Jest se mockea en `jest.setup.js`
  con un `Map` en memoria.

## Splash de Android 12+

- Android enmascara el ícono a un **círculo de 192dp** dentro de un lienzo de
  288dp; expo-splash-screen escala el PNG a `imageWidth` dp centrado.
- Para que no se recorte, el radio máximo del arte debe quedar < 96dp:
  `radioMax_dp = (radioMax_px / anchoPNG_px) × imageWidth`. Con el
  `splash-icon.png` actual el valor es `imageWidth: 240` (~91dp).
- Agregar padding transparente al PNG y subir `imageWidth` "para compensar" se
  cancelan exactamente: no cambia nada.
- `gradlew assembleRelease` NO regenera los drawables: tras cambiar la config
  del splash correr `npx expo prebuild --platform android` primero.
