import { GetMyData } from "@/api/auth";
import ThemeContext from "@/controllers/context";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

export function useAuth() {
  const { user, setUser } = useContext(ThemeContext)!;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = await SecureStore.getItemAsync("user-token");
        if (!token) {
          router.replace("/(auth)");
          return;
        }

        const userData = await GetMyData(token);
        if (!!userData?.id) {
          setUser(userData);
        } else {
          Toast.show({ type: "error", text1: "Usuário não encontrado." });
          router.replace("/(auth)");
        }
      } catch (error) {
        console.error("Erro ao recuperar token:", error);
        router.replace("/(auth)");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, isLoading };
}
