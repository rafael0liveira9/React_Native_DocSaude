import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import telemedicinaService from "@/api/telemedicina";
import Toast from "react-native-toast-message";
import Pusher from "pusher-js/react-native";

type ConsultaStatus = "creating" | "waiting" | "assigned" | "error";

// Credenciais do Pusher (obter da Teladoc)
const PUSHER_CONFIG = {
  key: "YOUR_PUSHER_KEY", // Substituir pela chave real
  cluster: "us2",
};

export default function ConsultaImediataScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];
  const [status, setStatus] = useState<ConsultaStatus>("creating");
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    createAppointment();

    // Cleanup Pusher on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, []);

  const setupPusher = (pusherConfig: any) => {
    try {
      console.log("[CONSULTA_IMEDIATA] Configurando Pusher:", pusherConfig);

      // Inicializa Pusher
      pusherRef.current = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
      });

      // Inscreve no canal
      const channel = pusherRef.current.subscribe(pusherConfig.channel);
      channelRef.current = channel;

      // Evento: Médico foi alocado para a consulta
      channel.bind("reserved_attendance", (data: any) => {
        console.log("[CONSULTA_IMEDIATA] Médico alocado:", data);
        Toast.show({
          type: "success",
          text1: "Médico encontrado!",
          text2: "Preparando videochamada...",
        });
        setStatus("assigned");
      });

      // Evento: Videochamada iniciada
      channel.bind("start_stream", (data: any) => {
        console.log("[CONSULTA_IMEDIATA] Iniciando videochamada:", data);
        startVideoCall();
      });

      // Evento: Consulta finalizada
      channel.bind("finish_stream", (data: any) => {
        console.log("[CONSULTA_IMEDIATA] Consulta finalizada:", data);
        Toast.show({
          type: "info",
          text1: "Consulta finalizada",
          text2: "Obrigado por usar nosso serviço",
        });
        router.back();
      });

      console.log("[CONSULTA_IMEDIATA] Pusher conectado com sucesso!");
    } catch (error) {
      console.error("[CONSULTA_IMEDIATA] Erro ao configurar Pusher:", error);
    }
  };

  const startVideoCall = async () => {
    try {
      if (!appointmentId) return;

      console.log("[CONSULTA_IMEDIATA] Obtendo token de vídeo...");

      const videoData = await telemedicinaService.getVideoToken(appointmentId);

      console.log("[CONSULTA_IMEDIATA] Token obtido, iniciando videochamada");

      // Navegar para tela de videochamada com os dados
      router.push({
        pathname: "/(stack)/telemedicina/video-call" as any,
        params: {
          apiKey: videoData.apiKey,
          sessionId: videoData.sessionId,
          token: videoData.token,
          appointmentId: appointmentId.toString(),
        },
      });
    } catch (error) {
      console.error("[CONSULTA_IMEDIATA] Erro ao iniciar videochamada:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao iniciar videochamada",
      });
    }
  };

  const createAppointment = async () => {
    try {
      const userIdStr = await SecureStore.getItemAsync("user-id");

      if (!userIdStr) {
        Toast.show({
          type: "error",
          text1: "Erro ao carregar dados do usuário",
        });
        router.back();
        return;
      }

      const userId = parseInt(userIdStr);

      console.log("[CONSULTA_IMEDIATA] Criando consulta para usuário:", userId);

      // Cria consulta imediata
      const appointment = await telemedicinaService.createImmediateAppointment(userId);

      setAppointmentId(appointment.appointment_id);
      setStatus("waiting");

      console.log("[CONSULTA_IMEDIATA] Consulta criada:", appointment);

      // Conectar ao Pusher para receber notificações em tempo real
      if (appointment.pusher) {
        setupPusher(appointment.pusher);
      } else {
        console.warn("[CONSULTA_IMEDIATA] Nenhuma configuração Pusher retornada");
      }

      Toast.show({
        type: "success",
        text1: "Consulta criada",
        text2: "Aguardando médico disponível...",
      });

    } catch (error: any) {
      console.error("[CONSULTA_IMEDIATA] Erro ao criar consulta:", error);
      setStatus("error");
      Alert.alert(
        "Erro",
        "Não foi possível criar a consulta. Tente novamente.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      "Cancelar Consulta",
      "Deseja realmente cancelar esta consulta?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: async () => {
            try {
              if (appointmentId) {
                await telemedicinaService.cancelAppointment(
                  appointmentId,
                  "Cancelado pelo paciente"
                );
                Toast.show({
                  type: "success",
                  text1: "Consulta cancelada",
                });
              }
              router.back();
            } catch (error) {
              console.error("[CONSULTA_IMEDIATA] Erro ao cancelar:", error);
              Toast.show({
                type: "error",
                text1: "Erro ao cancelar consulta",
              });
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    switch (status) {
      case "creating":
        return (
          <>
            <ActivityIndicator size="large" color={themeColors.tint} />
            <Text style={styles.statusText}>Criando consulta...</Text>
          </>
        );

      case "waiting":
        return (
          <>
            <View style={styles.waitingAnimation}>
              <Text style={styles.iconLarge}>🩺</Text>
              <ActivityIndicator
                size="large"
                color={themeColors.tint}
                style={{ marginTop: 20 }}
              />
            </View>
            <Text style={[styles.statusTitle, { color: themeColors.text }]}>
              Procurando médico disponível
            </Text>
            <Text style={styles.statusDescription}>
              Você está na fila de atendimento.{"\n"}
              Em breve um médico irá atendê-lo.
            </Text>

            {estimatedWait && (
              <Text style={styles.estimatedWait}>
                Tempo estimado: {estimatedWait} minutos
              </Text>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Mantenha a câmera e o microfone do seu dispositivo funcionando.
                Você será notificado quando um médico aceitar a consulta.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancelar Consulta</Text>
            </TouchableOpacity>
          </>
        );

      case "assigned":
        return (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.statusTitle, { color: themeColors.text }]}>
              Médico encontrado!
            </Text>
            <Text style={styles.statusDescription}>
              Iniciando videochamada...
            </Text>
            <ActivityIndicator size="large" color="#00E276" />
          </>
        );

      case "error":
        return (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={[styles.statusTitle, { color: themeColors.text }]}>
              Erro ao criar consulta
            </Text>
            <Text style={styles.statusDescription}>
              Não foi possível criar a consulta. Por favor, tente novamente.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.tint }]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  waitingAnimation: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  iconLarge: {
    fontSize: 60,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#666",
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    textAlign: "center",
    marginBottom: 10,
  },
  statusDescription: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  estimatedWait: {
    fontSize: 14,
    color: "#00E276",
    marginTop: 10,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "100%",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#1976D2",
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e74c3c",
  },
  cancelButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  button: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
});
