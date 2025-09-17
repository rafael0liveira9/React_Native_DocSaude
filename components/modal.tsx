import { formatDate } from "@/controllers/utils";
import { globalStyles } from "@/styles/global";
import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PersonalCardModalProps {
  visible: boolean;
  user: any;
  themeColors: any;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export function PersonalCardModal({
  visible,
  user,
  themeColors,
  onClose,
}: PersonalCardModalProps) {
  const formattedNumber = user?.number.match(/.{1,4}/g)?.join(" ") ?? "";

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={[
          stylesInside.overlay,
          { backgroundColor: themeColors.background },
        ]}
      >
        <View style={stylesInside.PersonalCardModalContainer}>
          <View
            style={[
              globalStyles.flexr,
              globalStyles.wfull,
              stylesInside.personalCardPreview,
              {
                backgroundColor: themeColors.grey,
              },
            ]}
          >
            <View
              style={[
                stylesInside.cardFirst,
                globalStyles.flexc,
                { justifyContent: "space-around", alignItems: "flex-start" },
              ]}
            >
              <View
                style={[
                  stylesInside.cardFirstSeparation,
                  globalStyles.flexc,
                  { justifyContent: "space-around", alignItems: "flex-start" },
                ]}
              >
                <Text style={[stylesInside.cardPreviewText, { fontSize: 32 }]}>
                  {user.name}
                </Text>
                <View style={[globalStyles.flexr, { gap: 40 }]}>
                  <View
                    style={[
                      globalStyles.flexc,
                      {
                        justifyContent: "space-around",
                        alignItems: "flex-start",
                        gap: 5,
                      },
                    ]}
                  >
                    <Text>NASCIMENTO</Text>
                    <Text style={stylesInside.cardPreviewText}>
                      {formatDate(user.birthDate)}
                    </Text>
                  </View>
                  <View
                    style={[
                      globalStyles.flexc,
                      {
                        justifyContent: "space-around",
                        alignItems: "flex-start",
                        gap: 5,
                      },
                    ]}
                  >
                    <Text>CPF</Text>
                    <Text style={stylesInside.cardPreviewText}>
                      {user.document}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  stylesInside.cardFirstSeparation,
                  globalStyles.flexc,
                  {
                    justifyContent: "space-around",
                    alignItems: "flex-start",
                    backgroundColor: themeColors.greyMedium,
                  },
                ]}
              >
                <View
                  style={[
                    globalStyles.flexc,
                    {
                      justifyContent: "space-around",
                      alignItems: "flex-start",
                      gap: 5,
                    },
                  ]}
                >
                  <Text>NÚMERO DA CARTEIRINHA</Text>
                  <Text style={stylesInside.cardPreviewText}>
                    {formattedNumber}
                  </Text>
                </View>
                <View style={[globalStyles.flexr, { gap: 40 }]}>
                  <View
                    style={[
                      globalStyles.flexc,
                      {
                        justifyContent: "space-around",
                        alignItems: "flex-start",
                        gap: 5,
                      },
                    ]}
                  >
                    <Text>ATIVAÇÃO</Text>
                    <Text style={stylesInside.cardPreviewText}>
                      {formatDate(user.activationAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      globalStyles.flexc,
                      {
                        justifyContent: "space-around",
                        alignItems: "flex-start",
                        gap: 5,
                      },
                    ]}
                  >
                    <Text>VALIDADE</Text>
                    <Text style={stylesInside.cardPreviewText}>
                      {formatDate(user.validAt)}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  stylesInside.cardFirstSeparation,
                  globalStyles.flexc,
                  { justifyContent: "space-around", alignItems: "flex-start" },
                ]}
              >
                <View
                  style={[
                    globalStyles.flexc,
                    {
                      justifyContent: "space-around",
                      alignItems: "flex-start",
                      gap: 5,
                    },
                  ]}
                >
                  <Text>NOME DA EMPRESA</Text>
                  <Text style={stylesInside.cardPreviewText}>
                    {user.companyName}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                stylesInside.cardSecond,
                globalStyles.flexc,
                { backgroundColor: themeColors.greyLight },
              ]}
            >
              <Pressable
                onPress={onClose}
                style={[
                  stylesInside.previewBtnBox,
                  globalStyles.flexc,
                  globalStyles.wfull,
                  { gap: 10 },
                ]}
              >
                <View
                  style={[
                    stylesInside.previewBtn,
                    globalStyles.flexc,
                    { backgroundColor: themeColors.tint },
                  ]}
                >
                  <AntDesign
                    name="left"
                    size={34}
                    color={themeColors.background}
                  />
                </View>
                <Text
                  style={{
                    color: themeColors.background,
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  Fechar{"\n"} cartão
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const stylesInside = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  PersonalCardModalContainer: {
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "90deg" }],
  },
  personalCardPreview: {
    width: width * 1.4,
    height: width * 0.9,
    borderRadius: 35,
  },
  defaultText: {
    fontSize: 18,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewBtnBox: {
    width: "100%",
  },
  previewBtn: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  cardFirst: {
    width: "80%",
    height: "100%",
    paddingVertical: 40,
  },
  cardFirstSeparation: {
    width: "100%",
    paddingHorizontal: 40,
    gap: 10,
    paddingVertical: 10,
  },
  cardSecond: {
    width: "20%",
    height: "100%",
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
  },
  cardPreviewText: {
    fontSize: 30,
    fontWeight: 600,
  },
});
