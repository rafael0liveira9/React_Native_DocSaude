import { Colors } from "@/constants/Colors";
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
  const [token, setToken] = useState<string | null>(),
    [hasRedirected, setHasRedirected] = useState(false),
    [isReady, setIsReady] = useState(false);

  async function getToken() {
    try {
      const token = await SecureStore.getItemAsync("user-token");
      return token;
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
      return null;
    }
  }

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
    return <SplashScreen></SplashScreen>;
  }

  return (
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
  );
}
