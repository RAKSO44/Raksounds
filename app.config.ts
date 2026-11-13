import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Reemplaza a app.json porque el `baseUrl` de GitHub Pages solo debe activarse
 * al exportar el sitio, nunca en desarrollo local ni en los builds nativos:
 * si quedara fijo en JSON estático, `expo start --web` serviría todo bajo
 * `/Raksounds` y rompería el dev server. Config dinámica = un solo valor
 * condicional en vez de mantener dos app.json casi idénticos.
 *
 * `npm run deploy:web` es quien fija esta variable antes de exportar.
 */
const isGithubPagesBuild = process.env.EXPO_PUBLIC_GH_PAGES_BUILD === '1';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Raksound',
  slug: 'raksound',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'raksound',
  userInterfaceStyle: 'automatic',
  android: {
    adaptiveIcon: {
      backgroundColor: '#FBEAD3',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.rakso.raksound',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    // Las fuentes se EMBEBEN en el binario (no se cargan en tiempo de
    // ejecución): así Android tiene la tipografía registrada antes del primer
    // layout. Cargándolas después, la primera medición de cada texto se hace
    // con la fuente del sistema y luego se pinta con Poppins, que es más
    // ancha: el resultado son textos recortados ("Arpegi") o con puntos
    // suspensivos donde sobra espacio.
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Poppins_400Regular.ttf',
          './assets/fonts/Poppins_500Medium.ttf',
          './assets/fonts/Poppins_600SemiBold.ttf',
          './assets/fonts/Poppins_700Bold.ttf',
          './assets/fonts/Poppins_800ExtraBold.ttf',
        ],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FBEAD3',
        image: './assets/images/splash-icon.png',
        imageWidth: 240,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#FBEAD3',
          image: './assets/images/splash-icon.png',
          imageWidth: 240,
        },
      },
    ],
    'react-native-audio-api',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    // Repo de GitHub Pages tipo proyecto: usuario.github.io/Raksounds.
    ...(isGithubPagesBuild ? { baseUrl: '/Raksounds' } : {}),
  },
});
