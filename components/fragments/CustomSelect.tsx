import { Fonts } from "@/constants/Fonts";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  themeColors: any;
  enabled?: boolean;
}

export default function CustomSelect({
  label,
  value,
  options,
  onValueChange,
  themeColors,
  enabled = true,
}: CustomSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const displayText = value || label;
  const isPlaceholder = !value;

  return (
    <View
      style={{
        marginBottom: 10,
        borderColor: themeColors.black,
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: enabled
          ? themeColors.white || "#FFF"
          : "#F5F5F5",
        height: 60,
        justifyContent: "center",
        opacity: enabled ? 1 : 0.6,
      }}
    >
      <TouchableOpacity
        onPress={() => enabled && setModalVisible(true)}
        disabled={!enabled}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: Fonts.regular,
            color: isPlaceholder ? "#999" : "#000",
          }}
        >
          {displayText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={themeColors.black || "#000"}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#FFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "60%",
              paddingBottom: Platform.OS === "ios" ? 34 : 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#E0E0E0",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: Fonts.bold,
                  color: "#000",
                }}
              >
                {label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView>
              {/* Opção vazia (reset) */}
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F0F0F0",
                  backgroundColor: !value ? "#F0F8FF" : "transparent",
                }}
                onPress={() => handleSelect("")}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: !value ? Fonts.semiBold : Fonts.regular,
                    color: !value ? "#007AFF" : "#666",
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>

              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                    backgroundColor:
                      value === option ? "#F0F8FF" : "transparent",
                  }}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily:
                        value === option ? Fonts.semiBold : Fonts.regular,
                      color: value === option ? "#007AFF" : "#000",
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
