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
