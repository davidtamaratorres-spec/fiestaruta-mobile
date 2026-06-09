import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E8521A",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "#222222",
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: "#0D0D0D" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "DishQuest",
          tabBarLabel: "Buscar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="magnifyingglass" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Soy Socio",
          tabBarLabel: "Socio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
