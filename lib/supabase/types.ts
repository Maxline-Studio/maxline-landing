// Types Supabase générés automatiquement depuis le schema.
// Re-générer avec : `npm run gen:types` (à ajouter) ou via le MCP Supabase.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          anniversary_date: string | null;
          avatar_url: string | null;
          created_at: string;
          credits_minutes: number;
          delete_after_days: number;
          display_name: string | null;
          email: string;
          email_notifications: boolean;
          id: string;
          language: string;
          lifetime_minutes_used: number;
          plan: string;
          quota_minutes_total: number;
          quota_minutes_used: number;
          quota_reset_at: string | null;
          rank: string;
          referral_code: string | null;
          referred_by: string | null;
          streak_anchor_date: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_streak_months: number;
          updated_at: string;
        };
        Insert: {
          anniversary_date?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          credits_minutes?: number;
          delete_after_days?: number;
          display_name?: string | null;
          email: string;
          email_notifications?: boolean;
          id: string;
          language?: string;
          lifetime_minutes_used?: number;
          plan?: string;
          quota_minutes_total?: number;
          quota_minutes_used?: number;
          quota_reset_at?: string | null;
          rank?: string;
          referral_code?: string | null;
          referred_by?: string | null;
          streak_anchor_date?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_streak_months?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      videos: {
        Row: {
          delete_at: string | null;
          duration_minutes: number | null;
          duration_seconds: number | null;
          error_message: string | null;
          format: string | null;
          id: string;
          original_filename: string;
          processing_completed_at: string | null;
          processing_started_at: string | null;
          processing_steps: Json;
          resolution: string | null;
          retry_count: number;
          size_bytes: number | null;
          status: string;
          storage_key_audio: string | null;
          storage_key_burned: string | null;
          storage_key_source: string | null;
          storage_key_srt: string | null;
          storage_key_vtt: string | null;
          subtitle_style: Json | null;
          transcription_source: Json | null;
          transcription_target: Json | null;
          source_lang: string;
          target_lang: string;
          uploaded_at: string;
          user_edited: boolean;
          user_id: string;
          burn_status: string;
          burn_error: string | null;
          burn_requested_at: string | null;
        };
        Insert: {
          delete_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          format?: string | null;
          id?: string;
          original_filename: string;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          processing_steps?: Json;
          resolution?: string | null;
          retry_count?: number;
          size_bytes?: number | null;
          status?: string;
          storage_key_audio?: string | null;
          storage_key_burned?: string | null;
          storage_key_source?: string | null;
          storage_key_srt?: string | null;
          storage_key_vtt?: string | null;
          subtitle_style?: Json | null;
          transcription_source?: Json | null;
          transcription_target?: Json | null;
          source_lang?: string;
          target_lang?: string;
          uploaded_at?: string;
          user_edited?: boolean;
          user_id: string;
          burn_status?: string;
          burn_error?: string | null;
          burn_requested_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [];
      };
      rewards_ledger: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          minutes_bonus: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          minutes_bonus: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rewards_ledger"]["Insert"]>;
        Relationships: [];
      };
      rank_history: {
        Row: {
          id: string;
          user_id: string;
          from_rank: string;
          to_rank: string;
          triggered_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_rank: string;
          to_rank: string;
          triggered_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rank_history"]["Insert"]>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_id: string | null;
          invitee_email: string | null;
          status: string;
          bonus_credited: boolean;
          created_at: string;
          validated_at: string | null;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_id?: string | null;
          invitee_email?: string | null;
          status?: string;
          bonus_credited?: boolean;
          created_at?: string;
          validated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
        Relationships: [];
      };
      waitlist: {
        Row: {
          email: string;
          id: string;
          ip_hash: string | null;
          notes: string | null;
          notified_at: string | null;
          source: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          email: string;
          id?: string;
          ip_hash?: string | null;
          notes?: string | null;
          notified_at?: string | null;
          source?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["waitlist"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_user_minutes: {
        Args: { minutes_to_use: number; p_user_id: string };
        Returns: boolean;
      };
      get_user_minutes_available: {
        Args: { p_user_id: string };
        Returns: number;
      };
      claim_referral: {
        Args: { p_code: string };
        Returns: Json;
      };
      process_referral_conversion: {
        Args: { p_invitee_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Helpers raccourcis pour l'app
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
export type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];

export type RewardLedgerRow = Database["public"]["Tables"]["rewards_ledger"]["Row"];
export type RankHistoryRow = Database["public"]["Tables"]["rank_history"]["Row"];
export type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

export type Rank = "apprenti" | "correcteur" | "editeur_en_chef" | "maitre_doeuvre";
export type Plan = "free" | "starter" | "plus" | "credits";
export type VideoStatus =
  | "queued"
  | "extracting_audio"
  | "transcribing"
  | "translating"
  | "aligning"
  | "generating_subtitles"
  | "burning_in"
  | "done"
  | "failed"
  | "cancelled";
