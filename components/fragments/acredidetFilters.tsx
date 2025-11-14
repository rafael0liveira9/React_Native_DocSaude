import { Fonts } from "@/constants/Fonts";
import { Text, TextInput, View } from "react-native";
import CustomSelect from "./CustomSelect";

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
  return (
    <View style={{ width: "85%", marginVertical: 20 }}>
      <CustomSelect
        label="UF"
        value={selectedUF}
        options={ufs}
        onValueChange={(value) => {
          setSelectedCity("");
          setSelectedUF(value);
        }}
        themeColors={themeColors}
      />
      <CustomSelect
        label="Cidade"
        value={selectedCity}
        options={cities}
        onValueChange={setSelectedCity}
        themeColors={themeColors}
        enabled={cities.length > 0}
      />
      <CustomSelect
        label="Serviço de Saúde"
        value={selectedSpeciality}
        options={specialities}
        onValueChange={setSelectedSpeciality}
        themeColors={themeColors}
      />

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
            placeholder="Digite tua busca…"
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
