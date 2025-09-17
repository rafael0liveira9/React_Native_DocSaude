import { Login } from "@/api/auth";
import { Colors } from "@/constants/Colors";
import { styles } from "@/styles/auth";
import { globalStyles } from "@/styles/global";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const themeColors = Colors["dark"],
    router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false),
    [email, setEmail] = useState<string>(""),
    [password, setPassword] = useState<string>(""),
    [textError, setTexterror] = useState<string>("");

  async function handleLogin() {
    if (!!email && email.length > 1 && !!password && password.length > 1) {
      setTexterror("");
      setIsLoading(true);
      Keyboard.dismiss();
      const res = await Login(email, password);

      if (res?.token) {
        try {
          await SecureStore.setItemAsync("user-token", res?.token);
          Toast.show({
            type: "success",
            text1: `Login efetuado para ${email}`,
          });
          router.replace("/(main)");
        } catch (error) {
          console.log("error", error);
          setIsLoading(false);
        }
      } else {
        setTexterror("* Email ou senha incorretos.");
        Toast.show({
          type: "error",
          text1: "Email ou senha incorretos.",
        });
      }

      setIsLoading(false);
    } else {
      setTexterror("* Preencha com e-mail e senha para logar.");
      Toast.show({
        type: "error",
        text1: "Preencha com os dados de e-mail e senha para logar.",
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        globalStyles.flexc,
        globalStyles.wfull,
        { flex: 1, backgroundColor: themeColors.background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: "7%",
          gap: 20,
          borderWidth: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          style={styles.logo}
          source={require(`@/assets/docsaude/LOGO-TOTALDOC-todo-branco-fundo-transparente.png`)}
        />
        <View style={{ height: 50 }} />

        <TextInput
          placeholder="Usuário"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          style={[
            styles.loginInputStyle,
            {
              borderColor: themeColors.backgroundSecondary,
              color: themeColors.backgroundSecondary,
            },
          ]}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[
            styles.loginInputStyle,
            {
              borderColor: themeColors.backgroundSecondary,
              color: themeColors.backgroundSecondary,
            },
          ]}
        />

        <View style={{ height: 30 }} />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={[styles.loginBtnStyle, { backgroundColor: themeColors.tint }]}
        >
          <Text
            style={{
              color: themeColors.background,
              fontWeight: "900",
              fontSize: 24,
            }}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: themeColors.danger,
            fontWeight: "900",
            fontSize: 14,
            width: "100%",
            paddingHorizontal: 20,
          }}
        >
          {textError}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
