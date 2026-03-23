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
    <View style={{ width: "90%", marginTop: 10, marginBottom: 6 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <CustomSelect
            label="UF"
            value={selectedUF}
            options={ufs}
            onValueChange={(value) => {
              setSelectedCity("");
              setSelectedUF(value);
            }}
            themeColors={themeColors}
            compact
          />
        </View>
        <View style={{ flex: 2 }}>
          <CustomSelect
            label="Cidade"
            value={selectedCity}
            options={cities}
            onValueChange={setSelectedCity}
            themeColors={themeColors}
            enabled={cities.length > 0}
            compact
          />
        </View>
      </View>
      <CustomSelect
        label="Serviço de Saúde"
        value={selectedSpeciality}
        options={specialities}
        onValueChange={setSelectedSpeciality}
        themeColors={themeColors}
        compact
      />

      {setOpenNowText && (
        <TextInput
          placeholder="Buscar..."
          placeholderTextColor="#999"
          value={openNowText}
          onChangeText={setOpenNowText}
          style={{
            borderColor: "#DDD",
            borderWidth: 1.5,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: themeColors.white || "#FFF",
            color: themeColors.black || "#000",
            fontSize: 14,
            fontFamily: Fonts.regular,
            height: 42,
            marginTop: 6,
          }}
        />
      )}
    </View>
  );
}
