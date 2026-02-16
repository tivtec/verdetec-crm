export type EmpresaControleRow = {
  id: string;
  nome: string;
  data: string;
  status: string;
  usuario: string;
  endereco: string;
  idUsuario?: number | null;
  representanteId?: number | null;
  codigoCliente?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  linkInstagram?: string | null;
};

export type EmpresaRepresentanteOption = {
  id: number;
  nome: string;
};

export type EmpresaCadastroForm = {
  codigoCliente: string;
  nome: string;
  representanteId: string;
  email: string;
  telefone: string;
  whatsapp: string;
  cnpj: string;
  cep: string;
  endereco: string;
  linkInstagram: string;
};
