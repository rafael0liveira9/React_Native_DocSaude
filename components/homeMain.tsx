import { Colors } from "@/constants/Colors";
import { styles } from "@/styles/home";
import { View } from "react-native";
import PersonalCardPreview from "./fragments/PersonalCardPreview";
import MenuItensCard from "./fragments/menuItensCard";

export default function HomeMain({ openCard, cards, menuItens }: any) {
  const themeColors = Colors["dark"];

  return (
    <View
      style={[
        styles.homeMain,
        {
          flex: 1,
          backgroundColor: themeColors.backgroundSecondary,
        },
      ]}
    >
      <PersonalCardPreview
        cards={cards}
        openCard={openCard}
      ></PersonalCardPreview>
      <MenuItensCard menu={menuItens}></MenuItensCard>
    </View>
  );
}
