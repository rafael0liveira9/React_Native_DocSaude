import Constants from "expo-constants";
import { Alert, Platform } from "react-native";
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

// ===== DEBUG: Logs visíveis no app via Alert =====
const debugLogs: string[] = [];

function logStep(step: string, extra?: Record<string, any>) {
  const msg = extra ? `${step} | ${JSON.stringify(extra)}` : step;
  console.log(`[LOGIN] ${msg}`);
  debugLogs.push(msg);
}

function showDebugAlert(title: string, error?: any) {
  const errorInfo = error
    ? `\n\nERRO: ${error.message || error}\nCODE: ${error.code || "N/A"}\nTYPE: ${error.name || typeof error}`
    : "";
  const logs = debugLogs.join("\n");
  Alert.alert(
    `DEBUG: ${title}`,
    `${logs}${errorInfo}\n\nPlatform: ${Platform.OS}\nAppOwnership: ${Constants.appOwnership}\nExpoGo: ${isExpoGo}`,
    [{ text: "OK" }]
  );
}

/**
 * Login com CPF e senha
 */
export async function Login(cpf: string, password: string) {
  const cleanCpf = cpf.replace(/\D/g, "");

  const API_URL = "https://vpaa97q6g8.execute-api.us-east-1.amazonaws.com/dev";
  const endpoint = `${API_URL}/auth/login`;

  logStep("1_FETCH_START", { endpoint, platform: Platform.OS, isExpoGo, appOwnership: Constants.appOwnership });

  // Usar fetch nativo em vez de axios para evitar ERR_NETWORK no iOS
  let fetchResponse: Response;
  try {
    fetchResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: cleanCpf, senha: password }),
    });
  } catch (fetchError: any) {
    showDebugAlert("FETCH FALHOU", fetchError);
    throw fetchError;
  }

  logStep("2_FETCH_RESPONSE", { status: fetchResponse.status, ok: fetchResponse.ok });

  let data: any;
  try {
    data = await fetchResponse.json();
  } catch (jsonError: any) {
    recordError("2_JSON_PARSE_FAILED", jsonError);
    throw jsonError;
  }

  logStep("3_DATA_PARSED", {
    success: data?.success,
    hasToken: !!data?.data?.token,
    hasUser: !!data?.data?.user,
  });

  if (data.success) {
    return {
      id: data.data.user.id,
      token: data.data.token,
      user: data.data.user,
      dependentes: data.data.dependentes || [],
    };
  }
  logStep("3_LOGIN_REJECTED", { message: data?.message || "success=false" });
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
export async function handleLogin(cpf: string, password: string): Promise<{ data: any; pushToken?: string } | { error: string; detail?: string }> {
  // Setar atributos no Crashlytics para identificar a sessão
  if (crashlytics) {
    try {
      crashlytics().setAttribute("login_cpf", cpf.replace(/\D/g, "").slice(0, 4) + "***");
      crashlytics().setAttribute("platform", Platform.OS);
      crashlytics().setAttribute("isExpoGo", String(isExpoGo));
      crashlytics().setAttribute("appOwnership", String(Constants.appOwnership));
    } catch (_) {}
  }

  logStep("0_HANDLE_LOGIN_START");

  try {
    const response = await Login(cpf, password);

    if (!response) {
      logStep("4_CREDENTIALS_INVALID");
      return { error: "credentials" };
    }

    logStep("4_LOGIN_SUCCESS", { userId: response.id });

    // Analytics - não bloqueia login
    if (analytics) {
      try {
        await analytics().logEvent("login_success", { userId: response.id });
      } catch (error) {
        logStep("5_ANALYTICS_ERROR", { message: (error as any)?.message });
      }
    }

    // Push notifications - não bloqueia login
    let pushToken;
    try {
      logStep("6_PUSH_TOKEN_START");
      pushToken = await registerForPushNotificationsAsync();
      logStep("6_PUSH_TOKEN_OK", { hasToken: !!pushToken });

      if (pushToken && pushToken !== "expo-go-mock-token") {
        try {
          await registerDeviceToken(pushToken, response.id);
          logStep("7_DEVICE_TOKEN_REGISTERED");
        } catch (error) {
          logStep("7_DEVICE_TOKEN_ERROR", { message: (error as any)?.message });
        }
      }
    } catch (error) {
      logStep("6_PUSH_TOKEN_ERROR", { message: (error as any)?.message });
    }

    logStep("8_LOGIN_COMPLETE");
    return {
      data: response,
      pushToken,
    };
  } catch (error: any) {
    showDebugAlert("LOGIN ERRO GERAL", error);
    return {
      error: "network",
      detail: `${error.code || ""} ${error.message || ""}`.trim(),
    };
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
