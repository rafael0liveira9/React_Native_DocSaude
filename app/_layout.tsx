import { registerForPushNotificationsAsync } from "@/api/firebase";
import { Colors } from "@/constants/Colors";
import { DocSaudeContainer } from "@/controllers/context"; // 👈 importa o provider
import SplashScreen from "@/view/splashScreen";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const themeColors = Colors["dark"];
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  async function getToken() {
    try {
      const token = await SecureStore.getItemAsync("user-token");
      return token;
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
      return null;
    }
  }

  async function FirebaseToken() {
    const expoPushToken = await registerForPushNotificationsAsync();
    console.log("Expo Push Token:", expoPushToken);
  }

  useEffect(() => {
    FirebaseToken();
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        const storedToken = await getToken();
        setToken(storedToken);
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!isReady || hasRedirected) return;

    setHasRedirected(true);

    if (token) {
      router.replace("/(main)");
    } else {
      router.replace("/(auth)");
    }
  }, [isReady, token]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <DocSaudeContainer>
      <SafeAreaView
        style={{
          flex: 1,
          height: "100%",
          backgroundColor: themeColors.background,
        }}
      >
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
        <Toast />
      </SafeAreaView>
    </DocSaudeContainer>
  );
}
