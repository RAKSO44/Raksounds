import { ReactNode } from 'react';
import { Linking } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { CreditsScreen } from '../CreditsScreen';

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

const renderScreen = () => render(<CreditsScreen />, { wrapper: Providers });

describe('CreditsScreen', () => {
  it('acredita al autor de la app', async () => {
    await renderScreen();

    expect(screen.getByText('Oscar Alonso Cruzalegui Castillo')).toBeOnTheScreen();
  });

  it('muestra el mensaje del autor', async () => {
    await renderScreen();

    expect(screen.getByText(/ensamble de AdhaC/)).toBeOnTheScreen();
  });

  it('no menciona colaboradores internos (eso se queda en docs)', async () => {
    await renderScreen();

    expect(screen.queryByText('Claude Code')).not.toBeOnTheScreen();
  });

  it('cumple la atribución CC BY de las muestras: autor, licencia y modificación', async () => {
    await renderScreen();

    expect(screen.getByText(/Alexander Holm/)).toBeOnTheScreen();
    expect(screen.getByText('Licencia CC BY 3.0')).toBeOnTheScreen();
    expect(screen.getByText(/fueron modificadas/)).toBeOnTheScreen();
  });

  it('tocar el nombre del autor abre su correo', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText('Oscar Alonso Cruzalegui Castillo'));

    expect(openURL).toHaveBeenCalledWith('mailto:oscarcruzaleguicastillo@gmail.com');
    openURL.mockRestore();
  });
});
