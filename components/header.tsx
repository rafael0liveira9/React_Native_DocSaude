import { Colors } from "@/constants/Colors";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/header";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { LogoutModal } from "./fragments/modalLogout";

export default function Header({ notify }: any) {
  const themeColors = Colors["dark"];
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  async function Logout() {
    try {
      setIsLoading(true);
      const keysToDelete = ["user-token", "expo-push-token"];
      await Promise.all(
        keysToDelete.map((key) => SecureStore.deleteItemAsync(key))
      );

      setIsLoading(false);
      router.replace("/(auth)");
    } catch (error) {
      console.error("Erro ao limpar SecureStore:", error);
      setIsLoading(false);
    }
  }

  return (
    <View
      style={[
        globalStyles.flexr,
        globalStyles.wfull,
        {
          justifyContent: "space-between",
          paddingHorizontal: "7%",
          paddingVertical: 20,
        },
      ]}
    >
      {isLogoutModalOpen && (
        <LogoutModal
          warningVisible={isLogoutModalOpen}
          themeColors={themeColors}
          text={"Deseja sair da conta?"}
          onConfirm={() => Logout()}
          close={() => setIsLogoutModalOpen(false)}
          isLoading={isLoading}
        ></LogoutModal>
      )}
      <Image
        style={{
          height: 70,
          width: 120,
          objectFit: "contain",
        }}
        source={require(`@/assets/docsaude/LOGO-TOTALDOC-todo-branco-fundo-transparente.png`)}
      />
      <View
        style={[globalStyles.flexr, { gap: 30, justifyContent: "flex-end" }]}
      >
        <TouchableOpacity style={styles.notifyIconBox}>
          {notify.length > 0 && (
            <View
              style={[
                globalStyles.flexr,
                styles.notifyFloat,
                { backgroundColor: themeColors.danger },
              ]}
            >
              <Text style={{ fontSize: 12, color: themeColors.white }}>
                {notify.length}
              </Text>
            </View>
          )}
          <FontAwesome5
            name="bell"
            size={30}
            color={themeColors.backgroundSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogoutModalOpen(true)}>
          <FontAwesome5
            name="user"
            size={30}
            color={themeColors.backgroundSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
