import { Picker } from "@react-native-picker/picker";
import { View } from "react-native";

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
  return (
    <View style={{ width: "85%", marginVertical: 20 }}>
      <View
        style={{
          marginBottom: 10,
          borderColor: themeColors.black,
          borderWidth: 2,
          borderRadius: 12,
          paddingHorizontal: 12,
        }}
      >
        <Picker
          selectedValue={selectedUF}
          onValueChange={(value) => setSelectedUF(value)}
        >
          <Picker.Item style={{ fontSize: 20 }} label="UF" value="" />
          {ufs.map((uf: any) => (
            <Picker.Item
              style={{ fontSize: 20 }}
              key={uf}
              label={uf}
              value={uf}
            />
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
        }}
      >
        <Picker
          selectedValue={selectedCity}
          onValueChange={(value) => setSelectedCity(value)}
          enabled={cities.length > 0}
        >
          <Picker.Item style={{ fontSize: 20 }} label="Cidade" value="" />
          {cities.map((city: any) => (
            <Picker.Item
              style={{ fontSize: 20 }}
              key={city}
              label={city}
              value={city}
            />
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
        }}
      >
        <Picker
          selectedValue={selectedSpeciality}
          onValueChange={(value) => setSelectedSpeciality(value)}
        >
          <Picker.Item
            style={{ fontSize: 20 }}
            label="Especialidade"
            value=""
          />
          {specialities.map((s: any) => (
            <Picker.Item style={{ fontSize: 20 }} key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
