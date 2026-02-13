export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          full_name: string;
          email: string;
          role_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          full_name: string;
          email: string;
          role_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      companies: {
        Row: {
          id: string;
          name: string;
          cnpj: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      org_units: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          vertical: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          vertical: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_units"]["Insert"]>;
      };
      clientes: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          owner_id: string | null;
          nome: string;
          email: string | null;
          telefone: string | null;
          etiqueta: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          owner_id?: string | null;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          etiqueta?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
      };
      empresas: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          owner_id: string | null;
          razao_social: string;
          cnpj: string | null;
          vertical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          owner_id?: string | null;
          razao_social: string;
          cnpj?: string | null;
          vertical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
      };
      pedidos: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          owner_id: string | null;
          cliente_id: string | null;
          valor_total: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          owner_id?: string | null;
          cliente_id?: string | null;
          valor_total?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pedidos"]["Insert"]>;
      };
      agenda_events: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          owner_id: string | null;
          title: string;
          starts_at: string;
          ends_at: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          owner_id?: string | null;
          title: string;
          starts_at: string;
          ends_at: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agenda_events"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          company_id: string;
          unit_id: string | null;
          owner_id: string | null;
          nome: string;
          email: string | null;
          telefone: string | null;
          origem: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          unit_id?: string | null;
          owner_id?: string | null;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          origem?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      etiquetas: {
        Row: {
          id: string;
          company_id: string;
          nome: string;
          cor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          nome: string;
          cor?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["etiquetas"]["Insert"]>;
      };
      pipeline_histories: {
        Row: {
          id: string;
          company_id: string;
          cliente_id: string | null;
          lead_id: string | null;
          etapa: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cliente_id?: string | null;
          lead_id?: string | null;
          etapa: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_histories"]["Insert"]>;
      };
      propostas: {
        Row: {
          id: string;
          company_id: string;
          cliente_id: string;
          valor: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cliente_id: string;
          valor: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["propostas"]["Insert"]>;
      };
      contratos: {
        Row: {
          id: string;
          company_id: string;
          proposta_id: string;
          status: string;
          signed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          proposta_id: string;
          status?: string;
          signed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contratos"]["Insert"]>;
      };
      roles: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          level: number;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          level?: number;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };
      permissions: {
        Row: {
          id: string;
          key: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Insert"]>;
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_permissions"]["Insert"]>;
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          scope_type: "org" | "unit" | "self";
          unit_id: string | null;
        };
        Insert: {
          user_id: string;
          role_id: string;
          scope_type: "org" | "unit" | "self";
          unit_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
    };
    Views: {
      view_dashboard_metrics: {
        Row: {
          company_id: string;
          total_clientes: number;
          total_empresas: number;
          total_pedidos: number;
          ticket_medio: number;
          period_start: string | null;
          period_end: string | null;
        };
      };
    };
    Functions: {
      rpc_get_clientes_funil: {
        Args: { p_company_id: string; p_vertical?: string | null };
        Returns: {
          etiqueta: string;
          total: number;
        }[];
      };
      rpc_paginate_clientes: {
        Args: {
          p_company_id: string;
          p_search?: string | null;
          p_offset?: number;
          p_limit?: number;
        };
        Returns: Database["public"]["Tables"]["clientes"]["Row"][];
      };
      rpc_notify_channel: {
        Args: {
          p_channel: string;
          p_payload: Json;
        };
        Returns: null;
      };
    };
  };
};
