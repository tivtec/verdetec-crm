export type ClienteControleRow = {
  id: string;
  etiqueta: string;
  telefone: string | null;
  nome: string;
  equipamento: string | null;
  data30: string | null;
  data40: string | null;
  pessoaId?: number | null;
  agregacaoId?: number | null;
  usuarioId?: number | null;
};

export type ClienteRepresentanteOption = {
  id: number;
  nome: string;
};

export type ClientesControlFiltersValue = {
  usuario: string;
  telefone: string;
  nome: string;
  etiqueta: string;
};
