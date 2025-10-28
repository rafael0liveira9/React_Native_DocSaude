import { Picker } from "@react-native-picker/picker";
import { Platform, View } from "react-native";

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
          onValueChange={(value) => setSelectedUF(value)}
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
    </View>
  );
}
