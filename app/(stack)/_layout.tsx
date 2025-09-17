import { Colors } from "@/constants/Colors";
import { DocSaudeContainer } from "@/controllers/context";
import { useAuth } from "@/controllers/useAuth";
import SplashScreen from "@/view/splashScreen";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function MainLayout() {
  return (
    <DocSaudeContainer>
      <StackLayoutContent />
    </DocSaudeContainer>
  );
}

function StackLayoutContent() {
  const { user, isLoading } = useAuth();
  const themeColors = Colors["dark"];
  const router = useRouter();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.backgroundSecondary,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 28,
        },
        headerShadowVisible: false,
        headerLeft: () => {
          return (
            <Pressable
              onPress={() => router.back()}
              style={{ marginRight: 30 }}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={themeColors.backgroundSecondary}
              />
            </Pressable>
          );
        },
      }}
    >
      <Stack.Screen
        name="accredited/index"
        options={{
          title: "Rede Credenciada",
        }}
      />
      <Stack.Screen
        name="example/index"
        options={{
          title: "pagina exemplo",
        }}
      />
    </Stack>
  );
}
