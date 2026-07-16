import { render, screen } from '@testing-library/react-native';

import { LibraryScreen } from '../LibraryScreen';

// Prueba de sanidad: verifica que el pipeline jest-expo + RNTL funciona.
describe('LibraryScreen', () => {
  it('renderiza el título de la Librería', async () => {
    // Desde RNTL v14, render es asíncrono
    await render(<LibraryScreen />);
    expect(screen.getByText('Librería')).toBeOnTheScreen();
  });
});
