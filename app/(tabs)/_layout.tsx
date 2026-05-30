import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/partner')}
              style={tabStyles.sociosBtn}
            >
              <Text style={tabStyles.sociosBtnText}>Socios</Text>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  sociosBtn: {
    minWidth: 72,
    minHeight: 48,
    marginRight: 12,
    backgroundColor: "#FF6A00",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  sociosBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
