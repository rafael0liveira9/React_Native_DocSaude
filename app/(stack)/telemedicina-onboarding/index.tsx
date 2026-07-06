import telemedicinaService from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  const insets = useSafeAreaInsets();
  const themeColors = Colors["dark"];

  const [loadingTerms, setLoadingTerms] = useState(true);
  const [termText, setTermText] = useState<string>("");
  const [termVersion, setTermVersion] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsModal, setTermsModal] = useState(false);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [channels, setChannels] = useState<{ sms: boolean; email: boolean }>({
    sms: false,
    email: false,
  });
  const submittingRef = useRef(false); // guard síncrono anti-duplo-toque

  useEffect(() => {
    (async () => {
      const terms = await telemedicinaService.getOnboardingTerms();
      setTermText(terms.term_text || "");
      setTermVersion(terms.term_version);
      setLoadingTerms(false);
    })();
    (async () => {
      const status = await telemedicinaService.getOnboardingStatus();
      setMaskedPhone(status.maskedPhone ?? null);
      setMaskedEmail(status.maskedEmail ?? null);
      const ch = status.channels || { sms: false, email: false };
      setChannels(ch);
      // Padrão SMS; se não houver telefone, cai para e-mail.
      setChannel(ch.sms ? "sms" : ch.email ? "email" : "sms");
    })();
  }, []);

  // Política de senha exigida pela Teladoc: MÍNIMO de 12 caracteres, com
  // maiúscula, minúscula, número e caractere especial.
  // (A regra "não reutilizar as últimas 5 senhas" é validada pela própria Teladoc.)
  const pwChecks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const pwValid = Object.values(pwChecks).every(Boolean);

  const canSubmit =
    pwValid && password === confirm && accepted && !submitting;

  async function handleSubmit() {
    if (submittingRef.current) return;
    if (!pwValid) {
      Alert.alert(
        "Senha fora do formato",
        "A senha deve ter no mínimo 12 caracteres, com letra maiúscula, minúscula, número e caractere especial."
      );
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
      notificationChannel: channel,
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
              placeholder="Mínimo de 12 caracteres"
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

          {password.length > 0 && (
            <View style={styles.pwRules}>
              {[
                { ok: pwChecks.length, label: "Mínimo de 12 caracteres" },
                { ok: pwChecks.upper, label: "1 letra maiúscula" },
                { ok: pwChecks.lower, label: "1 letra minúscula" },
                { ok: pwChecks.number, label: "1 número" },
                { ok: pwChecks.special, label: "1 caractere especial (!@#$…)" },
              ].map((r) => (
                <View key={r.label} style={styles.pwRuleRow}>
                  <Ionicons
                    name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                    size={15}
                    color={r.ok ? "#2ecc71" : "#8892a6"}
                  />
                  <Text
                    style={[
                      styles.pwRuleText,
                      { color: r.ok ? themeColors.text : "#8892a6" },
                    ]}
                  >
                    {r.label}
                  </Text>
                </View>
              ))}
              <Text style={[styles.pwRuleText, { color: "#8892a6", marginTop: 4 }]}>
                Não pode ser nenhuma das suas últimas 5 senhas.
              </Text>
            </View>
          )}

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

          {(channels.sms || channels.email) && (
            <>
              <Text style={[styles.label, { color: themeColors.text, marginTop: 18 }]}>
                Onde deseja receber o código de verificação?
              </Text>
              <View style={styles.channelRow}>
                {channels.sms && (
                  <Pressable
                    onPress={() => setChannel("sms")}
                    style={[
                      styles.channelCard,
                      {
                        backgroundColor: themeColors.backgroundSecondary,
                        borderColor: channel === "sms" ? themeColors.tint : "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={20}
                      color={channel === "sms" ? themeColors.tint : themeColors.background}
                    />
                    <Text style={[styles.channelTitle, { color: themeColors.background }]}>SMS</Text>
                    <Text style={[styles.channelDest, { color: themeColors.background }]}>
                      {maskedPhone || "seu telefone"}
                    </Text>
                  </Pressable>
                )}
                {channels.email && (
                  <Pressable
                    onPress={() => setChannel("email")}
                    style={[
                      styles.channelCard,
                      {
                        backgroundColor: themeColors.backgroundSecondary,
                        borderColor: channel === "email" ? themeColors.tint : "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={channel === "email" ? themeColors.tint : themeColors.background}
                    />
                    <Text style={[styles.channelTitle, { color: themeColors.background }]}>E-mail</Text>
                    <Text style={[styles.channelDest, { color: themeColors.background }]} numberOfLines={1}>
                      {maskedEmail || "seu e-mail"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          <View style={styles.termsLabelRow}>
            <Text style={[styles.label, { color: themeColors.text, marginBottom: 0 }]}>
              Termo de uso{termVersion ? ` (v${termVersion})` : ""}
            </Text>
            {!loadingTerms && !!termText && (
              <Pressable
                onPress={() => setTermsModal(true)}
                hitSlop={8}
                style={styles.fullscreenBtn}
              >
                <Ionicons name="expand-outline" size={16} color={themeColors.tint} />
                <Text style={[styles.fullscreenText, { color: themeColors.tint }]}>
                  Tela cheia
                </Text>
              </Pressable>
            )}
          </View>
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

      <Modal
        visible={termsModal}
        animationType="slide"
        onRequestClose={() => setTermsModal(false)}
        statusBarTranslucent
      >
        <View style={[styles.safe, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
          <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />
          <View style={styles.header}>
            <View style={styles.backBtn} />
            <Text style={[styles.title, { color: themeColors.text }]}>
              Termo de uso{termVersion ? ` (v${termVersion})` : ""}
            </Text>
            <Pressable onPress={() => setTermsModal(false)} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color={themeColors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 40 }]}>
            <Text style={[styles.modalTermsText, { color: themeColors.text }]}>
              {termText}
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  closeBtn: { width: 40, alignItems: "flex-end" },
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
  pwRules: { marginTop: 2, marginBottom: 10, gap: 4 },
  pwRuleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pwRuleText: { fontSize: 12, fontFamily: Fonts.regular },
  channelRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  channelCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 3,
  },
  channelTitle: { fontSize: 13, fontFamily: Fonts.semiBold },
  channelDest: { fontSize: 12, fontFamily: Fonts.regular, opacity: 0.8 },
  termsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 6,
  },
  fullscreenBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  fullscreenText: { fontSize: 13, fontFamily: Fonts.semiBold },
  termsBox: { borderRadius: 12, padding: 14, marginBottom: 14 },
  termsText: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18 },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalTermsText: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
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
