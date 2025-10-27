import { Colors } from "@/constants/Colors";
import { styles } from "@/styles/home";
import { ScrollView, View } from "react-native";
import PersonalCardPreview from "./fragments/PersonalCardPreview";
import MenuItensCard from "./fragments/menuItensCard";

export default function HomeMain({ openCard, cards, menuItens }: any) {
  const themeColors = Colors["dark"];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: themeColors.backgroundSecondary,
      }}
      contentContainerStyle={styles.homeMain}
      showsVerticalScrollIndicator={false}
    >
      <PersonalCardPreview
        cards={cards}
        openCard={openCard}
      ></PersonalCardPreview>
      <View style={{ marginTop: 20 }}>
        <MenuItensCard menu={menuItens}></MenuItensCard>
      </View>
    </ScrollView>
  );
}
