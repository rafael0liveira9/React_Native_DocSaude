import { Fonts } from "@/constants/Fonts";
import { Picker } from "@react-native-picker/picker";
import { Platform, Text, TextInput, View } from "react-native";

export default function AcredidetFilters({
  ufs,
  selectedUF,
  cities,
  setSelectedUF,
  selectedCity,
  setSelectedCity,
  selectedSpeciality,
  setSelectedSpeciality,
  specialities,
  themeColors,
  openNowText,
  setOpenNowText,
}: any) {
  const pickerStyle =
    Platform.OS === "ios"
      ? { height: 60, color: "#000" }
      : { height: 60, color: "#000" };

  return (
    <View style={{ width: "85%", marginVertical: 20 }}>
      <View
        style={{
          marginBottom: 10,
          borderColor: themeColors.black,
          borderWidth: 2,
          borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: themeColors.white || "#FFF",
          height: 60,
          justifyContent: "center",
        }}
      >
        <Picker
          selectedValue={selectedUF}
          onValueChange={(value) => {
            setSelectedCity("");
            setSelectedUF(value);
          }}
          style={pickerStyle}
          itemStyle={{ height: 60, fontSize: 16, color: "#000" }}
          dropdownIconColor={"#000"}
        >
          <Picker.Item label="UF" value="" />
          {ufs.map((uf: any) => (
            <Picker.Item key={uf} label={uf} value={uf} />
          ))}
        </Picker>
      </View>
      <View
        style={{
          marginBottom: 10,
          borderColor: themeColors.black,
          borderWidth: 2,
          borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: themeColors.white || "#FFF",
          height: 60,
          justifyContent: "center",
        }}
      >
        <Picker
          selectedValue={selectedCity}
          onValueChange={(value) => setSelectedCity(value)}
          enabled={cities.length > 0}
          style={pickerStyle}
          itemStyle={{ height: 60, fontSize: 16 }}
          dropdownIconColor={"#000"}
        >
          <Picker.Item label="Cidade" value="" />
          {cities.map((city: any) => (
            <Picker.Item key={city} label={city} value={city} />
          ))}
        </Picker>
      </View>
      <View
        style={{
          marginBottom: 10,
          borderColor: themeColors.black,
          borderWidth: 2,
          borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: themeColors.white || "#FFF",
          height: 60,
          justifyContent: "center",
        }}
      >
        <Picker
          selectedValue={selectedSpeciality}
          onValueChange={(value) => setSelectedSpeciality(value)}
          style={pickerStyle}
          itemStyle={{ height: 60, fontSize: 16 }}
          dropdownIconColor={"#000"}
        >
          <Picker.Item label="Serviço de Saúde" value="" />
          {specialities.map((s: any) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>

      {/* Filtro "Aberto" - Campo de texto livre */}
      {setOpenNowText && (
        <View
          style={{
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              fontFamily: Fonts.semiBold,
              color: themeColors.text || "#000",
              marginBottom: 6,
            }}
          >
            Filtrar por horário
          </Text>
          <TextInput
            placeholder="Ex: Segunda a Sexta, 08h às 18h"
            placeholderTextColor="#999"
            value={openNowText}
            onChangeText={setOpenNowText}
            style={{
              borderColor: themeColors.black,
              borderWidth: 2,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: themeColors.white || "#FFF",
              color: themeColors.black || "#000",
              fontSize: 16,
              fontFamily: Fonts.regular,
              height: 60,
            }}
          />
        </View>
      )}
    </View>
  );
}
