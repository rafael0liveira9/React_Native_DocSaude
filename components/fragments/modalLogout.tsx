import { Fonts } from "@/constants/Fonts";
import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";

interface LogoutModalProps extends ViewProps {
  warningVisible?: boolean;
  themeColors?: any;
  text?: string;
  isLoading?: boolean;
  onConfirm?: (e: GestureResponderEvent) => void;
  onCancel?: () => void;
  close: () => void;
}

export function LogoutModal({
  warningVisible,
  themeColors,
  text = "Deseja realmente sair?",
  onConfirm,
  onCancel,
  close,
  isLoading,
}: LogoutModalProps) {
  return (
    <Modal
      visible={warningVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={close}
    >
      {/* Fundo escuro translúcido */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Conteúdo do modal */}
        <View
          style={{
            backgroundColor: themeColors?.white || "#fff",
            borderRadius: 12,
            padding: 20,
            width: "100%",
            maxWidth: 350,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          {/* Texto da mensagem */}
          <Text
            style={{
              color: themeColors?.black || "#333",
              fontSize: 16,
              fontFamily: Fonts.regular,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {text}
          </Text>

          {/* Botões */}
          {!isLoading ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: themeColors?.success || "#43a047",
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginLeft: 8,
                  alignItems: "center",
                }}
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 16, fontFamily: Fonts.semiBold }}>Sim</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: themeColors?.danger || "#e53935",
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginLeft: 8,
                  alignItems: "center",
                }}
                onPress={onCancel || close}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: Fonts.semiBold }}>Não</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: "center" }}>
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
