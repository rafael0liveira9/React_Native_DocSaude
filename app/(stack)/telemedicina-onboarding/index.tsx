import telemedicinaService from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function TelemedicinaOnboardingScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];

  const [loadingTerms, setLoadingTerms] = useState(true);
  const [termText, setTermText] = useState<string>("");
  const [termVersion, setTermVersion] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // guard síncrono anti-duplo-toque

  useEffect(() => {
    (async () => {
      const terms = await telemedicinaService.getOnboardingTerms();
      setTermText(terms.term_text || "");
      setTermVersion(terms.term_version);
      setLoadingTerms(false);
    })();
  }, []);

  const canSubmit =
    password.length >= 8 && password === confirm && accepted && !submitting;

  async function handleSubmit() {
    if (submittingRef.current) return;
    if (password.length < 8) {
      Alert.alert("Senha curta", "A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Senhas diferentes", "A senha e a confirmação não conferem.");
      return;
    }
    if (!accepted) {
      Alert.alert("Termos", "É necessário aceitar os termos de uso para continuar.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const result = await telemedicinaService.submitOnboarding({
      password,
      passwordConfirmation: confirm,
      termsAccepted: accepted,
      termVersion,
    });
    submittingRef.current = false;
    setSubmitting(false);

    if (result.success) {
      // Onboarding concluído: segue para o SSO (agora o patient existe)
      router.replace("/(stack)/telemedicina-web" as any);
    } else {
      Alert.alert("Não foi possível concluir", result.message || "Tente novamente.");
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themeColors.text }]}>Telemedicina</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.heading, { color: themeColors.text }]}>
            Primeiro acesso à telemedicina
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text }]}>
            Crie uma senha para ativar seu atendimento. Essa senha também passa a
            valer para o seu acesso ao app.
          </Text>

          <Text style={[styles.label, { color: themeColors.text }]}>Senha</Text>
          <View style={[styles.inputBox, { backgroundColor: themeColors.backgroundSecondary }]}>
            <TextInput
              style={[styles.input, { color: themeColors.background }]}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#999"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={themeColors.background}
              />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: themeColors.text }]}>Confirmar senha</Text>
          <View style={[styles.inputBox, { backgroundColor: themeColors.backgroundSecondary }]}>
            <TextInput
              style={[styles.input, { color: themeColors.background }]}
              placeholder="Repita a senha"
              placeholderTextColor="#999"
              secureTextEntry={!showPass}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: themeColors.text, marginTop: 18 }]}>
            Termo de uso{termVersion ? ` (v${termVersion})` : ""}
          </Text>
          <View style={[styles.termsBox, { backgroundColor: themeColors.backgroundSecondary }]}>
            {loadingTerms ? (
              <ActivityIndicator color={themeColors.tint} />
            ) : (
              <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                <Text style={[styles.termsText, { color: themeColors.background }]}>
                  {termText || "Termo de uso indisponível no momento."}
                </Text>
              </ScrollView>
            )}
          </View>

          <Pressable
            style={styles.acceptRow}
            onPress={() => setAccepted((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={accepted ? "checkbox" : "square-outline"}
              size={22}
              color={accepted ? themeColors.tint : themeColors.text}
            />
            <Text style={[styles.acceptText, { color: themeColors.text }]}>
              Li e aceito os termos de uso da telemedicina
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.submit,
              { backgroundColor: canSubmit ? themeColors.tint : "#3A4767" },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Ativar telemedicina</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: Fonts.bold },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 6 },
  subtitle: { fontSize: 13, fontFamily: Fonts.regular, opacity: 0.85, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 13, fontFamily: Fonts.semiBold, marginBottom: 6 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, paddingVertical: 0 },
  termsBox: { borderRadius: 12, padding: 14, marginBottom: 14 },
  termsText: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18 },
  acceptRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  acceptText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular },
  submit: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#FFFFFF", fontSize: 15, fontFamily: Fonts.bold, fontWeight: "700" },
});
