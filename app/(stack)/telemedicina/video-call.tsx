import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
} from "react-native";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parâmetros da videochamada
  const apiKey = params.apiKey as string;
  const sessionId = params.sessionId as string;
  const token = params.token as string;
  const appointmentId = parseInt(params.appointmentId as string);

  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log("[VIDEO_CALL] Iniciando sessão de vídeo:", {
      apiKey,
      sessionId,
      appointmentId,
    });
  }, []);

  // HTML que implementa o Vonage Video usando o JS SDK
  const videoCallHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      overflow: hidden;
    }

    #videos {
      position: relative;
      width: 100vw;
      height: 100vh;
    }

    #subscriber {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    #publisher {
      position: absolute;
      top: 40px;
      right: 20px;
      width: 120px;
      height: 160px;
      border: 2px solid #fff;
      border-radius: 12px;
      z-index: 10;
      overflow: hidden;
    }

    #controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 30px 20px;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 100;
    }

    .control-btn {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      border: none;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      transition: background 0.2s;
    }

    .control-btn:active {
      background: rgba(255, 255, 255, 0.3);
    }

    .control-btn.off {
      background: #e74c3c;
    }

    .control-btn.end {
      width: 70px;
      height: 70px;
      background: #e74c3c;
      font-size: 32px;
    }

    #status {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      text-align: center;
      z-index: 5;
      background: rgba(0, 0, 0, 0.7);
      padding: 20px 40px;
      border-radius: 12px;
    }

    .hidden {
      display: none;
    }
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
    const apiKey = "${apiKey}";
    const sessionId = "${sessionId}";
    const token = "${token}";

    let session;
    let publisher;
    let subscriber;
    let audioEnabled = true;
    let videoEnabled = true;

    const statusDiv = document.getElementById('status');
    const toggleAudioBtn = document.getElementById('toggleAudio');
    const toggleVideoBtn = document.getElementById('toggleVideo');
    const endCallBtn = document.getElementById('endCall');

    function showStatus(message) {
      statusDiv.textContent = message;
      statusDiv.classList.remove('hidden');
    }

    function hideStatus() {
      statusDiv.classList.add('hidden');
    }

    function sendMessage(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
    }

    // Inicializar sessão
    session = OT.initSession(apiKey, sessionId);

    // Criar publisher (câmera do usuário)
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      publishAudio: true,
      publishVideo: true,
      style: {
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off'
      }
    }, function(error) {
      if (error) {
        console.error('Erro ao criar publisher:', error);
        sendMessage('error', error.message);
        showStatus('Erro ao acessar câmera');
      } else {
        console.log('Publisher criado com sucesso');
      }
    });

    // Conectar à sessão
    session.connect(token, function(error) {
      if (error) {
        console.error('Erro ao conectar:', error);
        sendMessage('error', error.message);
        showStatus('Erro ao conectar');
      } else {
        console.log('Conectado à sessão');
        session.publish(publisher, function(error) {
          if (error) {
            console.error('Erro ao publicar:', error);
            sendMessage('error', error.message);
            showStatus('Erro ao publicar vídeo');
          } else {
            console.log('Publicando vídeo');
            sendMessage('connected', {});
            showStatus('Aguardando médico...');
          }
        });
      }
    });

    // Evento: subscriber conectou (médico entrou)
    session.on('streamCreated', function(event) {
      console.log('Médico entrou na chamada');
      subscriber = session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        style: {
          buttonDisplayMode: 'off',
          nameDisplayMode: 'off'
        }
      }, function(error) {
        if (error) {
          console.error('Erro ao criar subscriber:', error);
        } else {
          console.log('Subscriber criado');
          hideStatus();
          sendMessage('doctorJoined', {});
        }
      });
    });

    // Evento: subscriber desconectou (médico saiu)
    session.on('streamDestroyed', function(event) {
      console.log('Médico saiu da chamada');
      showStatus('Médico saiu da chamada');
      sendMessage('doctorLeft', {});
    });

    // Controles
    toggleAudioBtn.addEventListener('click', function() {
      audioEnabled = !audioEnabled;
      publisher.publishAudio(audioEnabled);
      toggleAudioBtn.textContent = audioEnabled ? '🎤' : '🔇';
      toggleAudioBtn.classList.toggle('off', !audioEnabled);
      sendMessage('audioToggled', { enabled: audioEnabled });
    });

    toggleVideoBtn.addEventListener('click', function() {
      videoEnabled = !videoEnabled;
      publisher.publishVideo(videoEnabled);
      toggleVideoBtn.textContent = videoEnabled ? '📹' : '🚫';
      toggleVideoBtn.classList.toggle('off', !videoEnabled);
      sendMessage('videoToggled', { enabled: videoEnabled });
    });

    endCallBtn.addEventListener('click', function() {
      sendMessage('endCall', {});
    });

    // Tratar desconexão
    session.on('sessionDisconnected', function(event) {
      console.log('Sessão desconectada:', event.reason);
      showStatus('Chamada encerrada');
      sendMessage('disconnected', { reason: event.reason });
    });

    console.log('Video call initialized');
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
          Toast.show({
            type: "success",
            text1: "Médico entrou na chamada",
          });
          break;

        case "doctorLeft":
          Toast.show({
            type: "info",
            text1: "Médico saiu da chamada",
          });
          break;

        case "audioToggled":
          console.log("[VIDEO_CALL] Áudio:", message.data.enabled);
          break;

        case "videoToggled":
          console.log("[VIDEO_CALL] Vídeo:", message.data.enabled);
          break;

        case "endCall":
          handleEndCall();
          break;

        case "disconnected":
          Toast.show({
            type: "info",
            text1: "Chamada encerrada",
          });
          setTimeout(() => router.back(), 1500);
          break;

        case "error":
          Alert.alert("Erro", message.data);
          break;
      }
    } catch (error) {
      console.error("[VIDEO_CALL] Erro ao processar mensagem:", error);
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
            Toast.show({
              type: "success",
              text1: "Consulta encerrada",
            });
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <WebView
        ref={webViewRef}
        source={{ html: videoCallHTML }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaTypes="all"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("[VIDEO_CALL] WebView error:", nativeEvent);
          Alert.alert("Erro", "Ocorreu um erro ao carregar a videochamada");
        }}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Iniciando videochamada...</Text>
        </View>
      )}
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 15,
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
});
