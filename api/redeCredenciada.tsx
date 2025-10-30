import api from './config';

export interface RedeCredenciadaItem {
  id: number;
  parceiro: string;
  nome_fantasia: string;
  situacao: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cidade_uf?: string; // Campo legado, manter para compatibilidade
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
  servico?: string;
}

export interface RedeCredenciadaFilters {
  uf?: string;
  cidade?: string;
  servico?: string;
  aberto?: string; // Campo livre de texto
  search?: string;
  page?: number;
  limit?: number;
}

export interface FiltrosRedeCredenciada {
  servicos: string[];
  estados: {
    uf: string;
    cidades: string[];
  }[];
}

/**
 * Buscar rede credenciada com filtros
 */
export async function getRedeCredenciada(
  filters: RedeCredenciadaFilters = {}
): Promise<{ rede: RedeCredenciadaItem[]; total: number } | null> {
  try {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 50,
    };

    if (filters.uf) {
      params.uf = filters.uf;
    }

    if (filters.cidade) {
      params.cidade = filters.cidade;
    }

    if (filters.servico) {
      params.servico = filters.servico;
    }

    if (filters.aberto) {
      params.aberto = filters.aberto;
    }

    if (filters.search) {
      params.search = filters.search;
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
 * Buscar filtros disponíveis (serviços, estados e cidades)
 * da nova rota /rede-credenciada/filtros
 */
export async function getFiltrosRedeCredenciada(): Promise<FiltrosRedeCredenciada | null> {
  try {
    console.log('[API] Buscando filtros da rede credenciada...');
    const response = await api.get('/rede-credenciada/filtros');

    if (response.data.success) {
      console.log('[API] Filtros recebidos:', {
        servicos: response.data.data.servicos.length,
        estados: response.data.data.estados.length,
      });
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    console.error('Erro ao buscar filtros:', error.response?.data || error.message);
    return null;
  }
}
