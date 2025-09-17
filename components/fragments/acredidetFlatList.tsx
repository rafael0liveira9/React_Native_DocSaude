import { globalStyles } from "@/styles/global";
import { FlatList, Image, Text, View } from "react-native";

export default function AcredidetList({
  filteredEstablishments,
  themeColors,
}: any) {
  return (
    <FlatList
      scrollEnabled={false}
      data={filteredEstablishments}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View
          style={[
            globalStyles.flexr,
            globalStyles.wfull,
            {
              paddingVertical: 15,
              paddingHorizontal: "8%",
              borderBottomWidth: 2,
              backgroundColor: themeColors.grey,
              alignItems: "center",
            },
          ]}
        >
          <Image
            source={require("../../assets/docsaude/LOGO-TOTALDOC-fundo-azul-marinho.png")}
            style={{
              width: 60,
              height: 60,
              resizeMode: "contain",
              marginRight: 12,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "bold",
                color: themeColors.black,
                fontSize: 18,
              }}
            >
              {item.name}
            </Text>
            <Text style={{ color: themeColors.black }}>{item.speciality}</Text>
            <Text style={{ color: themeColors.black }}>
              {item.address}, {item.number} {item.complement}
            </Text>
          </View>
        </View>
      )}
    />
  );
}
