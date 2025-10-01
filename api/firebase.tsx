import analytics from "@react-native-firebase/analytics";
import crashlytics from "@react-native-firebase/crashlytics";
import messaging from "@react-native-firebase/messaging";
import { Alert, Platform } from "react-native";

/**
 * Log de eventos no Firebase Analytics
 */
export async function logEvent(
  eventName: string,
  params?: Record<string, any>
) {
  try {
    await analytics().logEvent(eventName, params);
    console.log(`Evento registrado: ${eventName}`, params);
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
  }
}

/**
 * Log de erros no Firebase Crashlytics
 */
export function logCrash(error: Error | string) {
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

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert(
        "Permissão negada",
        "Falha ao obter permissão para notificações."
      );
      return;
    }

    const token = await messaging().getToken();
    console.log("Token FCM:", token);
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
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Desinscrito do tópico: ${topic}`);
  } catch (error) {
    console.error(`Erro ao desinscrever do tópico ${topic}:`, error);
  }
}
