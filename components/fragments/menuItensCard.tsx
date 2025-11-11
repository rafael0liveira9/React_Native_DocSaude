import { Colors } from "@/constants/Colors";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function MenuItensCard({ menu, onCustomAction }: any) {
  const themeColors = Colors["dark"];
  const router = useRouter();

  const handlePress = (item: any) => {
    if (item.action && onCustomAction) {
      onCustomAction(item.action);
    } else if (item.url) {
      router.push(item.url);
    }
  };

  return (
    <View style={[globalStyles.flexr, globalStyles.wfull, styles.menuCardMain]}>
      {menu.map((e: any, y: number) => {
        const isHighlighted = y < 2;

        return (
          <TouchableOpacity
            style={[
              styles.menuCardItem,
              isHighlighted && styles.menuCardItemHighlight,
              {
                borderColor: isHighlighted
                  ? themeColors.blue
                  : themeColors.tint,
                backgroundColor: themeColors.backgroundSecondary,
              },
            ]}
            key={y}
            onPress={() => handlePress(e)}
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
