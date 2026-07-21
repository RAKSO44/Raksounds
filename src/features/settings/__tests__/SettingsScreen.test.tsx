import { ReactNode } from 'react';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_VOLUME } from '@/domain/audio/volume';
import { useSettingsStore } from '@/shared/settings';
import { ThemeProvider } from '@/shared/theme';

import { SettingsScreen } from '../SettingsScreen';

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

const renderScreen = () => render(<SettingsScreen />, { wrapper: Providers });

beforeEach(() => {
  // El store es global: se restaura a los valores por defecto entre tests.
  useSettingsStore.setState({
    hapticsEnabled: true,
    themeMode: 'system',
    volume: DEFAULT_VOLUME,
  });
});

describe('SettingsScreen', () => {
  it('muestra las secciones de ajustes', async () => {
    await renderScreen();

    expect(screen.getByText('Configuración')).toBeOnTheScreen();
    expect(screen.getByText('Háptica')).toBeOnTheScreen();
    expect(screen.getByText('Volumen')).toBeOnTheScreen();
    expect(screen.getByText('Créditos')).toBeOnTheScreen();
    for (const option of ['Claro', 'Oscuro', 'Sistema']) {
      expect(screen.getByText(option)).toBeOnTheScreen();
    }
  });

  it('el volumen arranca a la mitad del recorrido', async () => {
    await renderScreen();

    expect(screen.getByLabelText('Volumen')).toHaveAccessibilityValue({
      now: 50,
      min: 0,
      max: 100,
    });
  });

  it('subir el volumen con accesibilidad lo guarda en el store', async () => {
    await renderScreen();

    fireEvent(screen.getByLabelText('Volumen'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(useSettingsStore.getState().volume).toBeGreaterThan(DEFAULT_VOLUME);
  });

  it('apagar el toggle desactiva la háptica en el store', async () => {
    await renderScreen();

    fireEvent(screen.getByRole('switch', { name: 'Háptica' }), 'valueChange', false);

    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);
  });

  it('elegir un modo de apariencia lo guarda en el store', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('Oscuro'));

    expect(useSettingsStore.getState().themeMode).toBe('dark');
  });
});
