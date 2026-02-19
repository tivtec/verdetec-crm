export type CrmPage = {
  key: string;
  path: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type AccessOrganizationOption = {
  id: string;
  nome: string;
};

export type UserPageAccess = {
  idUsuario: number;
  idOrganizacao: string;
  pageKey: string;
  allow: boolean;
};

export type AccessMatrixRow = {
  idUsuario: number;
  nome: string;
  email: string | null;
  tipoAcesso: string | null;
  acessos: Record<string, boolean>;
};
