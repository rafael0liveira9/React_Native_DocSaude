import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import ThemeContext from "@/controllers/context";
import { styles } from "@/styles/acredidet";
import { globalStyles } from "@/styles/global";
import { useContext } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ExampleScreen() {
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;

  return (
    <View
      style={[
        styles.mainScreen,
        globalStyles.flexc,
        globalStyles.wfull,
        {
          backgroundColor: themeColors.background,
        },
      ]}
    >
      <ScrollView
        style={[
          styles.BoxScreen,
          globalStyles.wfull,
          {
            backgroundColor: themeColors.backgroundSecondary,
          },
        ]}
        contentContainerStyle={[
          globalStyles.flexc,
          { justifyContent: "flex-start" },
        ]}
      >
        <Text style={{ fontSize: 40, fontFamily: Fonts.regular, color: "#000000" }}>Pagina</Text>
      </ScrollView>
    </View>
  );
}
