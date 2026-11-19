import { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { HeaderAction } from '@/shared/design-system';

/**
 * El engranaje de Configuración que llevan las cabeceras de todas las
 * pestañas. Configuración no es pestaña: se abre encima, desde cualquiera.
 */
export function useSettingsAction(): HeaderAction {
  const router = useRouter();
  return useMemo(
    () => ({
      icon: 'cog',
      accessibilityLabel: 'Configuración',
      onPress: () => router.push('/settings'),
    }),
    [router],
  );
}
