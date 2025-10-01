import analytics from "@react-native-firebase/analytics";
import crashlytics from "@react-native-firebase/crashlytics";
import { registerForPushNotificationsAsync } from "./firebase";

/**
 * Mock de login
 */
export async function Login(email: string, password: string) {
  if (password === "111111") {
    return {
      id: 1,
      email: "testerafael@hotmail.com",
      token: "teste-token",
    };
  }
  return null;
}

/**
 * Mock de dados do usuário
 */
export async function GetMyData(token: string) {
  if (token === "teste-token") {
    return {
      id: 1,
      email: "testerafael@hotmail.com",
      name: "Rafael Teste",
      companyName: "Empresa Teste S/A",
      document: "06473846980",
      number: "9999999999999999",
      birthDate: "1989-12-18T14:21:08.000Z",
      activationAt: "2024-08-22T14:21:08.000Z",
      validAt: "2027-02-22T14:21:08.000Z",
      token: "teste-token",
    };
  }
  return null;
}

/**
 * Função principal de login
 */
export async function handleLogin(email: string, password: string) {
  try {
    const response = await Login(email, password);

    if (!response) {
      crashlytics().log("Login falhou: dados inválidos");
      crashlytics().recordError(
        new Error("Login falhou: email ou senha incorretos")
      );
      return null;
    }

    // Log de evento no Firebase Analytics
    await analytics().logEvent("login_success", {
      userId: response.id,
      email: response.email,
    });

    const userData = await GetMyData(response.token);

    // Registro de push notifications
    const pushToken = await registerForPushNotificationsAsync();
    console.log("FCM Push Token:", pushToken);

    return {
      ...userData,
      pushToken,
    };
  } catch (error: any) {
    crashlytics().recordError(error);
    console.error("Erro no login:", error);
    return null;
  }
}
