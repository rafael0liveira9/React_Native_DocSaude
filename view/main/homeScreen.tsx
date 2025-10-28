import Hello from "@/components/fragments/hello";
import Header from "@/components/header";
import HomeMain from "@/components/homeMain";
import PersonalCardModal from "@/components/modal";
import { LogoutModal } from "@/components/fragments/modalLogout";
import { Colors } from "@/constants/Colors";
import ThemeContext from "@/controllers/context";
import { menuItens } from "@/controllers/utils";
import { useContext, useState } from "react";
import { View, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

export default function HomeScreen() {
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;
  const { user } = ctx;
  const [modalPersonalCardVisible, setModalPersonalCardVisible] =
    useState<boolean>(false);
  const [cardSelected, setCardSelected] = useState<number | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
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

  function handleCustomAction(action: string) {
    if (action === "callSupport") {
      setIsSupportModalOpen(true);
    } else if (action === "openManual") {
      handleOpenManual();
    }
  }

  function handleCallSupport() {
    const phoneNumber = "080008889633";
    Linking.openURL(`tel:${phoneNumber}`);
    setIsSupportModalOpen(false);
  }

  async function handleOpenManual() {
    try {
      await WebBrowser.openBrowserAsync(
        "https://totaldocspublicafiles.s3.us-east-1.amazonaws.com/manualassinante.pdf"
      );
    } catch (error) {
      console.error("Erro ao abrir manual:", error);
    }
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

      <Header notify={notify}></Header>
      {!!user && user?.name && <Hello user={user}></Hello>}
      <HomeMain
        openCard={handleOpenModal}
        cards={cards}
        menuItens={menuItens}
        onCustomAction={handleCustomAction}
      ></HomeMain>

      <PersonalCardModal
        visible={modalPersonalCardVisible}
        user={cardSelected}
        themeColors={themeColors}
        onClose={handleCloseModal}
      />

      <LogoutModal
        warningVisible={isSupportModalOpen}
        themeColors={themeColors}
        text="Ligar para o Suporte?"
        onConfirm={handleCallSupport}
        close={() => setIsSupportModalOpen(false)}
        isLoading={false}
      />
    </View>
  );
}
