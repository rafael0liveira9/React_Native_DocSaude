import Constants from "expo-constants";
import api from "./config";
import { registerForPushNotificationsAsync } from "./firebase";
import { registerDeviceToken } from "./notifications";

// Check if running in Expo Go (Firebase won't work in Expo Go)
const isExpoGo = Constants.appOwnership === "expo";

// Conditional imports - only load Firebase in development builds
let analytics: any = null;
let crashlytics: any = null;

if (!isExpoGo) {
  try {
    analytics = require("@react-native-firebase/analytics").default;
    crashlytics = require("@react-native-firebase/crashlytics").default;
  } catch (error) {
    console.warn("Firebase modules not available (running in Expo Go)");
  }
}

/**
 * Login com CPF e senha
 */
export async function Login(cpf: string, password: string) {
  try {
    const response = await api.post("/auth/login", {
      cpf: cpf.replace(/\D/g, ""), // Remove formatação do CPF
      senha: password,
    });

    if (response.data.success) {
      return {
        id: response.data.data.user.id,
        token: response.data.data.token,
        user: response.data.data.user,
        dependentes: response.data.data.dependentes || [],
      };
    }
    return null;
  } catch (error: any) {
    console.error("Erro no login:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Buscar dados do usuário logado
 */
export async function GetMyData(userId: number, token: string) {
  try {
    const response = await api.get(`/assinantes/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      const userData = response.data.data;
      const formattedData = {
        id: userData.id,
        email: userData.email,
        name: userData.nome,
        document: userData.cpf,
        number: userData.numero_carteirinha,
        birthDate: userData.data_nascimento,
        phone: userData.telefone,
        cellphone: userData.celular,
        address: `${userData.endereco}, ${userData.numero}${
          userData.complemento ? " - " + userData.complemento : ""
        }`,
        city: userData.cidade,
        state: userData.estado,
        type: userData.tipo_plano,
        typeName: userData.nome_plano || "",
        companyName: userData.empresa_nome || "",
        dependentes: userData.dependentes || [],
      };
      return formattedData;
    }
    return null;
  } catch (error: any) {
    console.error(
      "Erro ao buscar dados:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Função principal de login
 */
export async function handleLogin(cpf: string, password: string) {
  try {
    const response = await Login(cpf, password);

    if (!response) {
      if (crashlytics) {
        crashlytics().log("Login falhou: dados inválidos");
        crashlytics().recordError(
          new Error("Login falhou: CPF ou senha incorretos")
        );
      } else {
        console.log("[MOCK] Login falhou: dados inválidos");
      }
      return null;
    }

    if (analytics) {
      await analytics().logEvent("login_success", {
        userId: response.id,
        cpf: response.user.cpf,
      });
    } else {
      console.log("[MOCK] Login success event logged");
    }

    // Registra token de push notifications
    const pushToken = await registerForPushNotificationsAsync();

    // Envia token para o backend se foi obtido com sucesso
    if (pushToken && pushToken !== "expo-go-mock-token") {
      await registerDeviceToken(pushToken, response.id);
    }

    return {
      data: response,
      pushToken,
    };
  } catch (error: any) {
    if (crashlytics) {
      crashlytics().recordError(error);
    } else {
      console.log("[MOCK] Error logged:", error);
    }
    console.error("Erro no login:", error);
    return null;
  }
}

export async function TermsAccept(token: string) {
  try {
    const response = await api.post(
      "/aceitar-termo",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  } catch (error: any) {
    console.error(
      "Erro ao aceitar termos:",
      error.response?.data || error.message
    );
    throw error;
  }
}
