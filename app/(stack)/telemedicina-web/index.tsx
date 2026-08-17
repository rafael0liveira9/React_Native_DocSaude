import telemedicinaService from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function TelemedicinaWebScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  // Credenciais de HTTP Basic Auth do portal (só existem em homologação).
  const [basicAuth, setBasicAuth] = useState<
    { username: string; password: string } | null
  >(null);
  // O SSO abre em /?redirect_token=<jwt> e o portal ainda renderiza a tela de
  // login enquanto processa o token e faz o auto-login. Sem isso o usuário vê o
  // login piscar antes de cair no portal já logado. Mantemos o carregamento por
  // cima da WebView até o redirecionamento terminar.
  const [portalPronto, setPortalPronto] = useState(false);
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const timeoutPronto = useRef<ReturnType<typeof setTimeout> | null>(null);

  const marcarPortalPronto = () => {
    if (timeoutPronto.current) {
      clearTimeout(timeoutPronto.current);
      timeoutPronto.current = null;
    }
    setPortalPronto(true);
  };

  const handleBack = () => {
    if (canGoBackRef.current && webRef.current) {
      webRef.current.goBack();
      return true;
    }
    router.back();
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, []);

  // Rede de segurança: se o portal não sinalizar o fim do redirecionamento (ex.:
  // troca de rota que o WebView não reporta), revela mesmo assim em vez de deixar
  // o usuário preso num spinner eterno.
  useEffect(() => {
    if (!url) return;
    timeoutPronto.current = setTimeout(() => setPortalPronto(true), 12000);
    return () => {
      if (timeoutPronto.current) clearTimeout(timeoutPronto.current);
    };
  }, [url]);

  // Solicita permissões nativas de câmera e microfone (necessárias para a
  // videochamada da Teladoc rodar dentro do WebView). Não bloqueia o portal:
  // o usuário pode navegar normalmente; a permissão precisa estar concedida
  // antes de iniciar a consulta. No Android, o WebView só consegue conceder o
  // getUserMedia da página se o app tiver a permissão nativa correspondente.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])
      .then((results) => {
        const cam =
          results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const mic =
          results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;
        console.log("[TELEMEDICINA_WEB] Permissões:", {
          camera: cam ? "GRANTED" : "DENIED",
          audio: mic ? "GRANTED" : "DENIED",
        });
        if (!cam || !mic) {
          Alert.alert(
            "Permissão necessária",
            "Câmera e microfone são necessários para a videochamada. Habilite nas configurações do app caso precise usar a teleconsulta."
          );
        }
      })
      .catch((err) => {
        console.error("[TELEMEDICINA_WEB] Erro ao solicitar permissões:", err);
      });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const userId = await SecureStore.getItemAsync("user-id");
        if (!userId) {
          setError("Sessão expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        const idNum = parseInt(userId);

        try {
          await telemedicinaService.validate(idNum);
          console.log("[TELEMEDICINA_WEB] Token Teladoc validado");
        } catch (validateErr) {
          console.warn(
            "[TELEMEDICINA_WEB] Falha em /validate, seguindo para SSO:",
            validateErr
          );
        }

        // Primeiro acesso: se o assinante ainda não fez o onboarding na Teladoc
        // (não tem 'patient'), o SSO cai na tela de login. Redireciona para o
        // onboarding (criar senha + aceitar termos) antes de gerar o SSO.
        const onboarding = await telemedicinaService.getOnboardingStatus();
        if (onboarding.needsOnboarding) {
          console.log("[TELEMEDICINA_WEB] Onboarding necessário, redirecionando");
          router.replace("/(stack)/telemedicina-onboarding" as any);
          return;
        }

        const { url: ssoUrl, basicAuth: portalAuth } =
          await telemedicinaService.getSsoUrl(idNum);
        console.log("[TELEMEDICINA_WEB] URL recebida:", ssoUrl);
        if (portalAuth) {
          console.log("[TELEMEDICINA_WEB] Portal exige Basic Auth (homologação)");
          setBasicAuth(portalAuth);
        }
        setUrl(ssoUrl);
      } catch (err: any) {
        console.error("[TELEMEDICINA_WEB] Erro ao obter URL:", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Não foi possível abrir a telemedicina";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themeColors.text }]}>Telemedicina</Text>
        <View style={styles.backBtn} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.text} />
          <Text style={[styles.msg, { color: themeColors.text }]}>Conectando...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.text} />
          <Text style={[styles.msg, { color: themeColors.text }]}>{error}</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Voltar</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && url && (
        <View style={styles.webWrap}>
          <WebView
            ref={webRef}
            source={{ uri: url }}
            // Só preenchido em homologação: o nginx do portalweb.homolodoc.com.br
            // exige Basic Auth e, sem isso, a navegação morre em 401.
            {...(basicAuth ? { basicAuthCredential: basicAuth } : {})}
            style={{ flex: 1, backgroundColor: themeColors.background }}
            userAgent="Mozilla/5.0 (Linux; Android 13; SM-A015M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            applicationNameForUserAgent="Chrome/120.0.0.0"
            injectedJavaScriptBeforeContentLoaded={`
              try {
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = window.chrome || { runtime: {} };
                if (navigator.userAgent.indexOf(' wv') !== -1) {
                  Object.defineProperty(navigator, 'userAgent', {
                    get: () => navigator.userAgent.replace(/\\s*wv\\)/, ')')
                  });
                }
              } catch (e) {}
              true;
            `}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            incognito={false}
            cacheEnabled
            cacheMode="LOAD_DEFAULT"
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            androidLayerType="hardware"
            originWhitelist={["*"]}
            injectedJavaScript={`
              (function(){
                var SELECTOR='.central-banner,.home-footer,.store-buttons,.v-navigation-drawer__prepend,.v-carousel';
                var styleId='td-hide-style';
                if(!document.getElementById(styleId)){
                  var s=document.createElement('style');
                  s.id=styleId;
                  s.textContent='html body .central-banner,html body .home-footer,html body .store-buttons,html body .v-navigation-drawer__prepend,html body .v-carousel{display:none !important;visibility:hidden !important;height:0 !important;overflow:hidden !important;}';
                  (document.head||document.documentElement).appendChild(s);
                }
                function hide(){
                  var nodes=document.querySelectorAll(SELECTOR);
                  for(var i=0;i<nodes.length;i++){
                    nodes[i].style.setProperty('display','none','important');
                  }
                }
                hide();
                setTimeout(hide,500);
                setTimeout(hide,2000);
                if(!window.__tdHideObserver){
                  var target=document.body||document.documentElement;
                  window.__tdHideObserver=new MutationObserver(hide);
                  window.__tdHideObserver.observe(target,{childList:true,subtree:true});
                }
              })();
              true;
            `}
            onMessage={(e) => {
              console.log("[TELEMEDICINA_WEB]", e.nativeEvent.data);
            }}
            onNavigationStateChange={(navState) => {
              canGoBackRef.current = navState.canGoBack;
              console.log("[TELEMEDICINA_WEB] Nav:", navState.url, "canGoBack:", navState.canGoBack);
              // Enquanto o redirect_token estiver na URL o portal ainda está
              // trocando o token por sessão — é nesse intervalo que a tela de
              // login aparece. Só revelamos quando ele sai da URL e o
              // carregamento termina.
              if (!navState.loading && !navState.url.includes("redirect_token")) {
                marcarPortalPronto();
              }
            }}
            onError={({ nativeEvent }) => {
              console.error("[TELEMEDICINA_WEB] WebView erro:", nativeEvent);
              // Falhou: revela para o usuário ver a mensagem de erro do portal em
              // vez de continuar olhando o spinner.
              marcarPortalPronto();
            }}
            onHttpError={({ nativeEvent }) => {
              console.error("[TELEMEDICINA_WEB] HTTP erro:", nativeEvent.statusCode, nativeEvent.url);
              // 401 aqui NÃO significa SSO recusado: o portal de homologação fica
              // atrás de Basic Auth do nginx e barra antes de olhar o redirect_token.
              if (nativeEvent.statusCode === 401) {
                console.error(
                  "[TELEMEDICINA_WEB] 401 - portal barrou o acesso. Basic Auth aplicado:",
                  basicAuth ? "SIM" : "NÃO"
                );
              }
            }}
          />

          {/* Mesmo spinner da etapa anterior, por cima da WebView: some só
              quando o SSO termina, então o login do portal nunca aparece. */}
          {!portalPronto && (
            <View
              style={[
                styles.center,
                StyleSheet.absoluteFillObject,
                { backgroundColor: themeColors.background },
              ]}
            >
              <ActivityIndicator size="large" color={themeColors.text} />
              <Text style={[styles.msg, { color: themeColors.text }]}>
                Conectando...
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  webWrap: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: Fonts.bold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  msg: { marginTop: 12, fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#00E276",
  },
  retryText: { color: "#0D1633", fontFamily: Fonts.bold, fontSize: 14 },
});
