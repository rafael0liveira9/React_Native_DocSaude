import { Colors } from "@/constants/Colors";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/header";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function Header({ notify }: any) {
  const themeColors = Colors["dark"];

  return (
    <View
      style={[
        globalStyles.flexr,
        globalStyles.wfull,
        {
          justifyContent: "space-between",
          paddingHorizontal: "7%",
          paddingVertical: 20,
        },
      ]}
    >
      <Image
        style={{
          height: 70,
          width: 120,
          objectFit: "contain",
        }}
        source={require(`@/assets/docsaude/LOGO-TOTALDOC-todo-branco-fundo-transparente.png`)}
      />
      <View
        style={[globalStyles.flexr, { gap: 30, justifyContent: "flex-end" }]}
      >
        <TouchableOpacity style={styles.notifyIconBox}>
          <View
            style={[
              globalStyles.flexr,
              styles.notifyFloat,
              { backgroundColor: themeColors.danger },
            ]}
          >
            <Text style={{ fontSize: 12, color: themeColors.white }}>
              {notify.length}
            </Text>
          </View>
          <FontAwesome5
            name="bell"
            size={30}
            color={themeColors.backgroundSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome5
            name="user"
            size={30}
            color={themeColors.backgroundSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
