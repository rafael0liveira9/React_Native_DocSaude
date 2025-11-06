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
    const cleanCpf = cpf.replace(/\D/g, "");
    console.log("[API] Tentando login para CPF:", cleanCpf);

    const response = await api.post("/auth/login", {
      cpf: cleanCpf,
      senha: password,
    });

    console.log("[API] Resposta recebida:", {
      status: response.status,
      success: response.data?.success,
      hasToken: !!response.data?.data?.token,
      hasUser: !!response.data?.data?.user,
    });

    if (response.data.success) {
      return {
        id: response.data.data.user.id,
        token: response.data.data.token,
        user: response.data.data.user,
        dependentes: response.data.data.dependentes || [],
      };
    }
    console.warn("[API] Login falhou: success = false");
    return null;
  } catch (error: any) {
    console.error("[API] Erro no login:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
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
    console.log("[LOGIN] Iniciando login...");
    const response = await Login(cpf, password);

    if (!response) {
      console.log("[LOGIN] Login falhou: resposta vazia da API");
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

    console.log("[LOGIN] Login bem-sucedido, registrando analytics...");
    if (analytics) {
      try {
        await analytics().logEvent("login_success", {
          userId: response.id,
          cpf: response.user.cpf,
        });
        console.log("[LOGIN] Analytics registrado com sucesso");
      } catch (error) {
        console.warn("[LOGIN] Erro ao registrar analytics, continuando...", error);
      }
    } else {
      console.log("[MOCK] Login success event logged");
    }

    // Registra token de push notifications - não bloquear login se falhar
    let pushToken;
    try {
      console.log("[LOGIN] Registrando push notifications...");
      pushToken = await registerForPushNotificationsAsync();
      console.log("[LOGIN] Push token obtido:", pushToken ? "sucesso" : "sem token");

      // Envia token para o backend se foi obtido com sucesso
      if (pushToken && pushToken !== "expo-go-mock-token") {
        try {
          await registerDeviceToken(pushToken, response.id);
          console.log("[LOGIN] Token registrado no backend");
        } catch (error) {
          console.warn("[LOGIN] Erro ao registrar token no backend, continuando...", error);
        }
      }
    } catch (error) {
      console.warn("[LOGIN] Erro ao obter push token, continuando sem notificações...", error);
    }

    console.log("[LOGIN] Login completo, retornando dados");
    return {
      data: response,
      pushToken,
    };
  } catch (error: any) {
    console.error("[LOGIN] Erro crítico no login:", error);
    if (crashlytics) {
      try {
        crashlytics().recordError(error);
      } catch (e) {
        console.warn("[LOGIN] Erro ao registrar no crashlytics:", e);
      }
    } else {
      console.log("[MOCK] Error logged:", error);
    }
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
