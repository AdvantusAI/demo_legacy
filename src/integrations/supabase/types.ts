export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ab_group: {
        Row: {
          description: string | null
          id: number
          label: string | null
          name: string
        }
        Insert: {
          description?: string | null
          id: number
          label?: string | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          label?: string | null
          name?: string
        }
        Relationships: []
      }
      ab_group_role: {
        Row: {
          group_id: number | null
          id: number
          role_id: number | null
        }
        Insert: {
          group_id?: number | null
          id: number
          role_id?: number | null
        }
        Update: {
          group_id?: number | null
          id?: number
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_group_role_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ab_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_group_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ab_role"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_permission: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      ab_permission_view: {
        Row: {
          id: number
          permission_id: number | null
          view_menu_id: number | null
        }
        Insert: {
          id: number
          permission_id?: number | null
          view_menu_id?: number | null
        }
        Update: {
          id?: number
          permission_id?: number | null
          view_menu_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_permission_view_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "ab_permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_permission_view_view_menu_id_fkey"
            columns: ["view_menu_id"]
            isOneToOne: false
            referencedRelation: "ab_view_menu"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_permission_view_role: {
        Row: {
          id: number
          permission_view_id: number | null
          role_id: number | null
        }
        Insert: {
          id: number
          permission_view_id?: number | null
          role_id?: number | null
        }
        Update: {
          id?: number
          permission_view_id?: number | null
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_permission_view_role_permission_view_id_fkey"
            columns: ["permission_view_id"]
            isOneToOne: false
            referencedRelation: "ab_permission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_permission_view_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ab_role"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_register_user: {
        Row: {
          email: string
          first_name: string
          id: number
          last_name: string
          password: string | null
          registration_date: string | null
          registration_hash: string | null
          username: string
        }
        Insert: {
          email: string
          first_name: string
          id: number
          last_name: string
          password?: string | null
          registration_date?: string | null
          registration_hash?: string | null
          username: string
        }
        Update: {
          email?: string
          first_name?: string
          id?: number
          last_name?: string
          password?: string | null
          registration_date?: string | null
          registration_hash?: string | null
          username?: string
        }
        Relationships: []
      }
      ab_role: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      ab_user: {
        Row: {
          active: boolean | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          email: string
          fail_login_count: number | null
          first_name: string
          id: number
          last_login: string | null
          last_name: string
          login_count: number | null
          password: string | null
          username: string
        }
        Insert: {
          active?: boolean | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          email: string
          fail_login_count?: number | null
          first_name: string
          id: number
          last_login?: string | null
          last_name: string
          login_count?: number | null
          password?: string | null
          username: string
        }
        Update: {
          active?: boolean | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          email?: string
          fail_login_count?: number | null
          first_name?: string
          id?: number
          last_login?: string | null
          last_name?: string
          login_count?: number | null
          password?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_user_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_user_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_user_group: {
        Row: {
          group_id: number | null
          id: number
          user_id: number | null
        }
        Insert: {
          group_id?: number | null
          id: number
          user_id?: number | null
        }
        Update: {
          group_id?: number | null
          id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_user_group_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ab_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_user_group_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_user_role: {
        Row: {
          id: number
          role_id: number | null
          user_id: number | null
        }
        Insert: {
          id: number
          role_id?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          role_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_user_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ab_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_user_role_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_view_menu: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      alembic_version: {
        Row: {
          version_num: string
        }
        Insert: {
          version_num: string
        }
        Update: {
          version_num?: string
        }
        Relationships: []
      }
      annotation: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          end_dttm: string | null
          id: number
          json_metadata: string | null
          layer_id: number | null
          long_descr: string | null
          short_descr: string | null
          start_dttm: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          end_dttm?: string | null
          id?: number
          json_metadata?: string | null
          layer_id?: number | null
          long_descr?: string | null
          short_descr?: string | null
          start_dttm?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          end_dttm?: string | null
          id?: number
          json_metadata?: string | null
          layer_id?: number | null
          long_descr?: string | null
          short_descr?: string | null
          start_dttm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotation_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotation_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotation_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "annotation_layer"
            referencedColumns: ["id"]
          },
        ]
      }
      annotation_layer: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          descr: string | null
          id: number
          name: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          descr?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          descr?: string | null
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotation_layer_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotation_layer_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_keys: {
        Row: {
          cache_key: string
          cache_timeout: number | null
          created_on: string | null
          datasource_uid: string
          id: number
        }
        Insert: {
          cache_key: string
          cache_timeout?: number | null
          created_on?: string | null
          datasource_uid: string
          id?: number
        }
        Update: {
          cache_key?: string
          cache_timeout?: number | null
          created_on?: string | null
          datasource_uid?: string
          id?: number
        }
        Relationships: []
      }
      css_templates: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          css: string | null
          id: number
          template_name: string | null
          uuid: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          css?: string | null
          id?: number
          template_name?: string | null
          uuid?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          css?: string | null
          id?: number
          template_name?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "css_templates_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "css_templates_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_roles: {
        Row: {
          dashboard_id: number | null
          id: number
          role_id: number
        }
        Insert: {
          dashboard_id?: number | null
          id?: number
          role_id: number
        }
        Update: {
          dashboard_id?: number | null
          id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_dashboard_roles_dashboard_id_dashboards"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dashboard_roles_role_id_ab_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ab_role"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_slices: {
        Row: {
          dashboard_id: number | null
          id: number
          slice_id: number | null
        }
        Insert: {
          dashboard_id?: number | null
          id?: number
          slice_id?: number | null
        }
        Update: {
          dashboard_id?: number | null
          id?: number
          slice_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dashboard_slices_dashboard_id_dashboards"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dashboard_slices_slice_id_slices"
            columns: ["slice_id"]
            isOneToOne: false
            referencedRelation: "slices"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_user: {
        Row: {
          dashboard_id: number | null
          id: number
          user_id: number | null
        }
        Insert: {
          dashboard_id?: number | null
          id?: number
          user_id?: number | null
        }
        Update: {
          dashboard_id?: number | null
          id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dashboard_user_dashboard_id_dashboards"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dashboard_user_user_id_ab_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          certification_details: string | null
          certified_by: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          css: string | null
          dashboard_title: string | null
          description: string | null
          external_url: string | null
          id: number
          is_managed_externally: boolean
          json_metadata: string | null
          position_json: string | null
          published: boolean | null
          slug: string | null
          uuid: string | null
        }
        Insert: {
          certification_details?: string | null
          certified_by?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          css?: string | null
          dashboard_title?: string | null
          description?: string | null
          external_url?: string | null
          id?: number
          is_managed_externally?: boolean
          json_metadata?: string | null
          position_json?: string | null
          published?: boolean | null
          slug?: string | null
          uuid?: string | null
        }
        Update: {
          certification_details?: string | null
          certified_by?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          css?: string | null
          dashboard_title?: string | null
          description?: string | null
          external_url?: string | null
          id?: number
          is_managed_externally?: boolean
          json_metadata?: string | null
          position_json?: string | null
          published?: boolean | null
          slug?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboards_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      database_user_oauth2_tokens: {
        Row: {
          access_token: string | null
          access_token_expiration: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          database_id: number
          id: number
          refresh_token: string | null
          user_id: number
        }
        Insert: {
          access_token?: string | null
          access_token_expiration?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id: number
          id?: number
          refresh_token?: string | null
          user_id: number
        }
        Update: {
          access_token?: string | null
          access_token_expiration?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number
          id?: number
          refresh_token?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "database_user_oauth2_tokens_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "database_user_oauth2_tokens_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "database_user_oauth2_tokens_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "database_user_oauth2_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      dbs: {
        Row: {
          allow_ctas: boolean | null
          allow_cvas: boolean | null
          allow_dml: boolean | null
          allow_file_upload: boolean
          allow_run_async: boolean | null
          cache_timeout: number | null
          changed_by_fk: number | null
          changed_on: string | null
          configuration_method: string | null
          created_by_fk: number | null
          created_on: string | null
          database_name: string
          encrypted_extra: string | null
          expose_in_sqllab: boolean | null
          external_url: string | null
          extra: string | null
          force_ctas_schema: string | null
          id: number
          impersonate_user: boolean | null
          is_managed_externally: boolean
          password: string | null
          select_as_create_table_as: boolean | null
          server_cert: string | null
          sqlalchemy_uri: string
          uuid: string | null
          verbose_name: string | null
        }
        Insert: {
          allow_ctas?: boolean | null
          allow_cvas?: boolean | null
          allow_dml?: boolean | null
          allow_file_upload?: boolean
          allow_run_async?: boolean | null
          cache_timeout?: number | null
          changed_by_fk?: number | null
          changed_on?: string | null
          configuration_method?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_name: string
          encrypted_extra?: string | null
          expose_in_sqllab?: boolean | null
          external_url?: string | null
          extra?: string | null
          force_ctas_schema?: string | null
          id?: number
          impersonate_user?: boolean | null
          is_managed_externally?: boolean
          password?: string | null
          select_as_create_table_as?: boolean | null
          server_cert?: string | null
          sqlalchemy_uri: string
          uuid?: string | null
          verbose_name?: string | null
        }
        Update: {
          allow_ctas?: boolean | null
          allow_cvas?: boolean | null
          allow_dml?: boolean | null
          allow_file_upload?: boolean
          allow_run_async?: boolean | null
          cache_timeout?: number | null
          changed_by_fk?: number | null
          changed_on?: string | null
          configuration_method?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_name?: string
          encrypted_extra?: string | null
          expose_in_sqllab?: boolean | null
          external_url?: string | null
          extra?: string | null
          force_ctas_schema?: string | null
          id?: number
          impersonate_user?: boolean | null
          is_managed_externally?: boolean
          password?: string | null
          select_as_create_table_as?: boolean | null
          server_cert?: string | null
          sqlalchemy_uri?: string
          uuid?: string | null
          verbose_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dbs_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dbs_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_plugin: {
        Row: {
          bundle_url: string
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          id: number
          key: string
          name: string
        }
        Insert: {
          bundle_url: string
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          key: string
          name: string
        }
        Update: {
          bundle_url?: string
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          key?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_plugin_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_plugin_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      embedded_dashboards: {
        Row: {
          allow_domain_list: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          dashboard_id: number
          uuid: string | null
        }
        Insert: {
          allow_domain_list?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          dashboard_id: number
          uuid?: string | null
        }
        Update: {
          allow_domain_list?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          dashboard_id?: number
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_embedded_dashboards_dashboard_id_dashboards"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      favstar: {
        Row: {
          class_name: string | null
          dttm: string | null
          id: number
          obj_id: number | null
          user_id: number | null
          uuid: string | null
        }
        Insert: {
          class_name?: string | null
          dttm?: string | null
          id?: number
          obj_id?: number | null
          user_id?: number | null
          uuid?: string | null
        }
        Update: {
          class_name?: string | null
          dttm?: string | null
          id?: number
          obj_id?: number | null
          user_id?: number | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favstar_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      key_value: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          expires_on: string | null
          id: number
          resource: string
          uuid: string | null
          value: string
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          expires_on?: string | null
          id?: number
          resource: string
          uuid?: string | null
          value: string
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          expires_on?: string | null
          id?: number
          resource?: string
          uuid?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_value_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_value_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      keyvalue: {
        Row: {
          id: number
          value: string
        }
        Insert: {
          id?: number
          value: string
        }
        Update: {
          id?: number
          value?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string | null
          dashboard_id: number | null
          dttm: string | null
          duration_ms: number | null
          id: number
          json: string | null
          referrer: string | null
          slice_id: number | null
          user_id: number | null
        }
        Insert: {
          action?: string | null
          dashboard_id?: number | null
          dttm?: string | null
          duration_ms?: number | null
          id?: number
          json?: string | null
          referrer?: string | null
          slice_id?: number | null
          user_id?: number | null
        }
        Update: {
          action?: string | null
          dashboard_id?: number | null
          dttm?: string | null
          duration_ms?: number | null
          id?: number
          json?: string | null
          referrer?: string | null
          slice_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      query: {
        Row: {
          catalog: string | null
          changed_on: string | null
          client_id: string
          ctas_method: string | null
          database_id: number
          end_result_backend_time: number | null
          end_time: number | null
          error_message: string | null
          executed_sql: string | null
          extra_json: string | null
          id: number
          limit: number | null
          limiting_factor: string | null
          progress: number | null
          results_key: string | null
          rows: number | null
          schema: string | null
          select_as_cta: boolean | null
          select_as_cta_used: boolean | null
          select_sql: string | null
          sql: string | null
          sql_editor_id: string | null
          start_running_time: number | null
          start_time: number | null
          status: string | null
          tab_name: string | null
          tmp_schema_name: string | null
          tmp_table_name: string | null
          tracking_url: string | null
          user_id: number | null
        }
        Insert: {
          catalog?: string | null
          changed_on?: string | null
          client_id: string
          ctas_method?: string | null
          database_id: number
          end_result_backend_time?: number | null
          end_time?: number | null
          error_message?: string | null
          executed_sql?: string | null
          extra_json?: string | null
          id?: number
          limit?: number | null
          limiting_factor?: string | null
          progress?: number | null
          results_key?: string | null
          rows?: number | null
          schema?: string | null
          select_as_cta?: boolean | null
          select_as_cta_used?: boolean | null
          select_sql?: string | null
          sql?: string | null
          sql_editor_id?: string | null
          start_running_time?: number | null
          start_time?: number | null
          status?: string | null
          tab_name?: string | null
          tmp_schema_name?: string | null
          tmp_table_name?: string | null
          tracking_url?: string | null
          user_id?: number | null
        }
        Update: {
          catalog?: string | null
          changed_on?: string | null
          client_id?: string
          ctas_method?: string | null
          database_id?: number
          end_result_backend_time?: number | null
          end_time?: number | null
          error_message?: string | null
          executed_sql?: string | null
          extra_json?: string | null
          id?: number
          limit?: number | null
          limiting_factor?: string | null
          progress?: number | null
          results_key?: string | null
          rows?: number | null
          schema?: string | null
          select_as_cta?: boolean | null
          select_as_cta_used?: boolean | null
          select_sql?: string | null
          sql?: string | null
          sql_editor_id?: string | null
          start_running_time?: number | null
          start_time?: number | null
          status?: string | null
          tab_name?: string | null
          tmp_schema_name?: string | null
          tmp_table_name?: string | null
          tracking_url?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "query_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      report_execution_log: {
        Row: {
          end_dttm: string | null
          error_message: string | null
          id: number
          report_schedule_id: number
          scheduled_dttm: string
          start_dttm: string | null
          state: string
          uuid: string | null
          value: number | null
          value_row_json: string | null
        }
        Insert: {
          end_dttm?: string | null
          error_message?: string | null
          id?: number
          report_schedule_id: number
          scheduled_dttm: string
          start_dttm?: string | null
          state: string
          uuid?: string | null
          value?: number | null
          value_row_json?: string | null
        }
        Update: {
          end_dttm?: string | null
          error_message?: string | null
          id?: number
          report_schedule_id?: number
          scheduled_dttm?: string
          start_dttm?: string | null
          state?: string
          uuid?: string | null
          value?: number | null
          value_row_json?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_execution_log_report_schedule_id_fkey"
            columns: ["report_schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      report_recipient: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          id: number
          recipient_config_json: string | null
          report_schedule_id: number
          type: string
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          recipient_config_json?: string | null
          report_schedule_id: number
          type: string
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          recipient_config_json?: string | null
          report_schedule_id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_recipient_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_recipient_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_recipient_report_schedule_id_fkey"
            columns: ["report_schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedule: {
        Row: {
          active: boolean | null
          changed_by_fk: number | null
          changed_on: string | null
          chart_id: number | null
          context_markdown: string | null
          created_by_fk: number | null
          created_on: string | null
          creation_method: string | null
          crontab: string
          custom_height: number | null
          custom_width: number | null
          dashboard_id: number | null
          database_id: number | null
          description: string | null
          email_subject: string | null
          extra_json: string
          force_screenshot: boolean | null
          grace_period: number | null
          id: number
          last_eval_dttm: string | null
          last_state: string | null
          last_value: number | null
          last_value_row_json: string | null
          log_retention: number | null
          name: string
          report_format: string | null
          sql: string | null
          timezone: string
          type: string
          validator_config_json: string | null
          validator_type: string | null
          working_timeout: number | null
        }
        Insert: {
          active?: boolean | null
          changed_by_fk?: number | null
          changed_on?: string | null
          chart_id?: number | null
          context_markdown?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          creation_method?: string | null
          crontab: string
          custom_height?: number | null
          custom_width?: number | null
          dashboard_id?: number | null
          database_id?: number | null
          description?: string | null
          email_subject?: string | null
          extra_json: string
          force_screenshot?: boolean | null
          grace_period?: number | null
          id?: number
          last_eval_dttm?: string | null
          last_state?: string | null
          last_value?: number | null
          last_value_row_json?: string | null
          log_retention?: number | null
          name: string
          report_format?: string | null
          sql?: string | null
          timezone?: string
          type: string
          validator_config_json?: string | null
          validator_type?: string | null
          working_timeout?: number | null
        }
        Update: {
          active?: boolean | null
          changed_by_fk?: number | null
          changed_on?: string | null
          chart_id?: number | null
          context_markdown?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          creation_method?: string | null
          crontab?: string
          custom_height?: number | null
          custom_width?: number | null
          dashboard_id?: number | null
          database_id?: number | null
          description?: string | null
          email_subject?: string | null
          extra_json?: string
          force_screenshot?: boolean | null
          grace_period?: number | null
          id?: number
          last_eval_dttm?: string | null
          last_state?: string | null
          last_value?: number | null
          last_value_row_json?: string | null
          log_retention?: number | null
          name?: string
          report_format?: string | null
          sql?: string | null
          timezone?: string
          type?: string
          validator_config_json?: string | null
          validator_type?: string | null
          working_timeout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_schedule_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedule_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "slices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedule_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedule_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedule_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedule_user: {
        Row: {
          id: number
          report_schedule_id: number
          user_id: number
        }
        Insert: {
          id?: number
          report_schedule_id: number
          user_id: number
        }
        Update: {
          id?: number
          report_schedule_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_schedule_user_report_schedule_id_report_schedule"
            columns: ["report_schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_report_schedule_user_user_id_ab_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_filter_roles: {
        Row: {
          id: number
          rls_filter_id: number | null
          role_id: number
        }
        Insert: {
          id?: number
          rls_filter_id?: number | null
          role_id: number
        }
        Update: {
          id?: number
          rls_filter_id?: number | null
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rls_filter_roles_rls_filter_id_fkey"
            columns: ["rls_filter_id"]
            isOneToOne: false
            referencedRelation: "row_level_security_filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rls_filter_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ab_role"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_filter_tables: {
        Row: {
          id: number
          rls_filter_id: number | null
          table_id: number | null
        }
        Insert: {
          id?: number
          rls_filter_id?: number | null
          table_id?: number | null
        }
        Update: {
          id?: number
          rls_filter_id?: number | null
          table_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rls_filter_tables_rls_filter_id_fkey"
            columns: ["rls_filter_id"]
            isOneToOne: false
            referencedRelation: "row_level_security_filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rls_filter_tables_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      row_level_security_filters: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          clause: string
          created_by_fk: number | null
          created_on: string | null
          description: string | null
          filter_type: string | null
          group_key: string | null
          id: number
          name: string
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          clause: string
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          filter_type?: string | null
          group_key?: string | null
          id?: number
          name: string
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          clause?: string
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          filter_type?: string | null
          group_key?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "row_level_security_filters_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "row_level_security_filters_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_query: {
        Row: {
          catalog: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          db_id: number | null
          description: string | null
          extra_json: string | null
          id: number
          label: string | null
          last_run: string | null
          rows: number | null
          schema: string | null
          sql: string | null
          template_parameters: string | null
          user_id: number | null
          uuid: string | null
        }
        Insert: {
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          db_id?: number | null
          description?: string | null
          extra_json?: string | null
          id?: number
          label?: string | null
          last_run?: string | null
          rows?: number | null
          schema?: string | null
          sql?: string | null
          template_parameters?: string | null
          user_id?: number | null
          uuid?: string | null
        }
        Update: {
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          db_id?: number | null
          description?: string | null
          extra_json?: string | null
          id?: number
          label?: string | null
          last_run?: string | null
          rows?: number | null
          schema?: string | null
          sql?: string | null
          template_parameters?: string | null
          user_id?: number | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_query_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_query_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_query_db_id_fkey"
            columns: ["db_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_query_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      slice_user: {
        Row: {
          id: number
          slice_id: number | null
          user_id: number | null
        }
        Insert: {
          id?: number
          slice_id?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          slice_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_slice_user_slice_id_slices"
            columns: ["slice_id"]
            isOneToOne: false
            referencedRelation: "slices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_slice_user_user_id_ab_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      slices: {
        Row: {
          cache_timeout: number | null
          catalog_perm: string | null
          certification_details: string | null
          certified_by: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          datasource_id: number | null
          datasource_name: string | null
          datasource_type: string | null
          description: string | null
          external_url: string | null
          id: number
          is_managed_externally: boolean
          last_saved_at: string | null
          last_saved_by_fk: number | null
          params: string | null
          perm: string | null
          query_context: string | null
          schema_perm: string | null
          slice_name: string | null
          uuid: string | null
          viz_type: string | null
        }
        Insert: {
          cache_timeout?: number | null
          catalog_perm?: string | null
          certification_details?: string | null
          certified_by?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          datasource_id?: number | null
          datasource_name?: string | null
          datasource_type?: string | null
          description?: string | null
          external_url?: string | null
          id?: number
          is_managed_externally?: boolean
          last_saved_at?: string | null
          last_saved_by_fk?: number | null
          params?: string | null
          perm?: string | null
          query_context?: string | null
          schema_perm?: string | null
          slice_name?: string | null
          uuid?: string | null
          viz_type?: string | null
        }
        Update: {
          cache_timeout?: number | null
          catalog_perm?: string | null
          certification_details?: string | null
          certified_by?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          datasource_id?: number | null
          datasource_name?: string | null
          datasource_type?: string | null
          description?: string | null
          external_url?: string | null
          id?: number
          is_managed_externally?: boolean
          last_saved_at?: string | null
          last_saved_by_fk?: number | null
          params?: string | null
          perm?: string | null
          query_context?: string | null
          schema_perm?: string | null
          slice_name?: string | null
          uuid?: string | null
          viz_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slices_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slices_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slices_last_saved_by_fk"
            columns: ["last_saved_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      sql_metrics: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          currency: string | null
          d3format: string | null
          description: string | null
          expression: string
          extra: string | null
          id: number
          metric_name: string
          metric_type: string | null
          table_id: number | null
          uuid: string | null
          verbose_name: string | null
          warning_text: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          currency?: string | null
          d3format?: string | null
          description?: string | null
          expression: string
          extra?: string | null
          id?: number
          metric_name: string
          metric_type?: string | null
          table_id?: number | null
          uuid?: string | null
          verbose_name?: string | null
          warning_text?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          currency?: string | null
          d3format?: string | null
          description?: string | null
          expression?: string
          extra?: string | null
          id?: number
          metric_name?: string
          metric_type?: string | null
          table_id?: number | null
          uuid?: string | null
          verbose_name?: string | null
          warning_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sql_metrics_table_id_tables"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sql_metrics_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sql_metrics_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      sqlatable_user: {
        Row: {
          id: number
          table_id: number | null
          user_id: number | null
        }
        Insert: {
          id?: number
          table_id?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          table_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sqlatable_user_table_id_tables"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sqlatable_user_user_id_ab_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      ssh_tunnels: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          database_id: number | null
          extra_json: string | null
          id: number
          password: string | null
          private_key: string | null
          private_key_password: string | null
          server_address: string | null
          server_port: number | null
          username: string | null
          uuid: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number | null
          extra_json?: string | null
          id?: number
          password?: string | null
          private_key?: string | null
          private_key_password?: string | null
          server_address?: string | null
          server_port?: number | null
          username?: string | null
          uuid?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number | null
          extra_json?: string | null
          id?: number
          password?: string | null
          private_key?: string | null
          private_key_password?: string | null
          server_address?: string | null
          server_port?: number | null
          username?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssh_tunnels_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_state: {
        Row: {
          active: boolean | null
          autorun: boolean
          catalog: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          database_id: number | null
          extra_json: string | null
          hide_left_bar: boolean
          id: number
          label: string | null
          latest_query_id: string | null
          query_limit: number | null
          saved_query_id: number | null
          schema: string | null
          sql: string | null
          template_params: string | null
          user_id: number | null
        }
        Insert: {
          active?: boolean | null
          autorun: boolean
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number | null
          extra_json?: string | null
          hide_left_bar?: boolean
          id?: number
          label?: string | null
          latest_query_id?: string | null
          query_limit?: number | null
          saved_query_id?: number | null
          schema?: string | null
          sql?: string | null
          template_params?: string | null
          user_id?: number | null
        }
        Update: {
          active?: boolean | null
          autorun?: boolean
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number | null
          extra_json?: string | null
          hide_left_bar?: boolean
          id?: number
          label?: string | null
          latest_query_id?: string | null
          query_limit?: number | null
          saved_query_id?: number | null
          schema?: string | null
          sql?: string | null
          template_params?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_query_id"
            columns: ["saved_query_id"]
            isOneToOne: false
            referencedRelation: "saved_query"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_state_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_state_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_state_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_state_latest_query_id_fkey"
            columns: ["latest_query_id"]
            isOneToOne: false
            referencedRelation: "query"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tab_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      table_columns: {
        Row: {
          advanced_data_type: string | null
          changed_by_fk: number | null
          changed_on: string | null
          column_name: string
          created_by_fk: number | null
          created_on: string | null
          description: string | null
          expression: string | null
          extra: string | null
          filterable: boolean | null
          groupby: boolean | null
          id: number
          is_active: boolean | null
          is_dttm: boolean | null
          python_date_format: string | null
          table_id: number | null
          type: string | null
          uuid: string | null
          verbose_name: string | null
        }
        Insert: {
          advanced_data_type?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          column_name: string
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          expression?: string | null
          extra?: string | null
          filterable?: boolean | null
          groupby?: boolean | null
          id?: number
          is_active?: boolean | null
          is_dttm?: boolean | null
          python_date_format?: string | null
          table_id?: number | null
          type?: string | null
          uuid?: string | null
          verbose_name?: string | null
        }
        Update: {
          advanced_data_type?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          column_name?: string
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          expression?: string | null
          extra?: string | null
          filterable?: boolean | null
          groupby?: boolean | null
          id?: number
          is_active?: boolean | null
          is_dttm?: boolean | null
          python_date_format?: string | null
          table_id?: number | null
          type?: string | null
          uuid?: string | null
          verbose_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_table_columns_table_id_tables"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_columns_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_columns_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      table_schema: {
        Row: {
          catalog: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          database_id: number
          description: string | null
          expanded: boolean | null
          extra_json: string | null
          id: number
          schema: string | null
          tab_state_id: number | null
          table: string | null
        }
        Insert: {
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id: number
          description?: string | null
          expanded?: boolean | null
          extra_json?: string | null
          id?: number
          schema?: string | null
          tab_state_id?: number | null
          table?: string | null
        }
        Update: {
          catalog?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number
          description?: string | null
          expanded?: boolean | null
          extra_json?: string | null
          id?: number
          schema?: string | null
          tab_state_id?: number | null
          table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_schema_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_schema_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_schema_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_schema_tab_state_id_fkey"
            columns: ["tab_state_id"]
            isOneToOne: false
            referencedRelation: "tab_state"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          always_filter_main_dttm: boolean | null
          cache_timeout: number | null
          catalog: string | null
          catalog_perm: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          database_id: number
          default_endpoint: string | null
          description: string | null
          external_url: string | null
          extra: string | null
          fetch_values_predicate: string | null
          filter_select_enabled: boolean | null
          id: number
          is_featured: boolean | null
          is_managed_externally: boolean
          is_sqllab_view: boolean | null
          main_dttm_col: string | null
          normalize_columns: boolean | null
          offset: number | null
          params: string | null
          perm: string | null
          schema: string | null
          schema_perm: string | null
          sql: string | null
          table_name: string
          template_params: string | null
          uuid: string | null
        }
        Insert: {
          always_filter_main_dttm?: boolean | null
          cache_timeout?: number | null
          catalog?: string | null
          catalog_perm?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id: number
          default_endpoint?: string | null
          description?: string | null
          external_url?: string | null
          extra?: string | null
          fetch_values_predicate?: string | null
          filter_select_enabled?: boolean | null
          id?: number
          is_featured?: boolean | null
          is_managed_externally?: boolean
          is_sqllab_view?: boolean | null
          main_dttm_col?: string | null
          normalize_columns?: boolean | null
          offset?: number | null
          params?: string | null
          perm?: string | null
          schema?: string | null
          schema_perm?: string | null
          sql?: string | null
          table_name: string
          template_params?: string | null
          uuid?: string | null
        }
        Update: {
          always_filter_main_dttm?: boolean | null
          cache_timeout?: number | null
          catalog?: string | null
          catalog_perm?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          database_id?: number
          default_endpoint?: string | null
          description?: string | null
          external_url?: string | null
          extra?: string | null
          fetch_values_predicate?: string | null
          filter_select_enabled?: boolean | null
          id?: number
          is_featured?: boolean | null
          is_managed_externally?: boolean
          is_sqllab_view?: boolean | null
          main_dttm_col?: string | null
          normalize_columns?: boolean | null
          offset?: number | null
          params?: string | null
          perm?: string | null
          schema?: string | null
          schema_perm?: string | null
          sql?: string | null
          table_name?: string
          template_params?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "dbs"
            referencedColumns: ["id"]
          },
        ]
      }
      tag: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          description: string | null
          id: number
          name: string | null
          type: string | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          id?: number
          name?: string | null
          type?: string | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          description?: string | null
          id?: number
          name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
      tagged_object: {
        Row: {
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          id: number
          object_id: number | null
          object_type: string | null
          tag_id: number | null
        }
        Insert: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          object_id?: number | null
          object_type?: string | null
          tag_id?: number | null
        }
        Update: {
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          object_id?: number | null
          object_type?: string | null
          tag_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tagged_object_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagged_object_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagged_object_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      user_attribute: {
        Row: {
          avatar_url: string | null
          changed_by_fk: number | null
          changed_on: string | null
          created_by_fk: number | null
          created_on: string | null
          id: number
          user_id: number | null
          welcome_dashboard_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          user_id?: number | null
          welcome_dashboard_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          changed_by_fk?: number | null
          changed_on?: string | null
          created_by_fk?: number | null
          created_on?: string | null
          id?: number
          user_id?: number | null
          welcome_dashboard_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_attribute_changed_by_fk_fkey"
            columns: ["changed_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_attribute_created_by_fk_fkey"
            columns: ["created_by_fk"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_attribute_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_attribute_welcome_dashboard_id_fkey"
            columns: ["welcome_dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_tag: {
        Row: {
          tag_id: number
          user_id: number
        }
        Insert: {
          tag_id: number
          user_id: number
        }
        Update: {
          tag_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_tag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ab_user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_categorias: {
        Row: {
          category_id: string | null
          category_name: string | null
        }
        Relationships: []
      }
      v_subcategorias: {
        Row: {
          count: number | null
          subcategory_id: string | null
          subcategory_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_aggregated_forecast_data: {
        Args: {
          p_customer_id?: string
          p_location_id?: string
          p_product_id?: string
        }
        Returns: {
          actual: number
          category_id: string
          category_name: string
          collaboration_status: string
          commercial_input: number
          commercial_notes: string
          customer_id: string
          demand_planner: number
          forecast: number
          location_id: string
          postdate: string
          product_id: string
          sales_plan: number
          subcategory_id: string
          subcategory_name: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "administrator"
        | "demand_planner"
        | "supply_planner"
        | "user"
        | "admin"
      emaildeliverytype: "attachment" | "inline"
      objecttype: "query" | "chart" | "dashboard" | "dataset"
      sliceemailreportformat: "visualization" | "data"
      tagtype: "custom" | "type" | "owner" | "favorited_by"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrator",
        "demand_planner",
        "supply_planner",
        "user",
        "admin",
      ],
      emaildeliverytype: ["attachment", "inline"],
      objecttype: ["query", "chart", "dashboard", "dataset"],
      sliceemailreportformat: ["visualization", "data"],
      tagtype: ["custom", "type", "owner", "favorited_by"],
    },
  },
} as const
