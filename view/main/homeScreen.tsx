import { GetMyData } from "@/api/auth";
import Hello from "@/components/fragments/hello";
import { LogoutModal } from "@/components/fragments/modalLogout";
import Header from "@/components/header";
import HomeMain from "@/components/homeMain";
import PersonalCardModal from "@/components/modal";
import { Colors } from "@/constants/Colors";
import ThemeContext from "@/controllers/context";
import { menuItens } from "@/controllers/utils";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Linking, View } from "react-native";

export default function HomeScreen() {
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;
  const { user, setUser, cards, setCards } = ctx;
  const [modalPersonalCardVisible, setModalPersonalCardVisible] =
    useState<boolean>(false);
  const [cardSelected, setCardSelected] = useState<number | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  const notify: any[] = [
    // { id: 1, text: "teste notify" },
    // { id: 2, text: "teste notify" },
  ];

  useEffect(() => {
    getUserData();
  }, []);

  async function getUserData() {
    try {
      setIsLoadingUser(true);
      const userId = await SecureStore.getItemAsync("user-id");
      const token = await SecureStore.getItemAsync("user-token");

      if (userId && token) {
        const data = await GetMyData(Number(userId), token);
        if (data) {
          setUser(data);
          buildCardsArray(data);
        } else {
          console.log("Não foi possível carregar os dados do usuário");
        }
      }
    } catch (error) {
      console.log("Erro ao buscar dados do usuário:", error);
    } finally {
      setIsLoadingUser(false);
    }
  }

  function buildCardsArray(userData: any) {
    const cardsArray = [];
    cardsArray.push({
      id: `titular-${userData.id}`,
      originalId: userData.id,
      name: userData.name,
      document: userData.document,
      email: userData.email,
      number: userData.number,
      birthDate: userData.birthDate,
      activationAt: userData.activationAt || new Date().toISOString(),
      validAt: userData.validAt || new Date().toISOString(),
      type: userData.type,
      typeName: userData.typeName,
      companyName: userData.companyName,
      isTitular: true,
    });

    if (userData.dependentes && userData.dependentes.length > 0) {
      userData.dependentes.forEach((dependente: any, index: number) => {
        cardsArray.push({
          id: `dependente-${dependente.id || index}`,
          originalId: dependente.id,
          name: dependente.nome || dependente.name,
          document: dependente.cpf || dependente.document,
          email: dependente.email || userData.email,
          number: dependente.numero_carteirinha || dependente.number,
          birthDate: dependente.data_nascimento || dependente.birthDate,
          activationAt:
            dependente.data_ativacao ||
            dependente.activationAt ||
            new Date().toISOString(),
          validAt:
            dependente.data_validade ||
            dependente.validAt ||
            new Date().toISOString(),
          type: userData.type,
          typeName: userData.typeName,
          companyName: userData.companyName,
          isTitular: false,
        });
      });
    }

    setCards(cardsArray);
  }

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
    switch (action) {
      case "callSupport":
        setIsSupportModalOpen(true);
        break;

      case "openManual":
        handleOpenManual();
        break;
      case "callWhatsapp":
        handleCallWhatsapp();
        break;

      default:
        break;
    }
  }

  function handleCallSupport() {
    const phoneNumber = "080008889633";
    Linking.openURL(`tel:${phoneNumber}`);
    setIsSupportModalOpen(false);
  }

  function handleCallWhatsapp() {
    const whatsNumber = "5541988413030";
    const message = "Preciso de atendimento Total Doc Saude";
    const url = `https://wa.me/${whatsNumber}?text=${encodeURIComponent(
      message
    )}`;

    return Linking.openURL(url);
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

      {isLoadingUser ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <HomeMain
          openCard={handleOpenModal}
          cards={cards}
          menuItens={menuItens}
          onCustomAction={handleCustomAction}
        ></HomeMain>
      )}

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
