import { Colors } from "@/constants/Colors";
import { styles } from "@/styles/home";
import { ScrollView, View } from "react-native";
import PersonalCardPreview from "./fragments/PersonalCardPreview";
import MenuItensCard from "./fragments/menuItensCard";
import Hello from "./fragments/hello";

export default function HomeMain({
  openCard,
  cards,
  menuItens,
  onCustomAction,
  user,
}: any) {
  const themeColors = Colors["dark"];

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      {!!user && user?.name && <Hello user={user}></Hello>}
      <View style={[styles.homeMain, { backgroundColor: themeColors.backgroundSecondary }]}>
        <PersonalCardPreview
          cards={cards}
          openCard={openCard}
        ></PersonalCardPreview>
        <View style={{ marginTop: 20 }}>
          <MenuItensCard
            menu={menuItens}
            onCustomAction={onCustomAction}
          ></MenuItensCard>
        </View>
      </View>
    </ScrollView>
  );
}
