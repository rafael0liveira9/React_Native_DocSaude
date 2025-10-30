import { handleLogin, TermsAccept } from "@/api/auth";
import { getTermosDeUso } from "@/api/termsOfUse";
import { TermsOfUseModal } from "@/components/fragments/modalTermsOfUse";
import { Colors } from "@/constants/Colors";
import { styles } from "@/styles/auth";
import { globalStyles } from "@/styles/global";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
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
    [termsOfUse, setTermsOfUse] = useState<string>(""),
    [cpf, setCpf] = useState<string>(""),
    [password, setPassword] = useState<string>(""),
    [textError, setTexterror] = useState<string>(""),
    [showTermsModal, setShowTermsModal] = useState<boolean>(false),
    [userToken, setUserToken] = useState<string>(""),
    [userId, setUserId] = useState<any>(null),
    [userName, setUserName] = useState<string>("");

  // Formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2], match[3], match[4]]
        .filter(Boolean)
        .join(".")
        .replace(/\.(\d{2})$/, "-$1");
    }
    return value;
  };

  function successLogin(string: string) {
    Toast.show({
      type: "success",
      text1: `Login efetuado para ${string}`,
    });

    router.replace("/(main)");
  }

  async function getTerms() {
    setIsLoading(true);
    try {
      const response = await getTermosDeUso();
      if (response) {
        setTermsOfUse(response);
      }
    } catch (error) {
      console.log("Erro ao pegar termos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcceptTerms() {
    try {
      const response = await TermsAccept(userToken);

      if (response?.status === 200) {
        Toast.show({
          type: "success",
          text1: "Termos aceitos com sucesso!",
        });
        setShowTermsModal(false);
        setTokens();
        successLogin(userName);
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao aceitar os termos. Tente novamente.",
        });
      }
    } catch (error) {
      setShowTermsModal(false);
      console.log("Erro ao aceitar termos:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao aceitar os termos. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function setTokens() {
    if (!!userToken && userId) {
      await SecureStore.setItemAsync("user-token", userToken);
      await SecureStore.setItemAsync("user-id", String(userId));
    }
  }

  async function handleLoginFunction() {
    if (!!cpf && cpf.length > 1 && !!password && password.length > 1) {
      setTexterror("");
      setIsLoading(true);
      Keyboard.dismiss();
      const res = await handleLogin(cpf, password);

      if (res?.data?.token) {
        try {
          setUserToken(res?.data.token);
          setUserName(res?.data?.user?.nome || cpf);
          setUserId(res?.data?.user?.id);

          if (res.pushToken) {
            await SecureStore.setItemAsync("expo-push-token", res.pushToken);
          }
          console.log(
            "res?.data?.user?.termo_uso_aceito",
            res?.data?.user?.termo_uso_aceito
          );

          if (
            !res?.data?.user?.termo_uso_aceito ||
            res?.data?.user?.termo_uso_aceito === 0
          ) {
            setShowTermsModal(true);
          } else {
            setTokens();
            successLogin(res?.data?.user?.nome || cpf);
          }
        } catch (error) {
          console.log("error", error);
          setIsLoading(false);
        }
      } else {
        setTexterror("* CPF ou senha incorretos.");
        Toast.show({
          type: "error",
          text1: "CPF ou senha incorretos.",
        });
      }

      setIsLoading(false);
    } else {
      setTexterror("* Preencha com CPF e senha para logar.");
      Toast.show({
        type: "error",
        text1: "Preencha com os dados de CPF e senha para logar.",
      });
    }
  }

  useEffect(() => {
    getTerms();
  }, []);

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
          placeholder="CPF"
          placeholderTextColor="#ccc"
          value={cpf}
          onChangeText={(text) => setCpf(formatCPF(text))}
          keyboardType="numeric"
          maxLength={14}
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
          onPress={handleLoginFunction}
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

      <TermsOfUseModal
        visible={showTermsModal}
        themeColors={themeColors}
        text="Termos de Uso"
        termsLink=""
        isLoading={isLoading}
        onConfirm={handleAcceptTerms}
        onCancel={() => {
          setShowTermsModal(false);
          Toast.show({
            type: "info",
            text1: "Você precisa aceitar os termos para continuar.",
          });
        }}
        close={() => {
          setShowTermsModal(false);
          Toast.show({
            type: "info",
            text1: "Você precisa aceitar os termos para continuar.",
          });
        }}
        termsOfUse={termsOfUse}
      />
    </KeyboardAvoidingView>
  );
}
