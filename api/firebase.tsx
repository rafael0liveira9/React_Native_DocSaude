import { Platform } from "react-native";
import Constants from 'expo-constants';

// Check if running in Expo Go (Firebase won't work in Expo Go)
const isExpoGo = Constants.appOwnership === 'expo';

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
    console.log(`Evento registrado: ${eventName}`, params);
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
    console.log(`Desinscrito do tópico: ${topic}`);
  } catch (error) {
    console.error(`Erro ao desinscrever do tópico ${topic}:`, error);
  }
}
