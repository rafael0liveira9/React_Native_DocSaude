import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { styles } from "@/styles/home";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
      showsVerticalScrollIndicator={false}
    >
      {!!user && user?.name && <Hello user={user}></Hello>}
      <View style={localStyles.cardWrapper}>
        <PersonalCardPreview
          cards={cards}
          openCard={openCard}
        ></PersonalCardPreview>
      </View>
      <View
        style={[
          styles.homeMain,
          localStyles.sheet,
          { backgroundColor: themeColors.backgroundSecondary },
        ]}
      >
        <Text
          style={[localStyles.gridTitle, { color: themeColors.background }]}
        >
          O que você precisa hoje?
        </Text>
        <MenuItensCard
          menu={menuItens}
          onCustomAction={onCustomAction}
        ></MenuItensCard>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  sheet: {
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.bold,
    marginBottom: 14,
    marginLeft: 4,
  },
});
