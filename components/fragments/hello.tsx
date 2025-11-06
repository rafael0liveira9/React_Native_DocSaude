import { Colors } from "@/constants/Colors";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import { Text, View } from "react-native";

export default function Hello({ user }: any) {
  const themeColors = Colors["dark"];

  return (
    <View
      style={[
        globalStyles.flexr,
        globalStyles.wfull,
        {
          justifyContent: "flex-start",
          paddingHorizontal: "7%",
          paddingTop: 20,
          paddingBottom: 10,
        },
      ]}
    >
      <Text
        style={[styles.helloTitle, { color: themeColors.backgroundSecondary }]}
      >
        Olá, {user?.name}!
      </Text>
    </View>
  );
}
