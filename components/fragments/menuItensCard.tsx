import { Colors } from "@/constants/Colors";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function MenuItensCard({ menu }: any) {
  const themeColors = Colors["dark"];
  const router = useRouter();

  return (
    <View style={[globalStyles.flexr, globalStyles.wfull, styles.menuCardMain]}>
      {menu.map((e: any, y: number) => {
        return (
          <TouchableOpacity
            style={[
              styles.menuCardItem,
              {
                borderColor: themeColors.tint,
                backgroundColor: themeColors.backgroundSecondary,
              },
            ]}
            key={y}
            onPress={() => router.push(e.url)}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 8,
                width: 34,
                height: 34,
              }}
            >
              <Image
                source={e.icon}
                style={{ width: 34, height: 34, resizeMode: "contain" }}
              />
            </View>
            <Text style={styles.menuCardItemText}>{e.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
