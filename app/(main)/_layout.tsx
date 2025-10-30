import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function MainLayout() {
  return <MainLayoutContent />;
}

function MainLayoutContent() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  async function checkToken() {
    try {
      console.log("[MAIN LAYOUT] Verificando tokens...");
      const token = await SecureStore.getItemAsync("user-token");
      const userId = await SecureStore.getItemAsync("user-id");

      console.log("[MAIN LAYOUT] Token:", token ? "✅ Existe" : "❌ Não existe");
      console.log("[MAIN LAYOUT] UserId:", userId ? "✅ Existe" : "❌ Não existe");

      if (!token || !userId) {
        // Não tem token ou userId, volta para login
        console.log("[MAIN LAYOUT] Tokens não encontrados, redirecionando para /(auth)");
        router.replace("/(auth)");
      } else {
        // Tem token e userId, pode continuar
        console.log("[MAIN LAYOUT] Tokens OK, liberando acesso");
        setIsChecking(false);
      }
    } catch (error) {
      console.log("[MAIN LAYOUT] Erro ao verificar token:", error);
      // Em caso de erro, redireciona para login por segurança
      router.replace("/(auth)");
    }
  }

  // Enquanto verifica o token, mostra loading
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
