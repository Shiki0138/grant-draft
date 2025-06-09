export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      grant_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          organization: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      grant_documents: {
        Row: {
          id: string
          user_id: string
          role: 'guideline' | 'case' | 'application'
          content: string
          embedding: number[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'guideline' | 'case' | 'application'
          content: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'guideline' | 'case' | 'application'
          content?: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
      }
      grant_drafts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: Json
          guideline_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: Json
          guideline_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: Json
          guideline_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_grant_documents: {
        Args: {
          query_embedding: number[]
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}