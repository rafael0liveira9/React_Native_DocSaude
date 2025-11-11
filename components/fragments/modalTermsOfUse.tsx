import { Fonts } from "@/constants/Fonts";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewProps,
} from "react-native";
import RenderHtml from "react-native-render-html";

interface TermsOfUseModalProps extends ViewProps {
  visible?: boolean;
  themeColors?: any;
  text?: string;
  termsLink?: string;
  isLoading?: boolean;
  onConfirm?: (e: GestureResponderEvent) => void;
  onCancel?: () => void;
  close: () => void;
  termsOfUse?: any;
}

const { height } = Dimensions.get("window");

export function TermsOfUseModal({
  visible,
  themeColors,
  text = "Termos de Uso",
  termsLink = "",
  onConfirm,
  onCancel,
  close,
  isLoading,
  termsOfUse,
}: TermsOfUseModalProps) {
  const { width } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={close}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: "2.5%",
        }}
      >
        <View
          style={{
            backgroundColor: themeColors?.white || "#fff",
            borderRadius: 12,
            padding: 20,
            width: "92%",
            height: height * 0.85,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: themeColors?.black || "#333",
              fontSize: 24,
              fontWeight: "bold",
              fontFamily: Fonts.bold,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {text}
          </Text>

          <ScrollView
            style={{
              flex: 1,
              marginBottom: 16,
            }}
            showsVerticalScrollIndicator={true}
          >
            <View style={{ padding: 16 }}>
              <RenderHtml
                contentWidth={width - 32} // considerar padding
                source={{ html: termsOfUse.termo_uso }}
                defaultTextProps={{ selectable: true }}
                renderersProps={{
                  a: {
                    onPress: (_event: any, href: string) => {
                      Linking.canOpenURL(href).then((supported) => {
                        if (supported) Linking.openURL(href);
                      });
                    },
                  },
                }}
                tagsStyles={{
                  p: { marginBottom: 12, lineHeight: 20 },
                  h1: { fontSize: 22, marginBottom: 8 },
                  h2: { fontSize: 18, marginBottom: 8 },
                }}
              />
            </View>
          </ScrollView>

          {/* Botões */}
          {!isLoading ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: themeColors?.success || "#43a047",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold", fontFamily: Fonts.bold }}
                >
                  Sim, concordo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: themeColors?.danger || "#e53935",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={onCancel || close}
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold", fontFamily: Fonts.bold }}
                >
                  Não concordo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <ActivityIndicator
                color={themeColors?.primary || "#000"}
                size="large"
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
