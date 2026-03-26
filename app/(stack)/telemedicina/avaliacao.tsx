import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import telemedicinaService from "@/api/telemedicina";
import Toast from "react-native-toast-message";

export default function AvaliacaoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId: string }>();
  const themeColors = Colors["dark"];

  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const appointmentId = parseInt(params.appointmentId);

  const handleSubmit = async () => {
    if (rating === null) {
      Toast.show({ type: "error", text1: "Selecione uma nota" });
      return;
    }

    try {
      setSubmitting(true);
      await telemedicinaService.submitRating(appointmentId, rating, message);
      Toast.show({
        type: "success",
        text1: "Obrigado pela sua avaliacao!",
      });
      router.replace("/(main)");
    } catch (error) {
      console.error("[AVALIACAO] Erro:", error);
      Toast.show({ type: "error", text1: "Erro ao enviar avaliacao" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(main)");
  };

  const getRatingEmoji = (value: number) => {
    if (value <= 2) return "😞";
    if (value <= 4) return "😐";
    if (value <= 6) return "🙂";
    if (value <= 8) return "😊";
    return "🤩";
  };

  const getRatingColor = (value: number) => {
    if (value <= 2) return "#e74c3c";
    if (value <= 4) return "#e67e22";
    if (value <= 6) return "#f1c40f";
    if (value <= 8) return "#2ecc71";
    return "#00E276";
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.emoji}>
          {rating !== null ? getRatingEmoji(rating) : "🩺"}
        </Text>

        <Text style={[styles.title, { color: themeColors.text }]}>
          Como foi sua consulta?
        </Text>

        <Text style={styles.subtitle}>
          Sua avaliacao nos ajuda a melhorar o atendimento
        </Text>

        {/* Rating selector 0-10 */}
        <View style={styles.ratingRow}>
          {Array.from({ length: 11 }, (_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.ratingButton,
                rating === i && {
                  backgroundColor: getRatingColor(i),
                  borderColor: getRatingColor(i),
                },
              ]}
              onPress={() => setRating(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  rating === i && styles.ratingButtonTextSelected,
                ]}
              >
                {i}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabel}>Pessimo</Text>
          <Text style={styles.ratingLabel}>Excelente</Text>
        </View>

        {/* Feedback text */}
        <TextInput
          style={[styles.textInput, { color: themeColors.text }]}
          placeholder="Deixe um comentario (opcional)"
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            rating === null && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || rating === null}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Avaliacao</Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Pular</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#888",
    textAlign: "center",
    marginBottom: 28,
  },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  ratingButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#888",
  },
  ratingButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  ratingLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#666",
  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: Fonts.regular,
    minHeight: 100,
    marginBottom: 24,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#00E276",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#444",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: "bold",
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: "#888",
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
});
