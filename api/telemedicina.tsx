import api from "./config";

export interface Specialty {
  id: number;
  speciality_id: number | null;
  speciality_name: string;
  occupation_id: number | null;
  icon_name: string;
  display_order: number;
  category: 'medical' | 'wellness';
}

export interface SpecialtiesResponse {
  medical: Specialty[];
  wellness: Specialty[];
}

export interface Slot {
  date: string;
  time: string;
  timestamp: number;
  user_schedule_id: number;
  professional_name: string;
  professional_crm?: string;
  speciality_id?: number;
  double_booking: boolean;
}

export interface SlotsResponse {
  slots: Slot[];
  dates_available: string[];
}

/**
 * Serviço de Telemedicina - Integração com Teladoc
 */
class TelemedicinaService {
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
   * Buscar especialidades para agendamento
   */
  async getSpecialties(assinanteId: number): Promise<SpecialtiesResponse> {
    try {
      console.log("[TELEMEDICINA] Buscando especialidades");

      const response = await api.get("/telemedicina/schedule/specialties", {
        params: { assinante_id: assinanteId },
      });

      if (response.data.success) {
        return response.data.data;
      }

      return { medical: [], wellness: [] };
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar especialidades:", error);
      throw error;
    }
  }

  /**
   * Buscar slots disponiveis (novo endpoint com POST rules)
   */
  async getScheduleSlots(
    assinanteId: number,
    specialityId?: number,
    occupationId?: number,
    date?: string,
    daysAhead?: number
  ): Promise<SlotsResponse> {
    try {
      console.log("[TELEMEDICINA] Buscando slots de agendamento");

      const response = await api.post("/telemedicina/schedule/slots", {
        assinante_id: assinanteId,
        speciality_id: specialityId,
        occupation_id: occupationId,
        date: date || new Date().toISOString().split("T")[0],
        days_ahead: daysAhead || 30,
      });

      if (response.data.success) {
        return response.data.data;
      }

      return { slots: [], dates_available: [] };
    } catch (error) {
      console.error("[TELEMEDICINA] Erro ao buscar slots:", error);
      throw error;
    }
  }

  /**
   * Buscar horários disponíveis (legado)
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
          date: date,
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
   * Agendar consulta (reescrito com novos params)
   */
  async scheduleAppointment(params: {
    assinanteId: number;
    date: string;
    time: string;
    timestamp?: number;
    userScheduleId?: number;
    specialityId?: number;
    specialityName?: string;
    occupationId?: number;
    professionalName?: string;
    professionalCrm?: string;
    doubleBooking?: boolean;
  }): Promise<any> {
    try {
      console.log("[TELEMEDICINA] Agendando consulta:", { date: params.date, time: params.time });

      const response = await api.post("/telemedicina/appointment/schedule", {
        assinante_id: params.assinanteId,
        date: params.date,
        time: params.time,
        timestamp: params.timestamp,
        user_schedule_id: params.userScheduleId,
        speciality_id: params.specialityId,
        speciality_name: params.specialityName,
        occupation_id: params.occupationId,
        professional_name: params.professionalName,
        professional_crm: params.professionalCrm,
        double_booking: params.doubleBooking || false,
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
