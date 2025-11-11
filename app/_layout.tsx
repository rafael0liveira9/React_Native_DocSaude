import {
  initializeNotificationListeners,
  setTokenRefreshHandler,
  setNotificationReceivedHandler,
  setNotificationTappedHandler,
} from "@/api/firebase";
import {
  registerDeviceToken,
  updateDeviceToken,
} from "@/api/notifications";
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
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

export default function RootLayout() {
  const themeColors = Colors["dark"];
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Carrega as fontes Montserrat
  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  async function getToken() {
    try {
      const token = await SecureStore.getItemAsync("user-token");
      return token;
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
      return null;
    }
  }

  // Inicializa os listeners de notificações
  useEffect(() => {
    // Configura handler para quando token é atualizado
    setTokenRefreshHandler(async (newToken) => {
      console.log("Token FCM atualizado, enviando para backend...");

      // Pega o token antigo do storage
      const oldToken = await SecureStore.getItemAsync("expo-push-token");

      // Atualiza no backend
      await updateDeviceToken(newToken, oldToken || undefined);

      // Salva o novo token no storage
      await SecureStore.setItemAsync("expo-push-token", newToken);
    });

    // Configura handler para notificações recebidas em foreground
    setNotificationReceivedHandler((notification) => {
      console.log("Notificação recebida em foreground:", notification);

      // Exibe toast para o usuário
      Toast.show({
        type: "info",
        text1: notification.notification?.title || "Nova notificação",
        text2: notification.notification?.body || "",
        visibilityTime: 4000,
        autoHide: true,
      });
    });

    // Configura handler para quando usuário toca na notificação
    setNotificationTappedHandler((notification) => {
      console.log("Usuário tocou na notificação:", notification);

      // Aqui você pode navegar para uma tela específica baseado nos dados da notificação
      // Exemplo: if (notification.data?.screen) { router.push(notification.data.screen); }
    });

    // Inicializa os listeners
    const cleanup = initializeNotificationListeners();

    // Cleanup quando componente desmontar
    return () => {
      if (cleanup) cleanup();
    };
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

  if (!isReady || !fontsLoaded) {
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
