export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const cellPhoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
export const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;
export const menuItens = [
  {
    title: "Pronto Atendimento",
    icon: require("../assets/docsaude/icons/scope-icon.png"),
    url: "/(stack)/telemedicina",
  },
  {
    title: "Farmácias",
    icon: require("../assets/docsaude/icons/farmac-icon.png"),
    url: "/(stack)/example",
  },
  {
    title: "Rede Credênciada",
    icon: require("../assets/docsaude/icons/mark-icon.png"),
    url: "/(stack)/accredited",
  },
  {
    title: "Atendimento TotalDoc",
    icon: require("../assets/docsaude/icons/suport-icon.png"),
    action: "callWhatsapp",
  },
  {
    title: "Suporte Técnico 24h",
    icon: require("../assets/docsaude/icons/engine-icon.png"),
    action: "callSupport",
  },
  {
    title: "Manual do Assinante",
    icon: require("../assets/docsaude/icons/info-icon.png"),
    action: "openManual",
  },
];

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateAge(dateString: string): string {
  const birthDate = new Date(dateString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return `${age} anos`;
}

export function cpfFormat(value: string) {
  if (value) {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);

    const part1 = cleaned.slice(0, 3);
    const part2 = cleaned.slice(3, 6);
    const part3 = cleaned.slice(6, 9);
    const part4 = cleaned.slice(9, 11);

    if (cleaned.length <= 3) return part1;
    if (cleaned.length <= 6) return `${part1}.${part2}`;
    if (cleaned.length <= 9) return `${part1}.${part2}.${part3}`;
    return `${part1}.${part2}.${part3}-${part4}`;
  } else {
    return "";
  }
}

export function phoneFormat(value: string) {
  if (value) {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    const ddd = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, cleaned.length <= 10 ? 6 : 7);
    const part2 = cleaned.slice(cleaned.length <= 10 ? 6 : 7);

    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return `(${ddd}`;
    if (cleaned.length <= (cleaned.length <= 10 ? 6 : 7))
      return `(${ddd}) ${part1}`;
    return `(${ddd}) ${part1}-${part2}`;
  } else {
    return "";
  }
}

export async function getAllUFs() {
  try {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
    );
    const data = await response.json();
    // retorna array de siglas, ex: ["AC","AL","AP",...]
    return data.map((uf: any) => uf.sigla).sort();
  } catch (error) {
    console.error("Erro ao buscar UFs:", error);
    return [];
  }
}

export async function getCitiesByUF(uf: string) {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );
    const data = await response.json();
    // retorna array de nomes das cidades
    return data.map((city: any) => city.nome);
  } catch (error) {
    console.error(`Erro ao buscar cidades da UF ${uf}:`, error);
    return [];
  }
}
