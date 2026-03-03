import api from "./config";
import * as SecureStore from "expo-secure-store";

/**
 * Registra ou atualiza o token FCM do dispositivo no backend
 * @param token Token FCM do dispositivo
 * @param userId ID do usuário (opcional, será pego do SecureStore se não fornecido)
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

    const response = await api.put(`/assinantes/${id}/firebase-token`, {
      firebase_token: token,
    });

    if (response.data.success) {
      console.log("Token FCM registrado no backend com sucesso");
      return true;
    }

    console.warn("Falha ao registrar token FCM:", response.data);
    return false;
  } catch (error: any) {
    console.error(
      "Erro ao registrar token no backend:",
      error.response?.data || error.message
    );
    return false;
  }
}

/**
 * Remove o token FCM do dispositivo no backend (envia null)
 * @param token Token FCM a ser removido (não usado — limpa o campo no backend)
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

    const response = await api.put(`/assinantes/${stored}/firebase-token`, {
      firebase_token: null,
    });

    if (response.data.success) {
      console.log("Token FCM removido do backend com sucesso");
      return true;
    }

    console.warn("Falha ao remover token FCM:", response.data);
    return false;
  } catch (error: any) {
    console.error(
      "Erro ao deletar token do backend:",
      error.response?.data || error.message
    );
    return false;
  }
}

/**
 * Atualiza o token quando ele é renovado
 * @param oldToken Token antigo (opcional)
 * @param newToken Novo token
 */
export async function updateDeviceToken(
  newToken: string,
  oldToken?: string
): Promise<boolean> {
  try {
    // Se temos o token antigo, deletamos primeiro
    if (oldToken && oldToken !== newToken) {
      await deleteDeviceTokenFromBackend(oldToken);
    }

    // Registra o novo token
    return await registerDeviceToken(newToken);
  } catch (error: any) {
    console.error("Erro ao atualizar token:", error);
    return false;
  }
}
