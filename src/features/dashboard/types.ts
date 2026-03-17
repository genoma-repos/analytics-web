export type OcrTypeEntry = {
  nome_tipo?: string | null;
};

export type OcrItem = {
  processo_id: number | string;
  documento_id?: number | string | null;
  nome?: string | null;
  tipo?: string | null;
  ocr?: string | null;
  tipo_documento?: OcrTypeEntry[] | null;
};

export type ChartItem = {
  name: string;
  acertos: number;
  total: number;
};

export type PieItem = {
  name: 'Acertos' | 'Erros' | 'Nao Avaliados';
  value: number;
  color: string;
};

export type Stats = {
  total: number;
  acertos: number;
  erros: number;
  naoAvaliados: number;
  taxa: string;
  chartData: ChartItem[];
  pieData: PieItem[];
};

export type FilterKind = 'todos' | 'acertos' | 'erros' | 'nao_avaliados';

export type SalesListingType =
  | 'rascunhos'
  | 'entregues'
  | 'revisoes'
  | 'arquivados'
  | 'finalizados'
  | 'andamento'
  | 'finalizadas'
  | 'cancelados'
  | '';

export type SalesOrder =
  | 'order_assinatura_1'
  | 'order_assinatura_2'
  | 'order_escritura_1'
  | 'order_escritura_2'
  | 'order_status_1'
  | 'order_status_2'
  | 'data_pedido_1'
  | 'data_pedido_2'
  | 'dias_corridos_1'
  | 'dias_corridos_2'
  | 'order_rank_1'
  | 'order_rank_2'
  | 'order_rank_3'
  | 'order_rank_4'
  | 'order_cancelamento_1'
  | 'order_cancelamento_2'
  | '';

export type SaleItem = {
  id: number;
  processo_id: number;
  nome_gerente: string;
  nome_pos_responsavel: string;
  data_assinatura: string;
  prazo_escritura: string;
  forma_pagamento: string;
  nome_forma_pagamento?: string | null;
  nome_status?: string;

  
  "imovel_id": number,
  "loja_id": number,
  "gerente_id": number,  
  "responsavel_id": number,  
  "logradouro": string,
  "numero": string,
  "unidade": string,
  "complemento": string,
  "bairro": string,
  "cidade": string,
  "uf": string,
  "recibo_type": "manual" | "docusign" | "hibrido",
  "envelope_id": null | string,    
  "recibo": string,
  "prazo": string, // "45"
  "ultima_alteracao": string,
  "data_cancelamento": string,
  "status_id": number,
  "desistiu":  null | 0 | 1,
  "cobranca":  null | 0 | 1,
  "devolucao_id": null | number,
  "devolucao_vendedor":  null | 0 | 1,
  "devolucao_comprador":  null | 0 | 1,
  "devolucao_recibo": null | 0 | 1,
  "devolucao_comissao":  null | 0 | 1,
  "devolucao_imovel":  null | 0 | 1,
  "porcenagem_preenchida_imovel": null | number,
  "porcenagem_preenchida_vendedores": null | number,
  "porcenagem_preenchida_compradores": null | number,
  "porcenagem_preenchida_rascunho": null | number,
  "porcentagem_total_concluida": number,
  "status_rascunho_id": null | number,
  "status_rascunho": null | string,
  "emails_todos_envolvidos": 0 | 1,
  "todos_documentos_vendedores": 0 | 1,
  "todos_documentos_compradores": 0 | 1,
  "clausula_segunda": 0 | 1,
  "porcentagem_preenchida_comissao": number
};

export type PaginatedResponse<T> = {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

export type SalesListPayload = {
  usuario_id: number;
  tipo_listagem: SalesListingType;
  page: number;
  filtro_endereco: string;
  filtro_numero: string;
  ordenacao: SalesOrder;
  loja_id: number | '';
  perfil_login_id: number | '';
};

export type SaleAnalysisRow = {
  id: number;
  processoId: number;
  assinatura: string;
  escritura: string;
  tempoDias: number | null;
  gerente: string;
  posVenda: string;
  formaPagamento: 'A vista' | 'Financiamento' | 'Nao informado';
  isDevolvido: boolean
} & SaleItem;
