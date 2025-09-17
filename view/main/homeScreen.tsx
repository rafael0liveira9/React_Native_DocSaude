import Hello from "@/components/fragments/hello";
import Header from "@/components/header";
import HomeMain from "@/components/homeMain";
import { PersonalCardModal } from "@/components/modal";
import { Colors } from "@/constants/Colors";
import ThemeContext from "@/controllers/context";
import { menuItens } from "@/controllers/utils";
import { useContext, useState } from "react";
import { View } from "react-native";

export default function HomeScreen() {
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;
  const { user } = ctx;
  const [modalPersonalCardVisible, setModalPersonalCardVisible] =
    useState<boolean>(false);
  const [cardSelected, setCardSelected] = useState<number | null>(null);
  const notify = [
    { id: 1, text: "teste notify" },
    { id: 2, text: "teste notify" },
  ];
  const cards = [
    {
      activationAt: "2024-08-22T14:21:08.000Z",
      birthDate: "1989-12-18T14:21:08.000Z",
      companyName: "Empresa Teste S/A",
      document: "06473846980",
      email: "testerafael@hotmail.com",
      id: 1,
      name: "Rafael Teste",
      number: "9999999999999991",
      validAt: "2027-02-22T14:21:08.000Z",
    },
    {
      activationAt: "2024-08-22T14:21:08.000Z",
      birthDate: "2012-12-18T14:21:08.000Z",
      companyName: "Empresa Teste S/A",
      document: "06473846980",
      email: "testerafael@hotmail.com",
      id: 2,
      name: "Amanda Teste",
      number: "9999999999999992",
      validAt: "2027-02-22T14:21:08.000Z",
    },
  ];

  function handleOpenModal(item: any) {
    if (!!item) {
      setModalPersonalCardVisible(true);
      setCardSelected(item);
    }
  }

  function handleCloseModal() {
    setModalPersonalCardVisible(false);
    setCardSelected(null);
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: themeColors.background,
      }}
    >
      {cardSelected && (
        <PersonalCardModal
          visible={modalPersonalCardVisible}
          user={cardSelected}
          onClose={handleCloseModal}
          themeColors={themeColors}
        />
      )}
      <Header notify={notify}></Header>
      {user.name && <Hello user={user}></Hello>}
      <HomeMain
        openCard={handleOpenModal}
        cards={cards}
        menuItens={menuItens}
      ></HomeMain>
    </View>
  );
}
