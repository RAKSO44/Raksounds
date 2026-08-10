/**
 * @jest-environment jsdom
 *
 * Esta variante sincroniza `document.documentElement.dataset.theme` (lo que
 * de verdad pinta los colores en web, vía las variables CSS de
 * `src/app/+html.tsx`), así que necesita un `document` real: el preset
 * nativo de Jest (ver .claude/rules/testing.md) no lo provee.
 */
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import { useSettingsStore } from '@/shared/settings';

// Se importa con extensión explícita: bajo el preset nativo, `@/shared/theme`
// resolvería la variante nativa. Esta suite apunta a propósito al archivo
// `.web.tsx`, que es el que sincroniza `data-theme`.
import { ThemeProvider, useTheme } from '../ThemeProvider.web';

let mockScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native', () => {
  // Un spread (`...actual`) dispara TODOS los getters del módulo real de
  // react-native, incluidos los de módulos nativos que no existen en Jest y
  // explotan al solo leerlos. El Proxy solo intercepta `useColorScheme` y
  // deja el resto de accesos sin tocar (perezosos, como en la app real).
  const actual = jest.requireActual('react-native');
  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === 'useColorScheme') return () => mockScheme;
      return Reflect.get(target, prop, receiver);
    },
  });
});

function ThemeProbe() {
  const { isDark } = useTheme();
  return <Text>{isDark ? 'dark' : 'light'}</Text>;
}

beforeEach(() => {
  mockScheme = 'light';
  useSettingsStore.setState({ themeMode: 'system' });
});

describe('ThemeProvider (web)', () => {
  it('en modo "system", refleja el esquema del navegador', async () => {
    mockScheme = 'dark';

    await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('dark')).toBeOnTheScreen();
  });

  it('con themeMode forzado, ignora el esquema del sistema', async () => {
    mockScheme = 'light';
    useSettingsStore.setState({ themeMode: 'dark' });

    await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('dark')).toBeOnTheScreen();
  });

  it('sincroniza data-theme en <html> para que la hoja de estilos de +html.tsx pinte el color real', async () => {
    mockScheme = 'dark';

    await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('dark');

    await act(async () => {
      useSettingsStore.setState({ themeMode: 'light' });
    });

    expect(screen.getByText('light')).toBeOnTheScreen();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
