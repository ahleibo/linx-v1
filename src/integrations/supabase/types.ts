export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collection_posts: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          post_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          post_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          status: string | null
          tweet_data: Json | null
          twitter_url: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          tweet_data?: Json | null
          twitter_url: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          tweet_data?: Json | null
          twitter_url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_topics: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          is_manual: boolean | null
          post_id: string
          topic_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          post_id: string
          topic_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          post_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_topics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_username: string
          content: string
          context_annotations: Json | null
          conversation_id: string | null
          created_at: string
          entities: Json | null
          id: string
          import_source: string | null
          import_status: string | null
          in_reply_to_user_id: string | null
          lang: string | null
          likes_count: number | null
          media_urls: string[] | null
          possibly_sensitive: boolean | null
          public_metrics: Json | null
          referenced_tweets: Json | null
          replies_count: number | null
          retweets_count: number | null
          saved_at: string
          source: string | null
          tweet_type: string | null
          twitter_author_id: string | null
          user_id: string
          x_post_id: string | null
          x_url: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          author_username: string
          content: string
          context_annotations?: Json | null
          conversation_id?: string | null
          created_at: string
          entities?: Json | null
          id?: string
          import_source?: string | null
          import_status?: string | null
          in_reply_to_user_id?: string | null
          lang?: string | null
          likes_count?: number | null
          media_urls?: string[] | null
          possibly_sensitive?: boolean | null
          public_metrics?: Json | null
          referenced_tweets?: Json | null
          replies_count?: number | null
          retweets_count?: number | null
          saved_at?: string
          source?: string | null
          tweet_type?: string | null
          twitter_author_id?: string | null
          user_id: string
          x_post_id?: string | null
          x_url?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_username?: string
          content?: string
          context_annotations?: Json | null
          conversation_id?: string | null
          created_at?: string
          entities?: Json | null
          id?: string
          import_source?: string | null
          import_status?: string | null
          in_reply_to_user_id?: string | null
          lang?: string | null
          likes_count?: number | null
          media_urls?: string[] | null
          possibly_sensitive?: boolean | null
          public_metrics?: Json | null
          referenced_tweets?: Json | null
          replies_count?: number | null
          retweets_count?: number | null
          saved_at?: string
          source?: string | null
          tweet_type?: string | null
          twitter_author_id?: string | null
          user_id?: string
          x_post_id?: string | null
          x_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_twitter_author_id_fkey"
            columns: ["twitter_author_id"]
            isOneToOne: false
            referencedRelation: "twitter_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tweet_hashtags: {
        Row: {
          created_at: string | null
          end_pos: number | null
          id: string
          post_id: string | null
          start_pos: number | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          end_pos?: number | null
          id?: string
          post_id?: string | null
          start_pos?: number | null
          tag: string
        }
        Update: {
          created_at?: string | null
          end_pos?: number | null
          id?: string
          post_id?: string | null
          start_pos?: number | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweet_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      tweet_media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          duration_ms: number | null
          height: number | null
          id: string
          media_key: string | null
          post_id: string | null
          preview_image_url: string | null
          public_metrics: Json | null
          type: string
          url: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          duration_ms?: number | null
          height?: number | null
          id?: string
          media_key?: string | null
          post_id?: string | null
          preview_image_url?: string | null
          public_metrics?: Json | null
          type: string
          url?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          duration_ms?: number | null
          height?: number | null
          id?: string
          media_key?: string | null
          post_id?: string | null
          preview_image_url?: string | null
          public_metrics?: Json | null
          type?: string
          url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tweet_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      tweet_mentions: {
        Row: {
          created_at: string | null
          end_pos: number | null
          id: string
          mentioned_user_id: string | null
          post_id: string | null
          start_pos: number | null
          username: string
        }
        Insert: {
          created_at?: string | null
          end_pos?: number | null
          id?: string
          mentioned_user_id?: string | null
          post_id?: string | null
          start_pos?: number | null
          username: string
        }
        Update: {
          created_at?: string | null
          end_pos?: number | null
          id?: string
          mentioned_user_id?: string | null
          post_id?: string | null
          start_pos?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweet_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      tweet_urls: {
        Row: {
          created_at: string | null
          description: string | null
          display_url: string | null
          end_pos: number | null
          expanded_url: string | null
          id: string
          post_id: string | null
          start_pos: number | null
          title: string | null
          unwound_url: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_url?: string | null
          end_pos?: number | null
          expanded_url?: string | null
          id?: string
          post_id?: string | null
          start_pos?: number | null
          title?: string | null
          unwound_url?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_url?: string | null
          end_pos?: number | null
          expanded_url?: string | null
          id?: string
          post_id?: string | null
          start_pos?: number | null
          title?: string | null
          unwound_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweet_urls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      twitter_authors: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          profile_image_url: string | null
          public_metrics: Json | null
          twitter_id: string
          updated_at: string | null
          username: string
          verified: boolean | null
          verified_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          profile_image_url?: string | null
          public_metrics?: Json | null
          twitter_id: string
          updated_at?: string | null
          username: string
          verified?: boolean | null
          verified_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          profile_image_url?: string | null
          public_metrics?: Json | null
          twitter_id?: string
          updated_at?: string | null
          username?: string
          verified?: boolean | null
          verified_type?: string | null
        }
        Relationships: []
      }
      twitter_connections: {
        Row: {
          access_token: string
          connected_at: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          followed_at: string
          id: string
          user_id: string
          x_user_id: string | null
          x_username: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          followed_at?: string
          id?: string
          user_id: string
          x_user_id?: string | null
          x_username: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          followed_at?: string
          id?: string
          user_id?: string
          x_user_id?: string | null
          x_username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_complete_tweet_data: {
        Args: { tweet_id: string }
        Returns: Json
      }
      update_tweet_metrics: {
        Args: { tweet_id: string; new_metrics: Json }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
