import type { PaginatedResponse, SaleItem, SalesListPayload } from '../types';

const buildSalesPayload = (userId: number, page: number): SalesListPayload => ({
  usuario_id: userId,
  tipo_listagem: 'finalizados',
  page,
  filtro_endereco: '',
  filtro_numero: '',
  ordenacao: '',
  loja_id: '',
  perfil_login_id: 1,
});

export const listFinalizedSales = async (
  apiBaseUrl: string,
  token: string,
  userId: number,
  page: number,
): Promise<PaginatedResponse<SaleItem>> => {
  const url = `${apiBaseUrl.replace(/\/+$/, '')}/v1/listagem_vendas`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildSalesPayload(userId, page)),
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar vendas finalizadas (${response.status})`);
  }

  return (await response.json()) as PaginatedResponse<SaleItem>;
};
