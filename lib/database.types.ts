export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      game_answers: {
        Row: {
          answered_at: string | null;
          correct_option_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_correct: boolean;
          join_id: string | null;
          player_name: string | null;
          response_time_ms: number | null;
          selected_option_id: string | null;
          session_id: string;
          updated_at: string | null;
        };
        Insert: {
          answered_at?: string | null;
          correct_option_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_correct: boolean;
          join_id?: string | null;
          player_name?: string | null;
          response_time_ms?: number | null;
          selected_option_id?: string | null;
          session_id: string;
          updated_at?: string | null;
        };
        Update: {
          answered_at?: string | null;
          correct_option_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_correct?: boolean;
          join_id?: string | null;
          player_name?: string | null;
          response_time_ms?: number | null;
          selected_option_id?: string | null;
          session_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'game_answers_selected_student_id_fkey';
            columns: ['selected_option_id'];
            isOneToOne: false;
            referencedRelation: 'people';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_answers_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_answers_student_id_fkey';
            columns: ['correct_option_id'];
            isOneToOne: false;
            referencedRelation: 'people';
            referencedColumns: ['id'];
          },
        ];
      };
      game_sessions: {
        Row: {
          completed_at: string | null;
          game_code: string | null;
          game_type: Database['public']['Enums']['game_type'];
          group_id: string;
          id: string;
          options_count: number | null;
          score: number | null;
          started_at: string | null;
          status: string | null;
          time_limit_seconds: number | null;
          total_questions: number | null;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          game_code?: string | null;
          game_type: Database['public']['Enums']['game_type'];
          group_id: string;
          id?: string;
          options_count?: number | null;
          score?: number | null;
          started_at?: string | null;
          status?: string | null;
          time_limit_seconds?: number | null;
          total_questions?: number | null;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          game_code?: string | null;
          game_type?: Database['public']['Enums']['game_type'];
          group_id?: string;
          id?: string;
          options_count?: number | null;
          score?: number | null;
          started_at?: string | null;
          status?: string | null;
          time_limit_seconds?: number | null;
          total_questions?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'game_sessions_class_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string | null;
          creator_id: string;
          id: string;
          name: string;
          options_count: number | null;
          time_limit_seconds: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id: string;
          id?: string;
          name: string;
          options_count?: number | null;
          time_limit_seconds?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string;
          id?: string;
          name?: string;
          options_count?: number | null;
          time_limit_seconds?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      people: {
        Row: {
          created_at: string | null;
          first_name: string;
          gender: Database['public']['Enums']['gender_type'];
          group_id: string;
          id: string;
          image_url: string | null;
          last_name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name: string;
          gender: Database['public']['Enums']['gender_type'];
          group_id: string;
          id?: string;
          image_url?: string | null;
          last_name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string;
          gender?: Database['public']['Enums']['gender_type'];
          group_id?: string;
          id?: string;
          image_url?: string | null;
          last_name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'students_class_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      game_type: 'guess_name' | 'guess_image';
      gender_type: 'male' | 'female' | 'other';
      user_role: 'teacher' | 'student';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;
