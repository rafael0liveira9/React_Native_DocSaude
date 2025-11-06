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
  Linking,
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

  async function successLogin(string: string) {
    Toast.show({
      type: "success",
      text1: `Login efetuado para ${string}`,
    });

    // Pequeno delay para garantir que tokens estão salvos no SecureStore
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log("[LOGIN] Redirecionando para /(main)...");
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
        await setTokens();
        await successLogin(userName);
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

  async function setTokens(token?: string, id?: number) {
    const tokenToSave = token || userToken;
    const idToSave = id || userId;

    if (!!tokenToSave && idToSave) {
      console.log("[LOGIN] Salvando tokens no SecureStore...");
      await SecureStore.setItemAsync("user-token", tokenToSave);
      await SecureStore.setItemAsync("user-id", String(idToSave));
      console.log("[LOGIN] Tokens salvos com sucesso");
    } else {
      console.warn("[LOGIN] Tentativa de salvar tokens sem dados:", {
        tokenToSave: !!tokenToSave,
        idToSave
      });
    }
  }

  async function handleLoginFunction() {
    if (!!cpf && cpf.length > 1 && !!password && password.length > 1) {
      setTexterror("");
      setIsLoading(true);
      Keyboard.dismiss();

      console.log("[LOGIN_SCREEN] Iniciando processo de login...");
      const res = await handleLogin(cpf, password);
      console.log("[LOGIN_SCREEN] Resposta do handleLogin:", {
        hasData: !!res?.data,
        hasToken: !!res?.data?.token,
        hasUser: !!res?.data?.user,
      });

      if (res?.data?.token) {
        try {
          console.log("[LOGIN_SCREEN] Token recebido, processando dados do usuário");
          setUserToken(res?.data.token);
          setUserName(res?.data?.user?.nome || cpf);
          setUserId(res?.data?.user?.id);

          if (res.pushToken) {
            console.log("[LOGIN_SCREEN] Salvando push token");
            await SecureStore.setItemAsync("expo-push-token", res.pushToken);
          }

          const termoAceito = res?.data?.user?.termo_uso_aceito;
          console.log("[LOGIN_SCREEN] Verificando termo de uso:", termoAceito);

          if (!termoAceito || termoAceito === 0) {
            console.log("[LOGIN_SCREEN] Termo não aceito, exibindo modal");
            setShowTermsModal(true);
          } else {
            console.log("[LOGIN_SCREEN] Termo já aceito, salvando tokens e redirecionando");
            await setTokens(res?.data.token, res?.data?.user?.id);
            await successLogin(res?.data?.user?.nome || cpf);
          }
        } catch (error) {
          console.error("[LOGIN_SCREEN] Erro ao processar login:", error);
          setIsLoading(false);
          Toast.show({
            type: "error",
            text1: "Erro ao processar login. Tente novamente.",
          });
        }
      } else {
        console.warn("[LOGIN_SCREEN] Login falhou: sem token na resposta");
        setTexterror("* CPF ou senha incorretos.");
        Toast.show({
          type: "error",
          text1: "CPF ou senha incorretos.",
        });
      }

      setIsLoading(false);
    } else {
      console.warn("[LOGIN_SCREEN] Campos vazios");
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
          paddingVertical: 30,
          gap: 15,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          style={styles.logo}
          source={require(`@/assets/docsaude/LOGO-TOTALDOC-todo-branco-fundo-transparente.png`)}
        />
        <View style={{ height: 20 }} />

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

        <View style={{ height: 10 }} />

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

        <View style={{ height: 10 }} />

        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.totaldoc.com.br/politica-de-privacidade")}
          style={{ marginBottom: 10 }}
        >
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: 12,
              textAlign: "center",
              textDecorationLine: "underline",
            }}
          >
            Política de Privacidade
          </Text>
        </TouchableOpacity>
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
