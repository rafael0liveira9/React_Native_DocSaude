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
export async function handleLogin(cpf: string, password: string): Promise<{ data: any; pushToken?: string } | { error: string }> {
  try {
    console.log("[LOGIN] Iniciando login...");
    const response = await Login(cpf, password);

    if (!response) {
      console.log("[LOGIN] Login falhou: credenciais inválidas");
      return { error: "credentials" };
    }

    console.log("[LOGIN] Login bem-sucedido, registrando analytics...");
    if (analytics) {
      try {
        await analytics().logEvent("login_success", {
          userId: response.id,
          cpf: response.user.cpf,
        });
      } catch (error) {
        console.warn("[LOGIN] Erro ao registrar analytics, continuando...", error);
      }
    }

    // Registra token de push notifications - não bloquear login se falhar
    let pushToken;
    try {
      pushToken = await registerForPushNotificationsAsync();
      if (pushToken && pushToken !== "expo-go-mock-token") {
        try {
          await registerDeviceToken(pushToken, response.id);
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
    console.error("[LOGIN] Erro no login:", {
      message: error.message,
      status: error.response?.status,
      code: error.code,
    });
    if (crashlytics) {
      try { crashlytics().recordError(error); } catch (e) {}
    }
    // Diferenciar erro de rede vs credenciais
    if (error.response) {
      // Servidor respondeu com erro (401, 400, etc)
      return { error: "credentials" };
    }
    // Erro de rede (timeout, DNS, sem internet)
    return { error: "network" };
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
