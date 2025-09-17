import { Colors } from "@/constants/Colors";
import { ActivityIndicator, Image, View } from "react-native";

export default function SplashScreen() {
  const themeColors = Colors["dark"];

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: themeColors.background,
        paddingBottom: 100,
      }}
    >
      <Image
        style={{
          width: 200,
          height: 200,
          objectFit: "contain",
        }}
        source={require(`@/assets/docsaude/LOGO-TOTALDOC-todo-branco-fundo-transparente.png`)}
      />
      <ActivityIndicator size={40} color="#ffffff" />
    </View>
  );
}
