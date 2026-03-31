import { Fonts } from "@/constants/Fonts";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { Image } from "react-native";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import telemedicinaService from "@/api/telemedicina";
import { logCrash } from "@/api/firebase";

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const apiKey = params.apiKey as string;
  const sessionId = params.sessionId as string;
  const token = params.token as string;
  const appointmentId = parseInt(params.appointmentId as string);

  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(
    Platform.OS !== "android"
  );
  const webViewRef = useRef<WebView>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solicitar permissões nativas no Android
  useEffect(() => {
    if (Platform.OS === "android") {
      console.log("[VIDEO_CALL] Solicitando permissões nativas Android...");
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
          console.log("[VIDEO_CALL] Permissões:", {
            camera: cam ? "GRANTED" : "DENIED",
            audio: mic ? "GRANTED" : "DENIED",
          });
          if (cam && mic) {
            setPermissionsGranted(true);
          } else {
            Alert.alert(
              "Permissão necessária",
              "Câmera e microfone são necessários para a videochamada."
            );
          }
        })
        .catch((err) => {
          console.error("[VIDEO_CALL] Erro ao solicitar permissões:", err);
          logCrash(`[VIDEO_CALL] Erro permissões: ${err}`);
        });
    }
  }, []);

  useEffect(() => {
    console.log("[VIDEO_CALL] Iniciando sessão:", {
      apiKey,
      sessionId,
      appointmentId,
    });
  }, []);

  // Polling de mensagens do chat
  const fetchChatMessages = useCallback(async () => {
    try {
      const result = await telemedicinaService.getChatMessages(appointmentId);
      setChatMessages(result.messages);
    } catch (error) {
      // silencioso - polling
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchChatMessages();
    chatPollRef.current = setInterval(fetchChatMessages, 5000);
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [fetchChatMessages]);

  const handleSendChat = async () => {
    if (!chatText.trim()) return;
    try {
      setSendingChat(true);
      await telemedicinaService.sendChatMessage(appointmentId, chatText.trim());
      setChatText("");
      await fetchChatMessages();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao enviar mensagem" });
    } finally {
      setSendingChat(false);
    }
  };

  const restartWebViewCamera = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof publisher !== 'undefined' && publisher) {
          publisher.publishVideo(false);
          setTimeout(function() {
            publisher.publishVideo(true);
            if (typeof videoEnabled !== 'undefined') videoEnabled = true;
            var btn = document.getElementById('toggleVideo');
            if (btn) { btn.textContent = '📹'; btn.classList.remove('off'); }
          }, 500);
        }
        true;
      `);
    }
  };

  const sendImageAttachment = async (imageUri: string, fromCamera?: boolean) => {
    try {
      setUploadingImage(true);
      setPendingImageUri(imageUri);
      const msg = chatText.trim() || "";
      await telemedicinaService.sendChatMessageWithAttachment(
        appointmentId,
        msg,
        imageUri
      );
      setChatText("");
      await fetchChatMessages();
      Toast.show({ type: "success", text1: "Imagem enviada" });
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao enviar imagem" });
    } finally {
      setUploadingImage(false);
      setPendingImageUri(null);
      if (fromCamera) restartWebViewCamera();
    }
  };

  const handlePickAttachment = async () => {
    if (uploadingImage) return;
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Precisamos acessar sua galeria para enviar imagens."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const imageUri = result.assets[0].uri;

      Alert.alert("Enviar imagem", "Deseja enviar esta imagem no chat?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: () => sendImageAttachment(imageUri),
        },
      ]);
    } catch (error) {
      console.error("[VIDEO_CALL] Erro ao selecionar imagem:", error);
    }
  };

  const handleTakePhoto = async () => {
    if (uploadingImage) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Precisamos acessar sua câmera para tirar fotos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        restartWebViewCamera();
        return;
      }

      await sendImageAttachment(result.assets[0].uri, true);
    } catch (error) {
      console.error("[VIDEO_CALL] Erro ao tirar foto:", error);
      restartWebViewCamera();
    }
  };

  const navigateToRating = async () => {
    await telemedicinaService.finishAppointment(appointmentId);
    router.replace({
      pathname: "/(stack)/telemedicina/avaliacao" as any,
      params: { appointmentId: appointmentId.toString() },
    });
  };

  // Sem injectedJavaScriptBeforeContentLoaded - interceptor vai direto no HTML

  // HTML da videochamada
  const videoCallHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; overflow: hidden; }
    #videos { position: relative; width: 100vw; height: 100vh; }
    #subscriber { position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 1; }
    #publisher { position: absolute; top: 40px; right: 20px; width: 120px; height: 160px; border: 2px solid #fff; border-radius: 12px; z-index: 10; overflow: hidden; }
    #controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 30px 20px; background: rgba(0,0,0,0.8); display: flex; justify-content: space-around; align-items: center; z-index: 100; }
    .control-btn { width: 60px; height: 60px; border-radius: 30px; border: none; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); }
    .control-btn.off { background: #e74c3c; }
    .control-btn.end { width: 70px; height: 70px; background: #e74c3c; font-size: 32px; }
    #status { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: white; font-size: 18px; text-align: center; z-index: 5; background: rgba(0,0,0,0.7); padding: 20px 40px; border-radius: 12px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="videos">
    <div id="subscriber"></div>
    <div id="publisher"></div>
    <div id="status">Conectando...</div>
  </div>

  <div id="controls">
    <button id="toggleAudio" class="control-btn">🎤</button>
    <button id="endCall" class="control-btn end">📞</button>
    <button id="toggleVideo" class="control-btn">📹</button>
  </div>

  <script src="https://static.opentok.com/v2/js/opentok.min.js"></script>
  <script>
    var apiKey = "${apiKey}";
    var sessionId = "${sessionId}";
    var token = "${token}";

    var session, publisher, subscriber;
    var audioEnabled = true, videoEnabled = true;
    var statusDiv = document.getElementById('status');

    function showStatus(msg) { statusDiv.textContent = msg; statusDiv.classList.remove('hidden'); }
    function hideStatus() { statusDiv.classList.add('hidden'); }
    function sendMessage(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
    }

    sendMessage('log', 'OpenTok v' + (OT.version || '?') + ' carregado');
    sendMessage('log', 'UserAgent: ' + navigator.userAgent);

    // === INTERCEPTOR getUserMedia ===
    // Neste ponto o SDK ja carregou e getUserMedia existe no browser
    (function() {
      var hasGUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      var hasProtoGUM = !!(typeof MediaDevices !== 'undefined' && MediaDevices.prototype && MediaDevices.prototype.getUserMedia);
      sendMessage('log', '[GUM] navigator.mediaDevices.getUserMedia: ' + hasGUM);
      sendMessage('log', '[GUM] MediaDevices.prototype.getUserMedia: ' + hasProtoGUM);

      var nativeGUM = null;

      if (hasProtoGUM) {
        nativeGUM = MediaDevices.prototype.getUserMedia;
        sendMessage('log', '[GUM] Capturado do prototype');
      } else if (hasGUM) {
        nativeGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        sendMessage('log', '[GUM] Capturado da instancia');
      }

      if (nativeGUM) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
          sendMessage('log', '[GUM] Original: ' + JSON.stringify(constraints));
          var simple = { audio: true, video: true };
          if (constraints && constraints.video && typeof constraints.video === 'object' && constraints.video.facingMode) {
            simple.video = { facingMode: constraints.video.facingMode };
          }
          sendMessage('log', '[GUM] Simplificado: ' + JSON.stringify(simple));

          return nativeGUM.call(navigator.mediaDevices, simple).then(function(stream) {
            var tracks = stream.getTracks().map(function(t) { return t.kind + ':' + t.readyState; });
            sendMessage('log', '[GUM] Stream OK! ' + tracks.join(', '));
            return stream;
          }).catch(function(err) {
            sendMessage('log', '[GUM] Falhou (' + err.name + ': ' + err.message + ')');
            sendMessage('log', '[GUM] Tentando audio-only...');
            return nativeGUM.call(navigator.mediaDevices, { audio: true, video: false }).catch(function(err2) {
              sendMessage('error', '[GUM] Tudo falhou: ' + err2.name + ' - ' + err2.message);
              throw err2;
            });
          });
        };
        sendMessage('log', '[GUM] Interceptor instalado!');
      } else {
        sendMessage('error', '[GUM] getUserMedia NAO EXISTE neste WebView!');
      }

      // Enumerar dispositivos
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
          sendMessage('log', '[GUM] Dispositivos: ' + devices.map(function(d) { return d.kind; }).join(', '));
        }).catch(function() {});
      }
    })();
    // === FIM INTERCEPTOR ===

    session = OT.initSession(apiKey, sessionId);

    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      publishAudio: true,
      publishVideo: true,
      resolution: '320x240',
      frameRate: 15,
      style: { buttonDisplayMode: 'off', nameDisplayMode: 'off' }
    }, function(error) {
      if (error) {
        sendMessage('error', 'Publisher: ' + error.message);
        showStatus('Erro ao acessar câmera');
      } else {
        sendMessage('log', 'Publisher criado com sucesso');
      }
    });

    session.connect(token, function(error) {
      if (error) {
        sendMessage('error', 'Conexão: ' + error.message);
        showStatus('Erro ao conectar');
      } else {
        sendMessage('log', 'Conectado à sessão');
        session.publish(publisher, function(error) {
          if (error) {
            sendMessage('error', 'Publicação: ' + error.message);
            showStatus('Erro ao publicar vídeo');
          } else {
            sendMessage('log', 'Publicando vídeo');
            sendMessage('connected', {});
            showStatus('Aguardando médico...');
          }
        });
      }
    });

    session.on('streamCreated', function(event) {
      sendMessage('log', 'Médico entrou');
      subscriber = session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append', width: '100%', height: '100%',
        style: { buttonDisplayMode: 'off', nameDisplayMode: 'off' }
      }, function(error) {
        if (!error) { hideStatus(); sendMessage('doctorJoined', {}); }
      });
    });

    session.on('streamDestroyed', function() {
      showStatus('Médico saiu da chamada');
      sendMessage('doctorLeft', {});
    });

    session.on('sessionDisconnected', function(event) {
      showStatus('Chamada encerrada');
      sendMessage('disconnected', { reason: event.reason });
    });

    document.getElementById('toggleAudio').addEventListener('click', function() {
      audioEnabled = !audioEnabled;
      publisher.publishAudio(audioEnabled);
      this.textContent = audioEnabled ? '🎤' : '🔇';
      this.classList.toggle('off', !audioEnabled);
    });

    document.getElementById('toggleVideo').addEventListener('click', function() {
      videoEnabled = !videoEnabled;
      publisher.publishVideo(videoEnabled);
      this.textContent = videoEnabled ? '📹' : '🚫';
      this.classList.toggle('off', !videoEnabled);
    });

    document.getElementById('endCall').addEventListener('click', function() {
      sendMessage('endCall', {});
    });
  </script>
</body>
</html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log("[VIDEO_CALL] Mensagem do WebView:", message);

      switch (message.type) {
        case "connected":
          setLoading(false);
          break;
        case "doctorJoined":
          Toast.show({ type: "success", text1: "Médico entrou na chamada" });
          break;
        case "doctorLeft":
          Toast.show({ type: "info", text1: "Médico saiu da chamada" });
          break;
        case "endCall":
          handleEndCall();
          break;
        case "disconnected":
          Toast.show({ type: "info", text1: "Chamada encerrada" });
          setTimeout(() => navigateToRating(), 1500);
          break;
        case "log":
          console.log("[VIDEO_CALL] [WebView]:", message.data);
          break;
        case "error":
          console.warn("[VIDEO_CALL] Erro WebView:", message.data);
          logCrash(`[VIDEO_CALL] WebView erro: ${message.data}`);
          setLoading(false);
          break;
      }
    } catch (error) {
      console.error("[VIDEO_CALL] Erro ao processar mensagem:", error);
      logCrash(`[VIDEO_CALL] Erro processar mensagem: ${error}`);
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      "Encerrar Consulta",
      "Deseja realmente encerrar esta consulta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: () => {
            Toast.show({ type: "success", text1: "Consulta encerrada" });
            navigateToRating();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {permissionsGranted && (
        <WebView
          ref={webViewRef}
          source={{ html: videoCallHTML, baseUrl: "https://localhost" }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          mediaCapturePermissionGrantType="grant"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          androidLayerType="hardware"
          allowFileAccess={true}
          onError={(syntheticEvent) => {
            console.error(
              "[VIDEO_CALL] WebView error:",
              syntheticEvent.nativeEvent
            );
            Alert.alert(
              "Erro",
              "Ocorreu um erro ao carregar a videochamada"
            );
          }}
        />
      )}

      {/* Botao do chat flutuante */}
      {!loading && (
        <TouchableOpacity
          style={styles.chatFloatingButton}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.chatFloatingIcon}>💬</Text>
          {chatMessages.length > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Modal de chat */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatModalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.chatModalOverlay}
            activeOpacity={1}
            onPress={() => setChatVisible(false)}
          />
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Chat</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Text style={styles.chatCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={chatMessages}
              keyExtractor={(item, index) => String(item.id || index)}
              inverted
              contentContainerStyle={styles.chatMessagesList}
              ListEmptyComponent={<View style={styles.chatEmpty} />}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.chatBubble,
                    styles.chatBubblePatient,
                  ]}
                >
                  {item.attachment ? (
                    <Image
                      source={{ uri: item.attachment }}
                      style={styles.chatAttachmentImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  {item.message ? (
                    <Text
                      style={[
                        styles.chatBubbleText,
                        styles.chatBubbleTextPatient,
                      ]}
                    >
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={[styles.chatBubbleTime, { color: "rgba(0,0,0,0.5)" }]}>
                    Você
                  </Text>
                </View>
              )}
            />

            {uploadingImage && (
              <View style={styles.uploadingBar}>
                {pendingImageUri && (
                  <Image
                    source={{ uri: pendingImageUri }}
                    style={styles.uploadingPreview}
                    resizeMode="cover"
                  />
                )}
                <ActivityIndicator size="small" color="#00E276" />
                <Text style={styles.uploadingText}>Enviando imagem...</Text>
              </View>
            )}

            <View
              style={[
                styles.chatInputRow,
                { paddingBottom: Math.max(insets.bottom, 12) + 8 },
              ]}
            >
              <TouchableOpacity
                style={[styles.chatAttachButton, (sendingChat || uploadingImage) && { opacity: 0.4 }]}
                onPress={handlePickAttachment}
                disabled={sendingChat || uploadingImage}
              >
                <Text style={styles.chatAttachIcon}>📎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chatAttachButton, (sendingChat || uploadingImage) && { opacity: 0.4 }]}
                onPress={handleTakePhoto}
                disabled={sendingChat || uploadingImage}
              >
                <Text style={styles.chatAttachIcon}>📷</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                value={chatText}
                onChangeText={setChatText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#888"
                multiline
                maxLength={500}
                editable={!uploadingImage}
              />
              <TouchableOpacity
                style={[
                  styles.chatSendButton,
                  (!chatText.trim() || sendingChat || uploadingImage) &&
                    styles.chatSendButtonDisabled,
                ]}
                onPress={handleSendChat}
                disabled={!chatText.trim() || sendingChat || uploadingImage}
              >
                {sendingChat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.chatSendIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Iniciando videochamada...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 200,
  },
  loadingText: {
    marginTop: 15,
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  chatFloatingButton: {
    position: "absolute",
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 226, 118, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chatFloatingIcon: {
    fontSize: 26,
  },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  chatModalContainer: {
    flex: 1,
  },
  chatModalOverlay: {
    flex: 0.35,
  },
  chatPanel: {
    flex: 0.65,
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: "bold",
    color: "#fff",
  },
  chatCloseButton: {
    fontSize: 22,
    color: "#888",
    padding: 4,
  },
  chatMessagesList: {
    padding: 16,
    flexGrow: 1,
  },
  chatEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ scaleY: -1 }],
  },
  chatEmptyText: {
    color: "#666",
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  chatBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  chatBubblePatient: {
    backgroundColor: "#00E276",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  chatBubbleDoctor: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  chatBubbleTextPatient: {
    color: "#000",
  },
  chatBubbleTextDoctor: {
    color: "#fff",
  },
  chatBubbleTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    textAlign: "right",
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 6,
    width: "100%",
  },
  chatInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#2a2a3e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    fontFamily: Fonts.regular,
    maxHeight: 80,
  },
  chatSendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#00E276",
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendButtonDisabled: {
    backgroundColor: "#444",
  },
  chatSendIcon: {
    fontSize: 20,
    color: "#fff",
  },
  chatAttachButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  chatAttachIcon: {
    fontSize: 20,
  },
  chatAttachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  uploadingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#2a2a3e",
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 8,
  },
  uploadingPreview: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  uploadingText: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});
