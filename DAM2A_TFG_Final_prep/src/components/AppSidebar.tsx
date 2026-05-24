/**
 * AppSidebar — navegacion lateral para tablet y desktop.
 *
 * Tablet  (md, 640-1023 px): 72 px de ancho, solo iconos centrados.
 * Desktop (lg/xl, >=1024 px): 220 px de ancho, icono + etiqueta.
 */

import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Logo } from '@/src/components/Logo';
import { Fonts, Spacing } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  route: string;
  label: string;
  icon: IoniconName;
  iconOutline: IoniconName;
}

const NAV_ITEMS: NavItem[] = [
  { route: '/home',     label: 'Inicio',  icon: 'home',        iconOutline: 'home-outline'        },
  { route: '/wardrobe', label: 'Armario', icon: 'shirt',       iconOutline: 'shirt-outline'       },
  { route: '/add',      label: 'Añadir',  icon: 'add-circle',  iconOutline: 'add-circle-outline'  },
  { route: '/social',   label: 'Social',  icon: 'people',      iconOutline: 'people-outline'      },
  { route: '/market',   label: 'Tienda',  icon: 'storefront',  iconOutline: 'storefront-outline'  },
  { route: '/profile',  label: 'Perfil',  icon: 'person',      iconOutline: 'person-outline'      },
];

export const AppSidebar: React.FC = () => {
  const { isDesktop } = useBreakpoint();
  const colors = useThemeColor();
  const router = useRouter();
  const pathname = usePathname();

  const sidebarWidth = isDesktop ? 224 : 72;
  const showLabel = isDesktop;

  return (
    <View
      style={[
        styles.sidebar,
        { width: sidebarWidth, backgroundColor: colors.background, borderRightColor: colors.border },
      ]}
    >
      {/* Logo area */}
      <View style={[styles.logoArea, { borderBottomColor: colors.border }]}>
        {showLabel ? (
          <Logo variant="inline" size={28} />
        ) : (
          <Logo variant="monogram" size={32} />
        )}
      </View>

      {/* Nav items */}
      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(item.route + '/');

          return (
            <Pressable
              key={item.route}
              onPress={() => router.navigate(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                showLabel ? styles.navItemWide : styles.navItemIcon,
                isActive && styles.navItemActive,
                isActive && { backgroundColor: colors.backgroundSecondary },
                !isActive && pressed && { opacity: 0.55 },
              ]}
            >
              {isActive && showLabel && (
                <View style={[styles.activeBar, { backgroundColor: colors.text }]} />
              )}

              <Ionicons
                name={isActive ? item.icon : item.iconOutline}
                size={20}
                color={isActive ? colors.text : colors.textMuted}
              />

              {showLabel && (
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: isActive ? colors.text : colors.textMuted,
                      fontFamily: Fonts.sans,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  navList: {
    flex: 1,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  navItem: {
    borderRadius: 8,
    paddingVertical: Spacing.md,
    overflow: 'hidden',
  },
  navItemActive: {},
  navItemIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
