import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hapticPressIn } from '@/shared/haptics';
import { spacing, useTheme } from '@/shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Icono por ruta. Íconos redondeados y "juguetones" (MaterialCommunityIcons). */
const TAB_ICONS: Record<string, IconName> = {
  index: 'music-circle',
  settings: 'cog',
  home: 'home-heart',
  profile: 'emoticon-happy',
};

/**
 * Forma mínima de las props que Expo Router (react-navigation) pasa a un
 * `tabBar` personalizado. Se tipa localmente porque expo-router no expone
 * `BottomTabBarProps` públicamente.
 */
export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<
    string,
    { options: { title?: string; tabBarItemStyle?: { display?: string } } }
  >;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
  };
}

/** Barra de navegación inferior estilo Duolingo: solo íconos, sin texto. */
export function DuolingoTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Las rutas ocultas (href: null) llegan con tabBarItemStyle display: 'none'.
  const visibleRoutes = state.routes.filter(
    (route) => descriptors[route.key]?.options.tabBarItemStyle?.display !== 'none',
  );

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: insets.bottom + spacing.sm,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        const label = descriptors[route.key]?.options.title ?? route.name;
        const color = focused ? colors.tabActive : colors.tabInactive;

        const onPress = () => {
          hapticPressIn();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.item}
          >
            <MaterialCommunityIcons name={TAB_ICONS[route.name] ?? 'circle'} size={30} color={color} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
