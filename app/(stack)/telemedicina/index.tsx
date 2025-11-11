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
          text1: "Erro ao carregar dados do usuário",
        });
        router.back();
        return;
      }

      console.log(
        "[TELEMEDICINA_SCREEN] Inicializando para usuário:",
        userIdFromStore
      );

      const isRegistered = await telemedicinaService.isRegistered();

      if (!isRegistered) {
        console.log("[TELEMEDICINA_SCREEN] Registrando usuário...");
        await telemedicinaService.register(parseInt(userIdFromStore));
        console.log("[TELEMEDICINA_SCREEN] Usuário registrado!");
      }

      await telemedicinaService.validate(parseInt(userIdFromStore));
      console.log("[TELEMEDICINA_SCREEN] Acesso validado!");
    } catch (error: any) {
      console.error("[TELEMEDICINA_SCREEN] Erro ao inicializar:", error);
      setHasError(true);

      // Não mostra erro de autenticação do backend aqui
      // Permitir acesso mesmo com erro de configuração
      Toast.show({
        type: "info",
        text1: "Serviço em configuração",
        text2: "Algumas funcionalidades podem estar indisponíveis",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsultaNow = () => {
    if (hasError) {
      Toast.show({
        type: "info",
        text1: "Serviço temporariamente indisponível",
        text2: "Por favor, tente novamente mais tarde",
      });
      return;
    }
    router.push("/(stack)/telemedicina/consulta-imediata" as any);
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
            Pronto Atendimento
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: "#999" }]}>
            Escolha como deseja ser atendido
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.card, styles.primaryCard]}
            onPress={handleConsultaNow}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#ffffff" }]}
              >
                <Text style={styles.cardIcon}>🩺</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>Rápido</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Consultar Agora</Text>
            <Text style={styles.cardDescription}>
              Atendimento imediato com médico disponível online
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              Clique em &quot;Consultar Agora&quot; para iniciar
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>
              Aguarde enquanto conectamos você a um médico
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>
              Realize sua consulta por videochamada
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
  primaryCard: {
    backgroundColor: "#00E276",
  },
  secondaryCard: {
    backgroundColor: "#0b1635",
  },
  tertiaryCard: {
    backgroundColor: "#34495e",
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
  cardIcon: {
    fontSize: 28,
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
  comingSoonBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
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
