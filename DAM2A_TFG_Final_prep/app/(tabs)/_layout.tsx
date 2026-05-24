import { auth } from '@/src/config/firebase';
import { getUser } from '@/src/service/userService';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { AppSidebar } from '@/src/components';
import { Fonts } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

export default function TabLayout() {
  const [loading, setLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const router = useRouter();
  const colors = useThemeColor();
  const { isTablet, isDesktop } = useBreakpoint();
  const isWide = isTablet || isDesktop;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
        // Cargar foto del perfil para mostrarla en el tab de perfil
        getUser(user.uid).then(data => {
          setUserPhoto(data?.photoURL ?? user.photoURL ?? null);
        }).catch(() => {});
      }
      else router.replace('/');
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column', backgroundColor: colors.background }}>
      {isWide && <AppSidebar />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.textMuted,
            headerShown: false,
            tabBarShowLabel: true,
            tabBarStyle: isWide
              ? { display: 'none' }
              : {
                  height: 78,
                  paddingTop: 8,
                  paddingBottom: 18,
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                  borderTopWidth: 1,
                  elevation: 0,
                  shadowOpacity: 0,
                },
            tabBarLabelStyle: {
              fontFamily: Fonts.sans,
              fontSize: 9,
              fontWeight: '600',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginTop: 3,
            },
            tabBarIconStyle: { marginBottom: 0 },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="wardrobe"
            options={{
              title: 'Armario',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'shirt' : 'shirt-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="add"
            options={{
              title: 'Añadir',
              tabBarIcon: ({ color, focused }) => (
                <View
                  style={{
                    width: 44,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: focused ? colors.text : 'transparent',
                    borderWidth: focused ? 0 : 1.5,
                    borderColor: colors.textMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="add"
                    size={22}
                    color={focused ? colors.primaryText : colors.textMuted}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="social"
            options={{
              title: 'Social',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="market"
            options={{
              title: 'Tienda',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ focused }) =>
                userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      borderWidth: focused ? 2 : 1.5,
                      borderColor: focused ? colors.text : colors.textMuted,
                    }}
                  />
                ) : (
                  <Ionicons
                    name={focused ? 'person-circle' : 'person-circle-outline'}
                    size={27}
                    color={focused ? colors.text : colors.textMuted}
                  />
                ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
