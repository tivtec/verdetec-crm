export type UsuarioControleRow = {
  id: string;
  nome: string;
  telefone: string | null;
  tipoAcesso: string;
  tipoAcesso2?: string | null;
  email: string | null;
  meet: string | null;
  l100?: number | null;
  dispoLeads?: boolean;
  ativo: boolean;
};

export type UsuarioFormValues = {
  nome: string;
  email: string;
  telefone: string;
  linkMeet: string;
  identificadorUmbler: string;
  senha: string;
  tipoAcesso: string;
  permissao: string;
  tipoAcesso2: string;
  ativo: boolean;
};
