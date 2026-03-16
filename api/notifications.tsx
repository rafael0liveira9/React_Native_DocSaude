import * as SecureStore from "expo-secure-store";

const API_URL = "https://vpaa97q6g8.execute-api.us-east-1.amazonaws.com/dev";

/**
 * Registra ou atualiza o token FCM do dispositivo no backend
 * Usa fetch nativo (axios falha em builds iOS nativas/TestFlight)
 */
export async function registerDeviceToken(
  token: string,
  userId?: number
): Promise<boolean> {
  try {
    let id = userId;
    if (!id) {
      const stored = await SecureStore.getItemAsync("user-id");
      if (stored) id = parseInt(stored);
    }

    if (!id) {
      console.warn("registerDeviceToken: userId não disponível, pulando registro");
      return false;
    }

    const authToken = await SecureStore.getItemAsync("user-token");

    const response = await fetch(`${API_URL}/assinantes/${id}/firebase-token`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ firebase_token: token }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Token FCM registrado no backend com sucesso");
      return true;
    }

    console.warn("Falha ao registrar token FCM:", data);
    return false;
  } catch (error: any) {
    console.error(
      "Erro ao registrar token no backend:",
      error.message
    );
    return false;
  }
}

/**
 * Remove o token FCM do dispositivo no backend (envia null)
 */
export async function deleteDeviceTokenFromBackend(
  token: string
): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync("user-id");
    if (!stored) {
      console.warn("deleteDeviceTokenFromBackend: userId não disponível");
      return false;
    }

    const authToken = await SecureStore.getItemAsync("user-token");

    const response = await fetch(`${API_URL}/assinantes/${stored}/firebase-token`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ firebase_token: null }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Token FCM removido do backend com sucesso");
      return true;
    }

    console.warn("Falha ao remover token FCM:", data);
    return false;
  } catch (error: any) {
    console.error(
      "Erro ao deletar token do backend:",
      error.message
    );
    return false;
  }
}

/**
 * Atualiza o token quando ele é renovado
 */
export async function updateDeviceToken(
  newToken: string,
  oldToken?: string
): Promise<boolean> {
  try {
    if (oldToken && oldToken !== newToken) {
      await deleteDeviceTokenFromBackend(oldToken);
    }
    return await registerDeviceToken(newToken);
  } catch (error: any) {
    console.error("Erro ao atualizar token:", error);
    return false;
  }
}
