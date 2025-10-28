import {
  getCidadesRedeCredenciada,
  getRedeCredenciada,
} from "@/api/redeCredenciada";
import AcredidetFilters from "@/components/fragments/acredidetFilters";
import AcredidetList from "@/components/fragments/acredidetFlatList";
import { Colors } from "@/constants/Colors";
import ThemeContext from "@/controllers/context";
import { getAllUFs, getCitiesByUF } from "@/controllers/utils";
import { styles } from "@/styles/acredidet";
import { globalStyles } from "@/styles/global";
import { FontAwesome } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AcreditedNetScreen() {
  const themeColors = Colors["dark"];
  const ctx = useContext(ThemeContext)!;
  const [selectedUF, setSelectedUF] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [ufs, setUFs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar rede credenciada da API
  async function loadRedeCredenciada() {
    setLoading(true);
    try {
      const search = selectedSpeciality || "";
      const cidade = selectedCity || "";
      const result = await getRedeCredenciada(search, cidade, 1, 100);

      if (result && result.rede && Array.isArray(result.rede)) {
        // Mapear dados da API para o formato esperado
        const mappedEstablishments = result.rede.map((item: any) => ({
          id: item.id,
          name: item.nome_fantasia,
          speciality: item.parceiro || "Geral",
          uf: item.cidade_uf?.split("-")[1]?.trim() || "",
          city: item.cidade_uf?.split("-")[0]?.trim() || "",
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
        setFilteredEstablishments(mappedEstablishments);
      } else {
        // Se a API falhar, usar dados mock como fallback
        console.log("Usando dados mock como fallback");
        setFilteredEstablishments(establishments);
      }
    } catch (error) {
      console.error("Erro ao carregar rede credenciada:", error);
      // Usar dados mock em caso de erro
      setFilteredEstablishments(establishments);
    }
    setLoading(false);
  }

  // Carregar cidades da rede credenciada
  async function loadCidadesRede() {
    try {
      const cidadesRede = await getCidadesRedeCredenciada();
      if (cidadesRede.length > 0) {
        const cidadesFormatadas = cidadesRede
          .map((c) => c.split("-")[0]?.trim())
          .filter(Boolean);
        setCities(cidadesFormatadas);
      }
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    }
  }

  // Dados mock - manter como fallback
  const establishments: any[] = [
    {
      id: 1,
      name: "Clínica Infantil R.O",
      speciality: "Pediatria",
      uf: "PR",
      city: "Curitiba",
      address: "Rua O Brasil para Cristo",
      number: "3473",
      zipCode: "81730070",
      complement: "",
    },
    {
      id: 2,
      name: "Hospital Vida Plena",
      speciality: "Clínica Geral",
      uf: "SP",
      city: "São Paulo",
      address: "Av. Paulista",
      number: "1000",
      zipCode: "01310000",
      complement: "Bloco A",
    },
    {
      id: 3,
      name: "Centro Ortopédico Saúde+",
      speciality: "Ortopedia",
      uf: "RJ",
      city: "Rio de Janeiro",
      address: "Rua das Palmeiras",
      number: "245",
      zipCode: "22041001",
      complement: "",
    },
    {
      id: 4,
      name: "Clínica Sorriso Perfeito",
      speciality: "Odontologia",
      uf: "MG",
      city: "Belo Horizonte",
      address: "Rua Afonso Pena",
      number: "765",
      zipCode: "30130005",
      complement: "Sala 3",
    },
    {
      id: 5,
      name: "Hospital São Lucas",
      speciality: "Cardiologia",
      uf: "RS",
      city: "Porto Alegre",
      address: "Av. Ipiranga",
      number: "3200",
      zipCode: "90610000",
      complement: "",
    },
    {
      id: 6,
      name: "Clínica Olhar Vivo",
      speciality: "Oftalmologia",
      uf: "SC",
      city: "Florianópolis",
      address: "Rua das Gaivotas",
      number: "150",
      zipCode: "88062001",
      complement: "",
    },
    {
      id: 7,
      name: "Centro de Saúde Bem Viver",
      speciality: "Dermatologia",
      uf: "BA",
      city: "Salvador",
      address: "Av. Oceânica",
      number: "932",
      zipCode: "40170010",
      complement: "",
    },
    {
      id: 8,
      name: "Clínica Esperança",
      speciality: "Ginecologia",
      uf: "PE",
      city: "Recife",
      address: "Rua Boa Vista",
      number: "417",
      zipCode: "50060001",
      complement: "2º Andar",
    },
    {
      id: 9,
      name: "Instituto Neurológico do Brasil",
      speciality: "Neurologia",
      uf: "DF",
      city: "Brasília",
      address: "Setor Médico Norte",
      number: "12",
      zipCode: "70710050",
      complement: "",
    },
    {
      id: 10,
      name: "Clínica Renascer",
      speciality: "Psiquiatria",
      uf: "GO",
      city: "Goiânia",
      address: "Av. Anhanguera",
      number: "2100",
      zipCode: "74043011",
      complement: "",
    },
    {
      id: 11,
      name: "Clínica Vida Nova",
      speciality: "Endocrinologia",
      uf: "PR",
      city: "Maringá",
      address: "Rua das Laranjeiras",
      number: "54",
      zipCode: "87015030",
      complement: "",
    },
    {
      id: 12,
      name: "Hospital Santa Clara",
      speciality: "Oncologia",
      uf: "SP",
      city: "Campinas",
      address: "Av. Barão de Itapura",
      number: "830",
      zipCode: "13020000",
      complement: "",
    },
    {
      id: 13,
      name: "Clínica Mãe Coruja",
      speciality: "Obstetrícia",
      uf: "RJ",
      city: "Niterói",
      address: "Rua XV de Novembro",
      number: "142",
      zipCode: "24020015",
      complement: "",
    },
    {
      id: 14,
      name: "Instituto Pulmonar",
      speciality: "Pneumologia",
      uf: "RS",
      city: "Caxias do Sul",
      address: "Av. Júlio de Castilhos",
      number: "509",
      zipCode: "95010000",
      complement: "",
    },
    {
      id: 15,
      name: "Centro de Reabilitação Movimenta",
      speciality: "Fisioterapia",
      uf: "CE",
      city: "Fortaleza",
      address: "Rua das Flores",
      number: "20",
      zipCode: "60060001",
      complement: "",
    },
    {
      id: 16,
      name: "Clínica Popular Bem Estar",
      speciality: "Clínica Geral",
      uf: "MA",
      city: "São Luís",
      address: "Av. Beira Mar",
      number: "78",
      zipCode: "65010000",
      complement: "Loja 1",
    },
    {
      id: 17,
      name: "Hospital do Coração",
      speciality: "Cardiologia",
      uf: "SP",
      city: "Santos",
      address: "Rua Princesa Isabel",
      number: "312",
      zipCode: "11075000",
      complement: "",
    },
    {
      id: 18,
      name: "Clínica da Audição",
      speciality: "Otorrinolaringologia",
      uf: "PA",
      city: "Belém",
      address: "Av. Nazaré",
      number: "123",
      zipCode: "66035000",
      complement: "",
    },
    {
      id: 19,
      name: "Instituto do Rim",
      speciality: "Nefrologia",
      uf: "MT",
      city: "Cuiabá",
      address: "Rua das Acácias",
      number: "92",
      zipCode: "78020000",
      complement: "",
    },
    {
      id: 20,
      name: "Clínica Viva Melhor",
      speciality: "Nutrologia",
      uf: "ES",
      city: "Vitória",
      address: "Av. Nossa Senhora da Penha",
      number: "402",
      zipCode: "29055000",
      complement: "Sala 5",
    },
  ];

  const specialities = [
    "Pediatria",
    "Clínica Geral",
    "Ortopedia",
    "Odontologia",
    "Cardiologia",
    "Oftalmologia",
    "Dermatologia",
    "Ginecologia",
    "Neurologia",
    "Psiquiatria",
    "Endocrinologia",
    "Oncologia",
    "Obstetrícia",
    "Pneumologia",
    "Fisioterapia",
    "Otorrinolaringologia",
    "Nefrologia",
    "Nutrologia",
  ];

  async function SetAllUfs() {
    const x = await getAllUFs();
    if (x && Array.isArray(x) && x.length > 0) {
      setUFs(x);
    }
  }

  async function SetAllCities(uf: string) {
    const x = await getCitiesByUF(uf);
    if (x && Array.isArray(x) && x.length > 0) {
      setCities(x);
    } else {
      setCities([]);
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
    SetAllUfs();
    loadRedeCredenciada();
    loadCidadesRede();
  }, []);

  useEffect(() => {
    if (selectedUF) {
      SetAllCities(selectedUF);
    }
  }, [selectedUF]);

  useEffect(() => {
    loadRedeCredenciada();
  }, [selectedCity, selectedSpeciality]);

  return (
    <View
      style={[
        styles.mainScreen,
        globalStyles.flexc,
        globalStyles.wfull,
        {
          backgroundColor: themeColors.background,
        },
      ]}
    >
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
        />
        <View style={{ width: "83%" }}>
          <Text
            style={{
              marginTop: 30,
              marginBottom: 30,
              fontWeight: 800,
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
            marginRight: 8,
          }}
        >
          Agendar Consulta
        </Text>
        <FontAwesome name="whatsapp" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
