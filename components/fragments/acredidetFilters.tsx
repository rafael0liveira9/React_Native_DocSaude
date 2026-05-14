import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import CustomSelect from "./CustomSelect";

interface Props {
  ufs: string[];
  selectedUF: string;
  setSelectedUF: (v: string) => void;
  cities: string[];
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  specialities: string[];
  selectedSpeciality: string;
  setSelectedSpeciality: (v: string) => void;
  openNowText: string;
  setOpenNowText: (v: string) => void;
  themeColors: any;
  expanded: boolean;
  onToggleExpanded: () => void;
}

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
  expanded,
  onToggleExpanded,
}: Props) {
  const activeCount =
    (selectedUF ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (selectedSpeciality ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: themeColors.backgroundSecondary },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={themeColors.background}
            style={{ opacity: 0.6 }}
          />
          <TextInput
            placeholder="Digite a sua busca aqui"
            placeholderTextColor="#999"
            value={openNowText}
            onChangeText={setOpenNowText}
            style={[
              styles.searchInput,
              { color: themeColors.background },
            ]}
          />
        </View>
        <Pressable
          onPress={onToggleExpanded}
          style={[
            styles.filterBtn,
            {
              backgroundColor: expanded
                ? themeColors.tint
                : themeColors.backgroundSecondary,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={expanded ? "#FFFFFF" : themeColors.background}
          />
          {activeCount > 0 && !expanded ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: themeColors.danger },
              ]}
            >
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.advanced}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <CustomSelect
                label="UF"
                value={selectedUF}
                options={ufs}
                onValueChange={(value: string) => {
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
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  advanced: {
    marginTop: 10,
  },
});
