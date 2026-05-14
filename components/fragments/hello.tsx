import { Colors } from "@/constants/Colors";
import { toTitleCase } from "@/controllers/utils";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import { Text, View } from "react-native";

export default function Hello({ user }: any) {
  const themeColors = Colors["dark"];
  const rawFirst = user?.name?.trim().split(/\s+/)[0] ?? "";
  const firstName = toTitleCase(rawFirst);

  return (
    <View
      style={[
        globalStyles.flexr,
        globalStyles.wfull,
        {
          justifyContent: "flex-start",
          paddingHorizontal: "7%",
          paddingTop: 10,
          paddingBottom: 16,
        },
      ]}
    >
      <Text
        style={[styles.helloTitle, { color: themeColors.backgroundSecondary }]}
      >
        Olá, {firstName}!
      </Text>
    </View>
  );
}
