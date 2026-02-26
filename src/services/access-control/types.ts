export type CrmPage = {
  key: string;
  path: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type SidebarModule = {
  id: string;
  key: string;
  nome: string;
  sortOrder: number;
};

export type SidebarNavPage = {
  key: string;
  path: string;
  label: string;
  sortOrder: number;
  idModulo: string;
};

export type SidebarNavigationSnapshot = {
  modules: SidebarModule[];
  selectedModuleId: string;
  selectedModuleName: string;
  menuPages: SidebarNavPage[];
};

export type AccessOrganizationOption = {
  id: string;
  nome: string;
};

export type AccessModuleOption = {
  id: string;
  key: string;
  nome: string;
  sortOrder: number;
  pageKeys: string[];
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
