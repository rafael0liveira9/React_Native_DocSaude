import telemedicinaService from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function TelemedicinaMenuScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeTelemedicina();
  }, []);

  const initializeTelemedicina = async () => {
    try {
      setLoading(true);
      setHasError(false);

      const userIdFromStore = await SecureStore.getItemAsync("user-id");

      if (!userIdFromStore) {
        Toast.show({
          type: "error",
          text1: "Erro ao carregar dados do usuario",
        });
        router.back();
        return;
      }

      setUserId(userIdFromStore);

      console.log(
        "[TELEMEDICINA_SCREEN] Inicializando para usuario:",
        userIdFromStore
      );

      await telemedicinaService.validate(parseInt(userIdFromStore));
      console.log("[TELEMEDICINA_SCREEN] Acesso validado!");

      // Verifica atendimento ativo para retomada
      const active = await telemedicinaService.getActiveAppointment(
        parseInt(userIdFromStore)
      );
      if (active) {
        console.log("[TELEMEDICINA_SCREEN] Atendimento ativo encontrado:", active.id);
        setActiveAppointment(active);
      }
    } catch (error: any) {
      console.error("[TELEMEDICINA_SCREEN] Erro ao inicializar:", error);

      if (error.response?.data?.error === "telemedicina_indisponivel") {
        Toast.show({
          type: "error",
          text1: "Telemedicina nao disponivel",
          text2: "O servico de telemedicina nao esta disponivel para este usuario",
        });
        router.back();
        return;
      }

      setHasError(true);
      Toast.show({
        type: "info",
        text1: "Servico em configuracao",
        text2: "Algumas funcionalidades podem estar indisponiveis",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsultarAgora = () => {
    if (hasError) {
      Toast.show({
        type: "info",
        text1: "Servico temporariamente indisponivel",
        text2: "Por favor, tente novamente mais tarde",
      });
      return;
    }
    router.push("/(stack)/telemedicina/consulta-imediata" as any);
  };

  const handleAgendarConsulta = () => {
    if (hasError) {
      Toast.show({
        type: "info",
        text1: "Servico temporariamente indisponivel",
        text2: "Por favor, tente novamente mais tarde",
      });
      return;
    }
    router.push("/(stack)/telemedicina/agendar-consulta" as any);
  };

  const handleResumeAppointment = () => {
    if (!activeAppointment) return;

    if (activeAppointment.appointment_type === "immediate") {
      router.push({
        pathname: "/(stack)/telemedicina/consulta-imediata" as any,
        params: { appointmentId: activeAppointment.id.toString() },
      });
    } else {
      // Para agendadas, mostra status
      router.push({
        pathname: "/(stack)/telemedicina/consulta-imediata" as any,
        params: { appointmentId: activeAppointment.id.toString() },
      });
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Conectando ao servico de telemedicina...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: themeColors.text }]}>
            Telemedicina
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: "#999" }]}>
            Consulte com um especialista por videochamada
          </Text>
        </View>

        {/* Banner de atendimento ativo */}
        {activeAppointment && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={handleResumeAppointment}
            activeOpacity={0.8}
          >
            <View style={styles.resumeIconContainer}>
              <Ionicons name="videocam" size={24} color="#fff" />
            </View>
            <View style={styles.resumeTextContainer}>
              <Text style={styles.resumeTitle}>
                Voce tem um atendimento em andamento
              </Text>
              <Text style={styles.resumeSubtitle}>
                {activeAppointment.appointment_type === "immediate"
                  ? "Consulta imediata"
                  : activeAppointment.speciality_name || "Consulta agendada"}
                {" - "}
                {activeAppointment.status === "waiting"
                  ? "Aguardando medico"
                  : activeAppointment.status === "assigned"
                  ? "Medico encontrado"
                  : "Agendada"}
              </Text>
            </View>
            <View style={styles.resumeArrow}>
              <Text style={styles.resumeButtonText}>Retomar</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.cardsContainer}>
          {/* Card 1: Consultar Agora (verde) */}
          <TouchableOpacity
            style={[styles.card, styles.immediateCard]}
            onPress={handleConsultarAgora}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#ffffff" }]}
              >
                <Ionicons name="videocam-outline" size={28} color="#00C853" />
              </View>
              <View style={[styles.cardBadge, { backgroundColor: "#00A843" }]}>
                <Text style={styles.badgeText}>Imediato</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Consultar Agora</Text>
            <Text style={styles.cardDescription}>
              Atendimento com medico de plantao por videochamada
            </Text>
          </TouchableOpacity>

          {/* Card 2: Agendar Consulta (azul) */}
          <TouchableOpacity
            style={[styles.card, styles.scheduleCard]}
            onPress={handleAgendarConsulta}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#ffffff" }]}
              >
                <Ionicons name="calendar-outline" size={28} color="#032FEA" />
              </View>
              <View style={[styles.cardBadge, { backgroundColor: "#0225BB" }]}>
                <Text style={styles.badgeText}>Agendar</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Agendar Consulta</Text>
            <Text style={styles.cardDescription}>
              Escolha especialidade, data e horario para sua teleconsulta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              Escolha entre atendimento imediato ou agendar uma consulta
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>
              Selecione a especialidade, data e horario disponiveis
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>
              Confirme o profissional e realize sua teleconsulta por video
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },

  // Resume banner
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F57C00",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#F57C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resumeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resumeTextContainer: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: "#fff",
    marginBottom: 2,
  },
  resumeSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.85)",
  },
  resumeArrow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  resumeButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: "#fff",
  },

  // Cards
  cardsContainer: {
    gap: 16,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  immediateCard: {
    backgroundColor: "#00E276",
  },
  scheduleCard: {
    backgroundColor: "#032FEA",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBadge: {
    backgroundColor: "#032FEA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    color: "#fff",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },

  // Info section
  infoSection: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    marginTop: 10,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    marginBottom: 20,
    color: "#0D1633",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00E276",
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Fonts.bold,
    textAlign: "center",
    lineHeight: 28,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    color: "#333",
  },
});
