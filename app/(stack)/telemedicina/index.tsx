import telemedicinaService from "@/api/telemedicina";
import { GetMyData } from "@/api/auth";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface Paciente {
  id: number;
  nome: string;
  isTitular: boolean;
}

export default function TelemedicinaMenuScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeAppointments, setActiveAppointments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const initializedRef = useRef(false);

  // Pacientes (titular + dependentes)
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"imediata" | "agendar" | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!initializedRef.current) {
        initializeTelemedicina();
      } else {
        refreshActiveAppointments();
      }
    }, [])
  );

  const refreshActiveAppointments = async () => {
    try {
      const storedId = userId || (await SecureStore.getItemAsync("user-id"));
      if (!storedId) return;
      const list = await telemedicinaService.getActiveAppointments(
        parseInt(storedId.toString())
      );
      setActiveAppointments(list);
    } catch (error) {
      console.error("[TELEMEDICINA_SCREEN] Erro ao atualizar atendimentos:", error);
    }
  };

  const initializeTelemedicina = async () => {
    try {
      setLoading(true);
      setHasError(false);

      const userIdFromStore = await SecureStore.getItemAsync("user-id");
      const userToken = await SecureStore.getItemAsync("user-token");

      if (!userIdFromStore) {
        Toast.show({ type: "error", text1: "Erro ao carregar dados do usuário" });
        router.back();
        return;
      }

      setUserId(userIdFromStore);
      await telemedicinaService.validate(parseInt(userIdFromStore));

      // Buscar dados do usuário e dependentes
      if (userToken) {
        try {
          const userData = await GetMyData(parseInt(userIdFromStore), userToken);
          if (userData) {
            const listaPacientes: Paciente[] = [
              { id: parseInt(userIdFromStore), nome: userData.name || "Titular", isTitular: true },
            ];
            if (userData.dependentes && userData.dependentes.length > 0) {
              userData.dependentes.forEach((dep: any) => {
                listaPacientes.push({
                  id: dep.id,
                  nome: dep.nome,
                  isTitular: false,
                });
              });
            }
            setPacientes(listaPacientes);
          }
        } catch (e) {
          console.warn("[TELEMEDICINA_SCREEN] Erro ao buscar dependentes:", e);
          // Fallback: só o titular
          setPacientes([{ id: parseInt(userIdFromStore), nome: "Titular", isTitular: true }]);
        }
      }

      const list = await telemedicinaService.getActiveAppointments(
        parseInt(userIdFromStore)
      );
      setActiveAppointments(list);
    } catch (error: any) {
      console.error("[TELEMEDICINA_SCREEN] Erro ao inicializar:", error);

      if (error.response?.data?.error === "telemedicina_indisponivel") {
        Toast.show({
          type: "error",
          text1: "Telemedicina não disponível",
          text2: "O serviço de telemedicina não está disponível para este usuário",
        });
        router.back();
        return;
      }

      setHasError(true);
      Toast.show({
        type: "info",
        text1: "Serviço em configuração",
        text2: "Algumas funcionalidades podem estar indisponíveis",
      });
    } finally {
      setLoading(false);
      setInitialized(true);
      initializedRef.current = true;
    }
  };

  const handleSelectPaciente = (paciente: Paciente) => {
    setShowPacienteModal(false);
    if (pendingAction === "imediata") {
      router.push({
        pathname: "/(stack)/telemedicina/consulta-imediata" as any,
        params: { pacienteId: paciente.id.toString(), pacienteNome: paciente.nome },
      });
    } else if (pendingAction === "agendar") {
      router.push({
        pathname: "/(stack)/telemedicina/agendar-consulta" as any,
        params: { pacienteId: paciente.id.toString(), pacienteNome: paciente.nome },
      });
    }
    setPendingAction(null);
  };

  const handleConsultarAgora = () => {
    if (hasError) {
      Toast.show({
        type: "info",
        text1: "Serviço temporariamente indisponível",
        text2: "Por favor, tente novamente mais tarde",
      });
      return;
    }
    // Se tem dependentes, perguntar para quem
    if (pacientes.length > 1) {
      setPendingAction("imediata");
      setShowPacienteModal(true);
    } else {
      const p = pacientes[0];
      router.push({
        pathname: "/(stack)/telemedicina/consulta-imediata" as any,
        params: p ? { pacienteId: p.id.toString(), pacienteNome: p.nome } : undefined,
      });
    }
  };

  const handleAgendarConsulta = () => {
    if (hasError) {
      Toast.show({
        type: "info",
        text1: "Serviço temporariamente indisponível",
        text2: "Por favor, tente novamente mais tarde",
      });
      return;
    }
    if (pacientes.length > 1) {
      setPendingAction("agendar");
      setShowPacienteModal(true);
    } else {
      const p = pacientes[0];
      router.push({
        pathname: "/(stack)/telemedicina/agendar-consulta" as any,
        params: p ? { pacienteId: p.id.toString(), pacienteNome: p.nome } : undefined,
      });
    }
  };

  const handleResumeAppointment = (appointment: any) => {
    router.push({
      pathname: "/(stack)/telemedicina/consulta-imediata" as any,
      params: {
        appointmentId: appointment.id.toString(),
        pacienteId: appointment.assinante_id?.toString(),
        pacienteNome: appointment.paciente_nome || "",
      },
    });
  };

  const handleCancelAppointment = (appointment: any) => {
    const isImmediate = appointment.appointment_type === "immediate";
    Alert.alert(
      "Cancelar Consulta",
      isImmediate
        ? "Deseja realmente cancelar esta consulta imediata?"
        : "Deseja realmente cancelar esta consulta agendada?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              // Validar (gerar token Teladoc) para o paciente do appointment
              const uid = appointment.assinante_id;
              await telemedicinaService.validate(uid);

              const cancelId = appointment.case_attendance_id || String(appointment.id);
              await telemedicinaService.cancelAppointment(
                uid,
                cancelId,
                "Cancelado pelo paciente"
              );

              Toast.show({ type: "success", text1: "Consulta cancelada com sucesso" });
              setActiveAppointments((prev) =>
                prev.filter((a) => a.id !== appointment.id)
              );
            } catch (error) {
              console.error("[TELEMEDICINA_SCREEN] Erro ao cancelar:", error);
              Toast.show({ type: "error", text1: "Erro ao cancelar consulta" });
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatScheduledDate = (dateStr: string, timeStr: string) => {
    if (!dateStr) return "";
    try {
      const dateOnly = String(dateStr).substring(0, 10);
      const [year, month, day] = dateOnly.split("-");
      const time = timeStr ? String(timeStr).substring(0, 5) : "";
      const months = ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      const monthName = months[parseInt(month)] || month;
      return `${parseInt(day)} ${monthName} ${year}${time ? ` - ${time}` : ""}`;
    } catch {
      return String(dateStr);
    }
  };

  const getTimeUntil = (dateStr: string, timeStr: string) => {
    if (!dateStr) return null;
    try {
      const dateOnly = String(dateStr).substring(0, 10);
      const scheduled = new Date(`${dateOnly}T${timeStr || "00:00:00"}`);
      const now = new Date();
      const diffMs = scheduled.getTime() - now.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < -60) return null;
      if (diffMin <= 0) return "Agora";
      if (diffMin <= 5) return "Em 5 min";
      if (diffMin <= 15) return "Em breve";
      if (diffMin <= 30) return "Em 30 min";
      if (diffMin <= 60) return `Em ${diffMin} min`;
      if (diffHours < 24) return `Em ${diffHours}h`;
      if (diffDays === 1) return "Amanhã";
      return `Em ${diffDays} dias`;
    } catch {
      return null;
    }
  };

  const isScheduledSoon = (dateStr: string, timeStr: string) => {
    if (!dateStr) return false;
    try {
      const dateOnly = String(dateStr).substring(0, 10);
      const scheduled = new Date(`${dateOnly}T${timeStr || "00:00:00"}`);
      const now = new Date();
      const diffMin = (scheduled.getTime() - now.getTime()) / (1000 * 60);
      return diffMin <= 15 && diffMin >= -60;
    } catch {
      return false;
    }
  };

  const getFirstName = (nome: string) => {
    if (!nome) return "";
    return nome.split(" ")[0];
  };

  // Verifica se o appointment pertence a um dependente (não é o titular logado)
  const isDependenteAppointment = (appointment: any) => {
    if (!userId) return false;
    return String(appointment.assinante_id) !== String(userId);
  };

  // Separa imediatas de agendadas
  const immediateAppointments = activeAppointments.filter(
    (a) => a.appointment_type === "immediate"
  );
  const scheduledAppointments = activeAppointments.filter(
    (a) => a.appointment_type === "scheduled"
  );

  if (loading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Conectando ao serviço de telemedicina...
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

        {/* Banners de consultas imediatas em andamento */}
        {immediateAppointments.map((apt) => (
          <TouchableOpacity
            key={apt.id}
            style={styles.resumeBanner}
            onPress={() => handleResumeAppointment(apt)}
            activeOpacity={0.8}
          >
            <View style={styles.resumeIconContainer}>
              <Ionicons name="videocam" size={24} color="#fff" />
            </View>
            <View style={styles.resumeTextContainer}>
              <Text style={styles.resumeTitle}>Atendimento em andamento</Text>
              <Text style={styles.resumeSubtitle}>
                {apt.paciente_nome && isDependenteAppointment(apt)
                  ? `Para ${getFirstName(apt.paciente_nome)} - `
                  : ""}
                Consulta imediata{" - "}
                {apt.status === "waiting"
                  ? "Aguardando médico"
                  : apt.status === "assigned"
                  ? "Médico encontrado"
                  : "Em atendimento"}
              </Text>
            </View>
            <View style={styles.resumeArrow}>
              <Text style={styles.resumeButtonText}>Retomar</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Cards de consultas agendadas */}
        {scheduledAppointments.length > 0 && (
          <View style={styles.scheduledSection}>
            <Text style={[styles.scheduledSectionTitle, { color: themeColors.text }]}>
              Suas Consultas
            </Text>
            {scheduledAppointments.map((apt) => {
              const soon = isScheduledSoon(apt.scheduled_date, apt.scheduled_time);
              const timeUntil = getTimeUntil(apt.scheduled_date, apt.scheduled_time);
              const isDep = isDependenteAppointment(apt);
              return (
                <View key={apt.id} style={styles.scheduledCard}>
                  {/* Barra lateral colorida */}
                  <View style={[styles.scheduledAccent, soon && styles.scheduledAccentSoon]} />

                  <View style={styles.scheduledContent}>
                    {/* Paciente badge (se for dependente) */}
                    {isDep && apt.paciente_nome && (
                      <View style={styles.pacienteBadgeRow}>
                        <View style={styles.pacienteBadge}>
                          <Ionicons name="person" size={12} color="#fff" />
                          <Text style={styles.pacienteBadgeText}>
                            {getFirstName(apt.paciente_nome)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Header com data e badge */}
                    <View style={styles.scheduledCardHeader}>
                      <View style={styles.scheduledDateBox}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={soon ? "#00C853" : "#666"}
                        />
                        <Text style={[styles.scheduledDateText, soon && styles.scheduledDateSoon]}>
                          {formatScheduledDate(apt.scheduled_date, apt.scheduled_time)}
                        </Text>
                      </View>
                      {timeUntil && (
                        <View style={[styles.timeBadge, soon && styles.timeBadgeSoon]}>
                          <Text style={[styles.timeBadgeText, soon && styles.timeBadgeTextSoon]}>
                            {timeUntil}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Especialidade */}
                    <Text style={styles.scheduledCardSpecialty}>
                      {apt.speciality_name || "Teleconsulta"}
                    </Text>

                    {/* Profissional */}
                    {apt.professional_name && (
                      <View style={styles.scheduledDoctorRow}>
                        <Ionicons name="person-circle-outline" size={18} color="#999" />
                        <Text style={styles.scheduledDoctorText} numberOfLines={1}>
                          {apt.professional_name}
                        </Text>
                      </View>
                    )}

                    {/* Ações */}
                    <View style={styles.scheduledCardActions}>
                      {soon && (
                        <TouchableOpacity
                          style={styles.enterButton}
                          onPress={() => handleResumeAppointment(apt)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="videocam" size={16} color="#fff" />
                          <Text style={styles.enterButtonText}>Entrar na consulta</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.cancelTextButton}
                        onPress={() => handleCancelAppointment(apt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelTextButtonLabel}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.cardsContainer}>
          {/* Card: Consultar Agora */}
          <TouchableOpacity
            style={[styles.card, styles.immediateCard]}
            onPress={handleConsultarAgora}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: "#ffffff" }]}>
                <Ionicons name="videocam-outline" size={28} color="#00C853" />
              </View>
              <View style={[styles.cardBadge, { backgroundColor: "#00A843" }]}>
                <Text style={styles.badgeText}>Imediato</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Consultar Agora</Text>
            <Text style={styles.cardDescription}>
              Atendimento com médico de plantão por videochamada
            </Text>
          </TouchableOpacity>

          {/* Card: Agendar Consulta */}
          <TouchableOpacity
            style={[styles.card, styles.scheduleCard]}
            onPress={handleAgendarConsulta}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: "#ffffff" }]}>
                <Ionicons name="calendar-outline" size={28} color="#032FEA" />
              </View>
              <View style={[styles.cardBadge, { backgroundColor: "#0225BB" }]}>
                <Text style={styles.badgeText}>Agendar</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Agendar Consulta</Text>
            <Text style={styles.cardDescription}>
              Escolha especialidade, data e horário para sua teleconsulta
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
              Selecione a especialidade, data e horário disponíveis
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>
              Confirme o profissional e realize sua teleconsulta por vídeo
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Para quem é a consulta? */}
      <Modal transparent visible={showPacienteModal} animationType="slide">
        <View style={styles.pacienteModalOverlay}>
          <View style={styles.pacienteModalContainer}>
            <View style={styles.pacienteModalHandle} />
            <Text style={styles.pacienteModalTitle}>Para quem é a consulta?</Text>
            <Text style={styles.pacienteModalSubtitle}>
              Selecione o paciente que será atendido
            </Text>

            <View style={styles.pacienteList}>
              {pacientes.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.pacienteItem}
                  onPress={() => handleSelectPaciente(p)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pacienteAvatar, p.isTitular && styles.pacienteAvatarTitular]}>
                    <Ionicons
                      name={p.isTitular ? "person" : "people"}
                      size={22}
                      color={p.isTitular ? "#032FEA" : "#666"}
                    />
                  </View>
                  <View style={styles.pacienteInfo}>
                    <Text style={styles.pacienteNome}>{p.nome}</Text>
                    <Text style={styles.pacienteTipo}>
                      {p.isTitular ? "Titular" : "Dependente"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.pacienteModalCancel}
              onPress={() => {
                setShowPacienteModal(false);
                setPendingAction(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.pacienteModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay ao cancelar */}
      <Modal transparent visible={cancelling} animationType="fade">
        <View style={styles.cancelOverlay}>
          <View style={styles.cancelOverlayBox}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.cancelOverlayText}>Cancelando consulta...</Text>
          </View>
        </View>
      </Modal>
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

  // Immediate resume banner (orange)
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F57C00",
    marginHorizontal: 20,
    marginBottom: 12,
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

  // Scheduled appointments section
  scheduledSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  scheduledSectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },

  // Scheduled card (white with accent bar)
  scheduledCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  scheduledAccent: {
    width: 4,
    backgroundColor: "#032FEA",
  },
  scheduledAccentSoon: {
    backgroundColor: "#00C853",
  },
  scheduledContent: {
    flex: 1,
    padding: 14,
  },
  scheduledCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduledDateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduledDateText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#666",
  },
  scheduledDateSoon: {
    color: "#00C853",
  },
  timeBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeBadgeSoon: {
    backgroundColor: "#E8F5E9",
  },
  timeBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: "#666",
  },
  timeBadgeTextSoon: {
    color: "#00C853",
  },

  // Paciente badge no card agendado
  pacienteBadgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  pacienteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#032FEA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  pacienteBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: "#fff",
  },

  scheduledCardSpecialty: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#1A1A2E",
    marginBottom: 4,
  },
  scheduledDoctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  scheduledDoctorText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#888",
    flex: 1,
  },
  scheduledCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  enterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00C853",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  enterButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  cancelTextButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelTextButtonLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#e74c3c",
  },

  // Action cards
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

  // Paciente selection modal
  pacienteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pacienteModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: "70%",
  },
  pacienteModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  pacienteModalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#1A1A2E",
    marginBottom: 4,
  },
  pacienteModalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#888",
    marginBottom: 24,
  },
  pacienteList: {
    gap: 8,
  },
  pacienteItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  pacienteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  pacienteAvatarTitular: {
    backgroundColor: "#E8EEFF",
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNome: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#1A1A2E",
    marginBottom: 2,
  },
  pacienteTipo: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#888",
  },
  pacienteModalCancel: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 14,
  },
  pacienteModalCancelText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#e74c3c",
  },

  // Cancel loading overlay
  cancelOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelOverlayBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cancelOverlayText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#333",
  },
});
