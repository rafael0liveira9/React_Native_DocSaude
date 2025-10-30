import Constants from "expo-constants";
import { Platform } from "react-native";

// Check if running in Expo Go (Firebase won't work in Expo Go)
const isExpoGo = Constants.appOwnership === "expo";

// Conditional imports - only load Firebase in development builds
let analytics: any = null;
let crashlytics: any = null;
let messaging: any = null;

if (!isExpoGo) {
  try {
    analytics = require("@react-native-firebase/analytics").default;
    crashlytics = require("@react-native-firebase/crashlytics").default;
    messaging = require("@react-native-firebase/messaging").default;
  } catch (error) {
    console.warn("Firebase modules not available (running in Expo Go)");
  }
}

// Tipos para callbacks de notificações
export type NotificationHandler = (notification: any) => void;
export type TokenRefreshHandler = (token: string) => void;

// Callbacks globais para notificações
let onNotificationReceivedCallback: NotificationHandler | null = null;
let onNotificationTappedCallback: NotificationHandler | null = null;
let onTokenRefreshCallback: TokenRefreshHandler | null = null;

/**
 * Configura o callback para notificações recebidas em foreground
 */
export function setNotificationReceivedHandler(handler: NotificationHandler) {
  onNotificationReceivedCallback = handler;
}

/**
 * Configura o callback para quando usuário toca na notificação
 */
export function setNotificationTappedHandler(handler: NotificationHandler) {
  onNotificationTappedCallback = handler;
}

/**
 * Configura o callback para quando o token é atualizado
 */
export function setTokenRefreshHandler(handler: TokenRefreshHandler) {
  onTokenRefreshCallback = handler;
}

/**
 * Inicializa os listeners de notificações do Firebase
 * Deve ser chamado uma única vez no início do app
 */
export function initializeNotificationListeners() {
  if (!messaging) {
    console.log("[MOCK] Listeners de notificação inicializados (Expo Go mode)");
    return;
  }

  // Handler para mensagens em foreground (app aberto)
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
    console.log("Notificação recebida em foreground:", remoteMessage);

    if (onNotificationReceivedCallback) {
      onNotificationReceivedCallback(remoteMessage);
    }

    // Log evento no analytics
    await logEvent("notification_received_foreground", {
      notification_id: remoteMessage.messageId,
      notification_title: remoteMessage.notification?.title,
    });
  });

  // Handler para quando usuário toca em notificação (app em background ou fechado)
  const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
    async (remoteMessage: any) => {
      console.log("Notificação aberta pelo usuário:", remoteMessage);

      if (onNotificationTappedCallback) {
        onNotificationTappedCallback(remoteMessage);
      }

      // Log evento no analytics
      await logEvent("notification_tapped", {
        notification_id: remoteMessage.messageId,
        notification_title: remoteMessage.notification?.title,
      });
    }
  );

  // Verificar se o app foi aberto via notificação (app estava completamente fechado)
  messaging()
    .getInitialNotification()
    .then(async (remoteMessage: any) => {
      if (remoteMessage) {
        console.log("App aberto via notificação:", remoteMessage);

        if (onNotificationTappedCallback) {
          onNotificationTappedCallback(remoteMessage);
        }

        // Log evento no analytics
        await logEvent("notification_opened_app", {
          notification_id: remoteMessage.messageId,
          notification_title: remoteMessage.notification?.title,
        });
      }
    });

  // Handler para refresh de token
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken: string) => {
    console.log("Token FCM atualizado:", newToken);

    if (onTokenRefreshCallback) {
      onTokenRefreshCallback(newToken);
    }

    // Log evento no analytics
    await logEvent("fcm_token_refreshed", {
      token_length: newToken.length,
    });
  });

  console.log("Listeners de notificação inicializados com sucesso");

  // Retorna função de cleanup para desinscrever listeners
  return () => {
    unsubscribeForeground();
    unsubscribeNotificationOpened();
    unsubscribeTokenRefresh();
  };
}

// Handler de background (deve ser registrado fora do componente)
if (!isExpoGo && messaging) {
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log("Mensagem recebida em background:", remoteMessage);

    // Aqui você pode processar a notificação em background
    // Não pode atualizar UI aqui, apenas processar dados

    // Log no crashlytics para debug
    logCrash(`Background notification: ${remoteMessage.messageId}`);
  });
}

/**
 * Log de eventos no Firebase Analytics
 */
export async function logEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (!analytics) {
    console.log(`[MOCK] Evento registrado: ${eventName}`, params);
    return;
  }

  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
  }
}

/**
 * Log de erros no Firebase Crashlytics
 */
export function logCrash(error: Error | string) {
  if (!crashlytics) {
    console.log(`[MOCK] Crash registrado:`, error);
    return;
  }

  if (typeof error === "string") {
    crashlytics().log(error);
    crashlytics().recordError(new Error(error));
  } else {
    crashlytics().recordError(error);
  }
}

/**
 * Registro para push notifications e obtenção do token FCM
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  if (Platform.OS === "web") {
    console.warn("Push notifications não são suportadas no web.");
    return;
  }

  if (!messaging) {
    console.log("[MOCK] Push token gerado (Expo Go mode)");
    return "expo-go-mock-token";
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn("Permissão negada para notificações.");
      return;
    }

    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error("Erro ao registrar push notifications:", error);
    return;
  }
}

/**
 * Subscribe a tópicos (opcional)
 */
export async function subscribeToTopic(topic: string) {
  if (!messaging) {
    console.log(`[MOCK] Inscrito no tópico: ${topic}`);
    return;
  }

  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Inscrito no tópico: ${topic}`);
  } catch (error) {
    console.error(`Erro ao inscrever no tópico ${topic}:`, error);
  }
}

/**
 * Unsubscribe de tópicos (opcional)
 */
export async function unsubscribeFromTopic(topic: string) {
  if (!messaging) {
    console.log(`[MOCK] Desinscrito do tópico: ${topic}`);
    return;
  }

  try {
    await messaging().unsubscribeFromTopic(topic);
  } catch (error) {
    console.error(`Erro ao desinscrever do tópico ${topic}:`, error);
  }
}

/**
 * Deleta o token FCM do dispositivo
 * Deve ser chamado quando o usuário faz logout
 */
export async function deleteDeviceToken(): Promise<boolean> {
  if (!messaging) {
    console.log("[MOCK] Token deletado (Expo Go mode)");
    return true;
  }

  try {
    await messaging().deleteToken();
    console.log("Token FCM deletado com sucesso");

    await logEvent("fcm_token_deleted");

    return true;
  } catch (error) {
    console.error("Erro ao deletar token FCM:", error);
    logCrash(error as Error);
    return false;
  }
}
