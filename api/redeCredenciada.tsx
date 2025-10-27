import api from './config';

export interface RedeCredenciadaItem {
  id: number;
  parceiro: string;
  nome_fantasia: string;
  situacao: string;
  endereco: string;
  bairro: string;
  cidade_uf: string;
  telefone: string;
  site: string;
  horario_func_semana: string;
  horario_func_sabado: string;
  email_1: string;
  responsavel_faturamento: string;
  email_2: string;
  banco: string;
  dados_bancarios: string;
  forma_pagamento: string;
  periodicidade_repasse: string;
}

/**
 * Buscar rede credenciada com filtros
 */
export async function getRedeCredenciada(
  search?: string,
  cidade?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ rede: RedeCredenciadaItem[]; total: number } | null> {
  try {
    const params: any = { page, limit };

    if (search) {
      params.search = search;
    }

    if (cidade) {
      params.cidade = cidade;
    }

    const response = await api.get('/rede-credenciada', { params });

    if (response.data.success) {
      return {
        rede: response.data.data.rede,
        total: response.data.data.pagination.total,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Erro ao buscar rede credenciada:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Buscar todas as cidades da rede credenciada (para filtros)
 */
export async function getCidadesRedeCredenciada(): Promise<string[]> {
  try {
    const response = await api.get('/rede-credenciada', { params: { limit: 1000 } });

    if (response.data.success) {
      const cidades = new Set<string>();
      response.data.data.rede.forEach((item: RedeCredenciadaItem) => {
        if (item.cidade_uf) {
          cidades.add(item.cidade_uf);
        }
      });
      return Array.from(cidades).sort();
    }
    return [];
  } catch (error: any) {
    console.error('Erro ao buscar cidades:', error.response?.data || error.message);
    return [];
  }
}
