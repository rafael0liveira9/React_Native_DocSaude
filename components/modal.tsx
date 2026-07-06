import { Fonts } from "@/constants/Fonts";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { API_URL } from "@/api/config";

const CACHE_DIR = `${FileSystem.documentDirectory}carteirinhas/`;

const INJECTED_JS = `
  (function() {
    var meta = document.querySelector('meta[name=viewport]');
    if (meta) {
      meta.content = 'width=640, initial-scale=1, maximum-scale=1, user-scalable=no';
    }
    var s = document.createElement('style');
    s.textContent =
      "html, body { min-height: 0 !important; padding: 12px !important; gap: 16px !important; justify-content: flex-start !important; }" +
      ".card-container { height: 320px !important; }";
    document.head.appendChild(s);
  })();
  true;
`;

interface PersonalCardModalProps {
  visible: boolean;
  titularId: number | null;
  themeColors: any;
  onClose: () => void;
}

function cachePath(id: number | string) {
  return `${CACHE_DIR}titular-${id}.html`;
}

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function readCached(id: number | string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(cachePath(id));
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(cachePath(id));
  } catch {
    return null;
  }
}

async function fetchAndCache(id: number | string): Promise<string | null> {
  try {
    // ?titular=1: renderiza somente a carteirinha desta pessoa (sem dependentes).
    // Cada card da home (titular ou dependente) já abre com o id da própria pessoa.
    const url = `${API_URL}/assinantes/${id}/carteirinha?titular=1`;
    console.log("[CARTEIRINHA] fetch:", url);
    const res = await fetch(url);
    console.log("[CARTEIRINHA] status:", res.status);
    if (!res.ok) {
      console.warn("[CARTEIRINHA] resposta nao OK:", res.status);
      return null;
    }
    const html = await res.text();
    console.log("[CARTEIRINHA] html len:", html.length);
    await ensureCacheDir();
    await FileSystem.writeAsStringAsync(cachePath(id), html);
    console.log("[CARTEIRINHA] cacheado em", cachePath(id));
    return html;
  } catch (e) {
    console.warn("[CARTEIRINHA] erro fetch:", e);
    return null;
  }
}

export default function PersonalCardModal({
  visible,
  titularId,
  themeColors,
  onClose,
}: PersonalCardModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const revalidatingRef = useRef(false);

  useEffect(() => {
    if (!visible || !titularId) {
      setHtml(null);
      revalidatingRef.current = false;
      return;
    }

    let cancelled = false;

    (async () => {
      console.log("[CARTEIRINHA] abrindo modal titularId:", titularId);
      await ensureCacheDir();
      const cached = await readCached(titularId);
      console.log("[CARTEIRINHA] cache existe:", !!cached, "len:", cached?.length ?? 0);
      if (cancelled) return;

      if (cached) {
        setHtml(cached);
        setIsLoading(false);
        revalidatingRef.current = true;
        const fresh = await fetchAndCache(titularId);
        if (cancelled) return;
        if (fresh && fresh !== cached) {
          console.log("[CARTEIRINHA] atualizando html (mudou)");
          setHtml(fresh);
        }
        revalidatingRef.current = false;
      } else {
        setIsLoading(true);
        const fresh = await fetchAndCache(titularId);
        if (cancelled) return;
        setIsLoading(false);
        if (fresh) {
          setHtml(fresh);
        } else {
          console.warn("[CARTEIRINHA] fresh vazio, nada para mostrar");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, titularId]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: "#0D1633" }]}>
        {titularId ? (
          <View style={styles.rotatedContainer}>
            <WebView
              originWhitelist={["*"]}
              source={{
                uri: `${API_URL}/assinantes/${titularId}/carteirinha?titular=1`,
              }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled={false}
              scrollEnabled
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              injectedJavaScript={INJECTED_JS}
              onLoadStart={() => console.log("[CARTEIRINHA] WebView loadStart")}
              onLoadEnd={() => console.log("[CARTEIRINHA] WebView loadEnd")}
              onError={(e) =>
                console.warn("[CARTEIRINHA] WebView error:", e.nativeEvent)
              }
            />
          </View>
        ) : (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={themeColors.tint} />
            {isLoading ? (
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Carregando carteirinha…
              </Text>
            ) : null}
          </View>
        )}

        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: themeColors.tint }]}
          hitSlop={12}
        >
          <AntDesign name="close" size={22} color={themeColors.background} />
        </Pressable>
      </View>
    </Modal>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rotatedContainer: {
    width: SCREEN_H,
    height: SCREEN_W,
    transform: [{ rotate: "90deg" }],
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
