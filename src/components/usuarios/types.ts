export type UsuarioControleRow = {
  id: string;
  nome: string;
  telefone: string | null;
  tipoAcesso: string;
  email: string | null;
  meet: string | null;
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
  ativo: boolean;
};
