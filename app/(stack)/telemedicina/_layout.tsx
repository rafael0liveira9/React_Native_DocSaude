import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function TelemedicinaLayout() {
  const themeColors = Colors["dark"];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitle: "Voltar",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="consulta-imediata"
        options={{
          title: "Consulta Imediata",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="video-call"
        options={{
          title: "Videochamada",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
