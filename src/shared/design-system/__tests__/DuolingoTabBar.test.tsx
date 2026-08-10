import { Dimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { DuolingoTabBar, TabBarProps } from '../DuolingoTabBar';

function setWindowWidth(width: number) {
  Dimensions.set({
    window: { width, height: 800, scale: 1, fontScale: 1 },
    screen: { width, height: 800, scale: 1, fontScale: 1 },
  });
}

const tabBarProps: TabBarProps = {
  state: {
    index: 0,
    routes: [
      { key: 'index', name: 'index' },
      { key: 'settings', name: 'settings' },
    ],
  },
  descriptors: {
    index: { options: { title: 'Librería' } },
    settings: { options: { title: 'Configuración' } },
  },
  navigation: {
    navigate: jest.fn(),
    emit: jest.fn(() => ({ defaultPrevented: false })),
  },
};

const renderTabBar = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <DuolingoTabBar {...tabBarProps} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

// El breakpoint ancho vive en `shared/theme/tokens.ts` (`breakpoints.wide`);
// se vuelve a angosto después de cada test para no filtrar estado entre ellos.
afterEach(() => {
  setWindowWidth(390);
});

describe('DuolingoTabBar', () => {
  it('por debajo del breakpoint ancho es una barra horizontal (igual en celular y en web)', async () => {
    setWindowWidth(390);
    await renderTabBar();

    expect(screen.getByTestId('duolingo-tab-bar')).toHaveStyle({ flexDirection: 'row' });
  });

  it('en pantallas anchas se convierte en un riel lateral', async () => {
    setWindowWidth(1200);
    await renderTabBar();

    expect(screen.getByTestId('duolingo-tab-bar')).toHaveStyle({ width: 88 });
  });

  it('sigue exponiendo cada ruta visible como botón accesible en modo riel', async () => {
    setWindowWidth(1200);
    await renderTabBar();

    expect(screen.getByRole('button', { name: 'Librería' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Configuración' })).toBeOnTheScreen();
  });
});
