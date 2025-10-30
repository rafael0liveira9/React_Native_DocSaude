import api from "./config";
import { Platform } from "react-native";

/**
 * Registra ou atualiza o token FCM do dispositivo no backend
 * @param token Token FCM do dispositivo
 * @param userId ID do usuário (opcional, será pego do token JWT se não fornecido)
 */
export async function registerDeviceToken(
  token: string,
  userId?: number
): Promise<boolean> {
  try {
    const deviceInfo = {
      token,
      platform: Platform.OS,
      deviceId: Platform.select({
        android: "android_device",
        ios: "ios_device",
        default: "unknown_device",
      }),
      userId,
    };

    const response = await api.post("/notifications/register-token", deviceInfo);

    if (response.data.success) {
      console.log("Token registrado no backend com sucesso");
      return true;
    }

    console.warn("Falha ao registrar token:", response.data);
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
 * Deleta o token FCM do dispositivo no backend
 * @param token Token FCM a ser removido
 */
export async function deleteDeviceTokenFromBackend(
  token: string
): Promise<boolean> {
  try {
    const response = await api.delete("/notifications/delete-token", {
      data: { token },
    });

    if (response.data.success) {
      console.log("Token deletado do backend com sucesso");
      return true;
    }

    console.warn("Falha ao deletar token:", response.data);
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
