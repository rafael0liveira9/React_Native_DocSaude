import { GetMyData } from "@/api/auth";
import { registerForPushNotificationsAsync } from "@/api/firebase";
import { registerDeviceToken } from "@/api/notifications";
import { LogoutModal } from "@/components/fragments/modalLogout";
import Header from "@/components/header";
import HomeMain from "@/components/homeMain";
import PersonalCardModal from "@/components/modal";
import { Colors } from "@/constants/Colors";
import ThemeContext from "@/controllers/context";
import { menuItens } from "@/controllers/utils";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
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

  async function forceLogout() {
    console.log("[HOME] Forçando logout - dados do usuário inválidos");
    await SecureStore.deleteItemAsync("user-token");
    await SecureStore.deleteItemAsync("user-id");
    await SecureStore.deleteItemAsync("expo-push-token");
    router.replace("/(auth)");
  }

  async function getUserData() {
    try {
      setIsLoadingUser(true);
      const userId = await SecureStore.getItemAsync("user-id");
      const token = await SecureStore.getItemAsync("user-token");

      if (!userId || !token) {
        console.log("[HOME] Token ou userId ausente, deslogando");
        await forceLogout();
        return;
      }

      const data = await GetMyData(Number(userId), token);
      if (data) {
        setUser(data);
        buildCardsArray(data);

        // Registrar/atualizar token de push no backend
        try {
          const pushToken = await registerForPushNotificationsAsync();
          const tokenResult = pushToken && pushToken !== "expo-go-mock-token"
            ? await registerDeviceToken(pushToken, Number(userId))
            : false;
          // DEBUG: remover depois de confirmar que funciona
          Alert.alert("DEBUG Push Token", `Token: ${pushToken || "NULL"}\nRegistrado: ${tokenResult}\nUserId: ${userId}`);
        } catch (e: any) {
          Alert.alert("DEBUG Push Error", e?.message || String(e));
        }
      } else {
        console.log("Não foi possível carregar os dados do usuário");
        await forceLogout();
        return;
      }
    } catch (error) {
      console.log("Erro ao buscar dados do usuário:", error);
      await forceLogout();
      return;
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
    const whatsNumber = "5508000024002";
    const userName = user?.name || "Cliente";
    const companyOrPlan = user?.companyName || user?.typeName || "assinante";
    const message = `Olá sou ${userName} assinante TotalDoc ${companyOrPlan}`;
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
          user={user}
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
