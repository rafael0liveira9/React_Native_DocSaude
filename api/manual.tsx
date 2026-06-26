import api from "./config";

const FALLBACK_MANUAL_URL =
  "https://totaldocspublicafiles.s3.us-east-1.amazonaws.com/manualassinante.pdf";

// Busca a URL do manual do assinante cadastrada no administrativo.
// Em caso de falha, retorna a URL pública padrão para não quebrar o app.
export async function getManualUrl(): Promise<string> {
  try {
    const response = await api.get("/manual");
    return response.data?.data?.manual_url || FALLBACK_MANUAL_URL;
  } catch (error: any) {
    console.warn(
      "[MANUAL] Falha ao buscar URL, usando fallback:",
      error?.response?.data || error?.message
    );
    return FALLBACK_MANUAL_URL;
  }
}
