import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";

interface TermsOfUseModalProps extends ViewProps {
  visible?: boolean;
  themeColors?: any;
  text?: string;
  termsLink?: string;
  isLoading?: boolean;
  onConfirm?: (e: GestureResponderEvent) => void;
  onCancel?: () => void;
  close: () => void;
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
}: TermsOfUseModalProps) {
  return (
    <Modal
      visible={visible}
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
          paddingHorizontal: "2.5%",
        }}
      >
        {/* Conteúdo do modal */}
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
          {/* Título */}
          <Text
            style={{
              color: themeColors?.black || "#333",
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {text}
          </Text>

          {/* Conteúdo dos termos com scroll */}
          <ScrollView
            style={{
              flex: 1,
              marginBottom: 16,
            }}
            showsVerticalScrollIndicator={true}
          >
            <Text
              style={{
                color: themeColors?.black || "#333",
                fontSize: 14,
                lineHeight: 22,
                textAlign: "justify",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                1. Aceitação dos Termos{"\n\n"}
              </Text>
              Ao utilizar nossos serviços, você concorda com estes Termos de
              Uso. Se você não concordar com qualquer parte destes termos, não
              utilize nossos serviços.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                2. Uso dos Serviços{"\n\n"}
              </Text>
              Nossos serviços são fornecidos para auxiliar no acesso a
              informações de saúde e agendamento de consultas. Você concorda em
              utilizar os serviços apenas para fins legítimos e de acordo com
              todas as leis aplicáveis.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                3. Privacidade e Proteção de Dados{"\n\n"}
              </Text>
              Respeitamos sua privacidade e protegemos seus dados pessoais de
              acordo com a Lei Geral de Proteção de Dados (LGPD). Suas
              informações serão utilizadas apenas para os fins relacionados aos
              nossos serviços de saúde.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                4. Responsabilidades do Usuário{"\n\n"}
              </Text>
              Você é responsável por:
              {"\n"}- Manter a confidencialidade de suas credenciais de acesso
              {"\n"}- Fornecer informações precisas e atualizadas
              {"\n"}- Notificar-nos imediatamente sobre qualquer uso não
              autorizado de sua conta
              {"\n"}- Utilizar os serviços de forma ética e responsável{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                5. Informações de Saúde{"\n\n"}
              </Text>
              As informações fornecidas através de nossos serviços têm caráter
              informativo e não substituem consultas médicas presenciais. Sempre
              consulte um profissional de saúde qualificado para diagnósticos e
              tratamentos.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                6. Disponibilidade dos Serviços{"\n\n"}
              </Text>
              Embora nos esforcemos para manter nossos serviços disponíveis
              continuamente, não garantimos que estarão livres de interrupções,
              atrasos ou erros. Reservamo-nos o direito de modificar ou
              descontinuar serviços a qualquer momento.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                7. Propriedade Intelectual{"\n\n"}
              </Text>
              Todo o conteúdo, incluindo textos, gráficos, logotipos e software,
              é de propriedade exclusiva da empresa ou de seus licenciadores e
              está protegido por leis de propriedade intelectual.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                8. Limitação de Responsabilidade{"\n\n"}
              </Text>
              Não nos responsabilizamos por danos indiretos, incidentais,
              especiais ou consequenciais resultantes do uso ou da
              impossibilidade de uso de nossos serviços.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>
                9. Modificações dos Termos{"\n\n"}
              </Text>
              Reservamo-nos o direito de modificar estes termos a qualquer
              momento. As alterações entrarão em vigor imediatamente após a
              publicação. O uso continuado dos serviços após as modificações
              constitui aceitação dos novos termos.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>10. Contato{"\n\n"}</Text>
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco
              através dos canais de atendimento disponibilizados no aplicativo.
              {"\n\n"}
              <Text
                style={{
                  fontWeight: "bold",
                  fontStyle: "italic",
                  paddingBottom: 30,
                }}
              >
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </Text>
            </Text>
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
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
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
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
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
