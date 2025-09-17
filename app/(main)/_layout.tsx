import { DocSaudeContainer } from "@/controllers/context";
import { useAuth } from "@/controllers/useAuth";
import SplashScreen from "@/view/splashScreen";
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <DocSaudeContainer>
      <MainLayoutContent />
    </DocSaudeContainer>
  );
}

function MainLayoutContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
