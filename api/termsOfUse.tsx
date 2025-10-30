import api from "./config";

export async function getTermosDeUso() {
  try {
    const response = await api.get("/termo-uso", {
      params: { limit: 1000 },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error(
      "Erro ao buscar Termos de uso:",
      error.response?.data || error.message
    );
    return [];
  }
}
