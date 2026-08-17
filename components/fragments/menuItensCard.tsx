import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
        const IconComponent = e.icon;

        return (
          <TouchableOpacity
            style={[
              styles.menuCardItem,
              {
                backgroundColor: themeColors.cardSurface,
                borderWidth: 1,
                borderColor: themeColors.cardBorder,
              },
            ]}
            key={y}
            activeOpacity={0.7}
            onPress={() => handlePress(e)}
          >
            {e.badge ? (
              <View
                style={[
                  badgeStyles.badge,
                  { backgroundColor: themeColors.danger },
                ]}
              >
                <Text style={badgeStyles.badgeText}>{e.badge}</Text>
              </View>
            ) : null}
            <IconComponent width={32} height={32} color={themeColors.text} />
            <Text
              style={[
                styles.menuCardItemText,
                { color: themeColors.text },
              ]}
              // 3 linhas: "Saúde Online - Telemedicina" não cabia em 2 e era
              // truncado em "Online - Tele...". Os títulos curtos continuam
              // ocupando 2 e centralizados.
              // adjustsFontSizeToFit só tem efeito no iOS; serve de folga para
              // quem usa fonte ampliada nas configurações do sistema.
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {e.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
});
