import { Stack } from "expo-router";

export default function MainLayout() {
  return <MainLayoutContent />;
}

function MainLayoutContent() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
