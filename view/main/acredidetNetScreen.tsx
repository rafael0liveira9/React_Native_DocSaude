import {
  getFiltrosRedeCredenciada,
  getRedeCredenciada,
} from "@/api/redeCredenciada";
import AcredidetFilters from "@/components/fragments/acredidetFilters";
import AcredidetList from "@/components/fragments/acredidetFlatList";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import ThemeContext from "@/controllers/context";
import { styles } from "@/styles/acredidet";
import { globalStyles } from "@/styles/global";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";

export default function AcreditedNetScreen() {
  const router = useRouter();
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;
  const [selectedUF, setSelectedUF] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [openNowText, setOpenNowText] = useState<string>("");
  const [ufs, setUFs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [estadosData, setEstadosData] = useState<
    { uf: string; cidades: string[] }[]
  >([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar rede credenciada da API
  async function loadRedeCredenciada() {
    setLoading(true);
    try {
      const result = await getRedeCredenciada({
        uf: selectedUF || undefined,
        cidade: selectedCity || undefined,
        servico: selectedSpeciality || undefined,
        aberto: openNowText || undefined,
        page: 1,
        limit: 1000,
      });

      console.log("Parâmetros da busca:", {
        uf: selectedUF,
        cidade: selectedCity,
        servico: selectedSpeciality,
        aberto: openNowText,
        page: 1,
        limit: 1000,
      });

      if (result && result.rede && Array.isArray(result.rede)) {
        // Mapear dados da API para o formato esperado
        const mappedEstablishments = result.rede.map((item: any) => ({
          id: item.id,
          name: item.nome_fantasia,
          speciality: item.servico || item.parceiro || "Geral",
          uf: item.uf || item.cidade_uf?.split("-")[1]?.trim() || "",
          city:
            item.cidade?.split("-")[0]?.trim() ||
            item.cidade_uf?.split("-")[0]?.trim() ||
            "",
          address: item.endereco || "",
          number: "",
          zipCode: "",
          complement: "",
          telefone: item.telefone,
          site: item.site,
          horario_semana: item.horario_func_semana,
          horario_sabado: item.horario_func_sabado,
          email: item.email_1,
        }));

        console.log(
          "[REDE] Estabelecimentos mapeados:",
          mappedEstablishments.length
        );
        setFilteredEstablishments(mappedEstablishments);
      } else {
        console.log("Usando dados mock como fallback");
      }
    } catch (error) {
      console.error("Erro ao carregar rede credenciada:", error);
    }
    setLoading(false);
  }

  // Carregar filtros da API (serviços, estados e cidades)
  async function loadFiltros() {
    try {
      console.log("[FILTROS] Carregando filtros da API...");
      const filtros = await getFiltrosRedeCredenciada();

      if (filtros) {
        // Carregar serviços
        setSpecialities(filtros.servicos);
        console.log("[FILTROS] Serviços carregados:", filtros.servicos.length);

        // Carregar estados
        const ufsArray = filtros.estados.map((e) => e.uf);
        setUFs(ufsArray);
        setEstadosData(filtros.estados);
        console.log("[FILTROS] Estados carregados:", ufsArray.length);

        // Inicialmente mostra todas as cidades de todos os estados
        const todasCidades: string[] = [];
        filtros.estados.forEach((estado) => {
          estado.cidades.forEach((cidade) => {
            // Remove sufixo "-UF" das cidades
            const cidadeLimpa = cidade.split("-")[0].trim();
            if (!todasCidades.includes(cidadeLimpa)) {
              todasCidades.push(cidadeLimpa);
            }
          });
        });
        setCities(todasCidades.sort());
        console.log("[FILTROS] Total de cidades:", todasCidades.length);
      }
    } catch (error) {
      console.error("Erro ao carregar filtros:", error);
    }
  }

  // Filtrar cidades por UF selecionada
  function filterCitiesByUF(uf: string) {
    console.log("[FILTROS] Filtrando cidades por UF:", uf);

    if (!uf) {
      // Se não tem UF selecionada, mostra todas as cidades
      const todasCidades: string[] = [];
      estadosData.forEach((estado) => {
        estado.cidades.forEach((cidade) => {
          const cidadeLimpa = cidade.split("-")[0].trim();
          if (!todasCidades.includes(cidadeLimpa)) {
            todasCidades.push(cidadeLimpa);
          }
        });
      });
      setCities(todasCidades.sort());
      console.log("[FILTROS] Mostrando todas as cidades:", todasCidades.length);
    } else {
      // Filtra apenas cidades da UF selecionada
      const estadoSelecionado = estadosData.find((e) => e.uf === uf);
      if (estadoSelecionado) {
        const cidadesUF = estadoSelecionado.cidades.map((c) =>
          c.split("-")[0].trim()
        );
        setCities(cidadesUF.sort());
        console.log("[FILTROS] Cidades da UF", uf, ":", cidadesUF.length);
      } else {
        setCities([]);
      }
    }
  }

  const handleWhatsApp = () => {
    const phoneNumber = "5541988413030";
    const message = "Olá, quero agendar uma consulta...";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() =>
      alert("Não foi possível abrir o WhatsApp.")
    );
  };

  useEffect(() => {
    loadFiltros();
    loadRedeCredenciada();
  }, []);

  useEffect(() => {
    // Quando UF muda ou dados dos estados são carregados, filtra as cidades
    if (estadosData.length > 0) {
      filterCitiesByUF(selectedUF);
      setSelectedCity("");
    }
  }, [selectedUF, estadosData]);

  useEffect(() => {
    loadRedeCredenciada();
  }, [selectedUF, selectedCity, selectedSpeciality, openNowText]);

  return (
    <SafeAreaView
      style={[
        styles.mainScreen,
        globalStyles.flexc,
        globalStyles.wfull,
        {
          backgroundColor: themeColors.background,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 10,
      }}>
        <TouchableOpacity
          style={{ padding: 4 }}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: Fonts.bold,
          color: themeColors.text,
        }}>
          Rede Credenciada
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={[
          styles.BoxScreen,
          globalStyles.wfull,
          {
            backgroundColor: themeColors.backgroundSecondary,
          },
        ]}
        contentContainerStyle={[
          globalStyles.flexc,
          { justifyContent: "flex-start" },
        ]}
      >
        <AcredidetFilters
          ufs={ufs}
          selectedUF={selectedUF}
          cities={cities}
          setSelectedUF={setSelectedUF}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedSpeciality={selectedSpeciality}
          setSelectedSpeciality={setSelectedSpeciality}
          specialities={specialities}
          themeColors={themeColors}
          openNowText={openNowText}
          setOpenNowText={setOpenNowText}
        />
        <View style={{ width: "83%" }}>
          <Text
            style={{
              marginTop: 30,
              marginBottom: 30,
              fontWeight: 800,
              fontFamily: Fonts.bold,
              fontSize: 26,
            }}
          >
            Resultado da busca
          </Text>
        </View>
        <View style={{ width: "100%" }}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeColors.tint}
              style={{ marginTop: 30 }}
            />
          ) : (
            <>
              {!!filteredEstablishments &&
              Array.isArray(filteredEstablishments) &&
              filteredEstablishments.length > 0 ? (
                <AcredidetList
                  filteredEstablishments={filteredEstablishments}
                  themeColors={themeColors}
                />
              ) : (
                <View style={(globalStyles.flexc, globalStyles.wfull)}>
                  <Text
                    style={{
                      marginTop: 30,
                      marginBottom: 30,
                      fontWeight: 600,
                      fontFamily: Fonts.semiBold,
                      fontSize: 16,
                    }}
                  >
                    Desculpe, nenhum parceiro encontrado.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#25D366",
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 30,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
        onPress={handleWhatsApp}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 16,
            fontWeight: "600",
            fontFamily: Fonts.semiBold,
            marginRight: 8,
          }}
        >
          Agendar Consulta
        </Text>
        <FontAwesome name="whatsapp" size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
