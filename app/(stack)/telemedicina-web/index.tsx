import telemedicinaService from "@/api/telemedicina";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);

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

  useEffect(() => {
    (async () => {
      try {
        const userId = await SecureStore.getItemAsync("user-id");
        if (!userId) {
          setError("Sessão expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        const { url: ssoUrl } = await telemedicinaService.getSsoUrl(parseInt(userId));
        console.log("[TELEMEDICINA_WEB] URL recebida:", ssoUrl);
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
        <WebView
          ref={webRef}
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: themeColors.background }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={["*"]}
          startInLoadingState
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
          }}
          onError={({ nativeEvent }) => {
            console.error("[TELEMEDICINA_WEB] WebView erro:", nativeEvent);
          }}
          onHttpError={({ nativeEvent }) => {
            console.error("[TELEMEDICINA_WEB] HTTP erro:", nativeEvent.statusCode, nativeEvent.url);
          }}
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={themeColors.text} />
            </View>
          )}
        />
      )}
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
