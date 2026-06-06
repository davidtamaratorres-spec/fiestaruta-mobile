import { Stack } from 'expo-router';

export default function PartnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Socios DishQuest' }}
      />
      <Stack.Screen
        name="auth"
        options={{ title: 'Acceso socio' }}
      />
      <Stack.Screen
        name="home"
        options={{ title: 'Mi restaurante' }}
      />
    </Stack>
  );
}
