import api from "./config";
import * as SecureStore from "expo-secure-store";

/**
 * Serviço de Telemedicina - Integração com Teladoc
 */
class TelemedicinaService {
  /**
   * Verifica se usuário já está registrado na telemedicina
   */
  async isRegistered(): Promise<boolean> {
    try {
      const registered = await SecureStore.getItemAsync("telemedicina_registered");
      return registered === "true";
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao verificar registro:", error);
      return false;
    }
  }

  /**
   * Registra usuário na telemedicina (apenas primeira vez)
   */
  async register(assinanteId: number): Promise<boolean> {
    try {
      console.log("[TELEMEDICINA] Registrando assinante:", assinanteId);

      const response = await api.post("/telemedicina/register", {
        assinante_id: assinanteId,
      });

      if (response.data.success) {
        await SecureStore.setItemAsync("telemedicina_registered", "true");
        console.log("[TELEMEDICINA] Assinante registrado com sucesso");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("[TELEMEDICINA] Erro ao registrar:", error.response?.data || error.message);

      // Se erro for "já registrado", marca como registrado
      if (error.response?.status === 400 &&
          error.response?.data?.error?.includes("já está registrado")) {
        await SecureStore.setItemAsync("telemedicina_registered", "true");
        console.log("[TELEMEDICINA] Assinante já estava registrado");
        return true;
      }

      throw error;
    }
  }

  /**
   * Valida acesso (obtém token de telemedicina)
   */
  async validate(assinanteId: number): Promise<boolean> {
    try {
      console.log("[TELEMEDICINA] Validando acesso para:", assinanteId);

      const response = await api.post("/telemedicina/validate", {
        assinante_id: assinanteId,
      });

      if (response.data.success) {
        console.log("[TELEMEDICINA] Acesso validado com sucesso");
        return true;
      }

      return false;
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao validar:", error);
      throw error;
    }
  }

  /**
   * Criar consulta imediata
   */
  async createImmediateAppointment(assinanteId: number): Promise<any> {
    try {
      console.log("[TELEMEDICINA] Criando consulta imediata para:", assinanteId);

      const response = await api.post("/telemedicina/appointment/immediate", {
        assinante_id: assinanteId,
        program_id: 7, // Consulta por vídeo
      });

      if (response.data.success) {
        console.log("[TELEMEDICINA] Consulta imediata criada:", response.data.data);
        return response.data.data;
      }

      throw new Error("Falha ao criar consulta imediata");
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao criar consulta:", error);
      throw error;
    }
  }

  /**
   * Buscar horários disponíveis
   */
  async getAvailableSlots(
    assinanteId: number,
    date: string
  ): Promise<any[]> {
    try {
      console.log("[TELEMEDICINA] Buscando slots para:", date);

      const response = await api.get("/telemedicina/appointment/slots", {
        params: {
          assinante_id: assinanteId,
          date: date, // Formato: YYYY-MM-DD
          program_id: 7,
        },
      });

      if (response.data.success) {
        return response.data.data.slots || [];
      }

      return [];
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar slots:", error);
      throw error;
    }
  }

  /**
   * Agendar consulta
   */
  async scheduleAppointment(
    assinanteId: number,
    date: string,
    time: string,
    slotId?: string
  ): Promise<any> {
    try {
      console.log("[TELEMEDICINA] Agendando consulta:", { date, time });

      const response = await api.post("/telemedicina/appointment/schedule", {
        assinante_id: assinanteId,
        program_id: 7,
        date: date,
        time: time,
        slot_id: slotId,
      });

      if (response.data.success) {
        console.log("[TELEMEDICINA] Consulta agendada:", response.data.data);
        return response.data.data;
      }

      throw new Error("Falha ao agendar consulta");
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao agendar:", error);
      throw error;
    }
  }

  /**
   * Obter token de vídeo
   */
  async getVideoToken(appointmentId: number): Promise<any> {
    try {
      console.log("[TELEMEDICINA] Obtendo token de vídeo para:", appointmentId);

      const response = await api.get(
        `/telemedicina/appointment/${appointmentId}/video-token`
      );

      if (response.data.success) {
        console.log("[TELEMEDICINA] Token de vídeo obtido");
        return response.data.data;
      }

      throw new Error("Falha ao obter token de vídeo");
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao obter token de vídeo:", error);
      throw error;
    }
  }

  /**
   * Verificar status
   */
  async getAppointmentStatus(appointmentId: number): Promise<any> {
    try {
      const response = await api.get(
        `/telemedicina/appointment/${appointmentId}/status`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar status:", error);
      throw error;
    }
  }

  /**
   * Histórico
   */
  async getHistory(assinanteId: number): Promise<any[]> {
    try {
      const response = await api.get("/telemedicina/appointments/history", {
        params: { assinante_id: assinanteId },
      });

      if (response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar histórico:", error);
      throw error;
    }
  }

  /**
   * Cancelar consulta
   */
  async cancelAppointment(
    appointmentId: number,
    reason: string
  ): Promise<boolean> {
    try {
      console.log("[TELEMEDICINA] Cancelando consulta:", appointmentId);

      const response = await api.post(
        `/telemedicina/appointment/${appointmentId}/cancel`,
        { reason }
      );

      if (response.data.success) {
        console.log("[TELEMEDICINA] Consulta cancelada com sucesso");
        return true;
      }

      return false;
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao cancelar:", error);
      throw error;
    }
  }

  /**
   * Buscar mensagens do chat
   */
  async getChatMessages(appointmentId: number): Promise<any[]> {
    try {
      const response = await api.get(
        `/telemedicina/appointment/${appointmentId}/chat`
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar chat:", error);
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat
   */
  async sendChatMessage(
    appointmentId: number,
    message: string
  ): Promise<boolean> {
    try {
      const response = await api.post(
        `/telemedicina/appointment/${appointmentId}/chat`,
        { message }
      );

      if (response.data.success) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao enviar mensagem:", error);
      throw error;
    }
  }
}

export default new TelemedicinaService();
