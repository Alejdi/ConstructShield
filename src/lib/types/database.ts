export type UserRole = "client" | "contractor";
export type SubscriptionTier = "basic" | "pro" | "elite";
export type ProjectStatus = "bidding" | "active" | "completed" | "disputed";
export type MilestoneStatus =
  | "waiting_for_funds"
  | "funded"
  | "work_in_progress"
  | "verification_pending"
  | "released";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
        };
      };
      contractors: {
        Row: {
          id: string;
          business_name: string;
          license_number: string | null;
          verified: boolean;
          subscription_tier: SubscriptionTier;
          stripe_connect_account_id: string | null;
          bio: string | null;
          specialties: string[] | null;
          service_area: string | null;
          hype_video_playback_id: string | null;
          hype_video_asset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_name?: string;
          license_number?: string | null;
          verified?: boolean;
          subscription_tier?: SubscriptionTier;
          stripe_connect_account_id?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          service_area?: string | null;
          hype_video_playback_id?: string | null;
          hype_video_asset_id?: string | null;
        };
        Update: {
          business_name?: string;
          license_number?: string | null;
          verified?: boolean;
          subscription_tier?: SubscriptionTier;
          stripe_connect_account_id?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          service_area?: string | null;
          hype_video_playback_id?: string | null;
          hype_video_asset_id?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          contractor_id: string | null;
          title: string;
          description: string | null;
          total_budget: number;
          status: ProjectStatus;
          has_funded_deposit: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          contractor_id?: string | null;
          title: string;
          description?: string | null;
          total_budget?: number;
          status?: ProjectStatus;
          has_funded_deposit?: boolean;
        };
        Update: {
          client_id?: string;
          contractor_id?: string | null;
          title?: string;
          description?: string | null;
          total_budget?: number;
          status?: ProjectStatus;
          has_funded_deposit?: boolean;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          amount: number;
          order_index: number;
          status: MilestoneStatus;
          proof_video_url: string | null;
          proof_video_asset_id: string | null;
          stripe_payment_intent_id: string | null;
          funded_at: string | null;
          released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          amount?: number;
          order_index?: number;
          status?: MilestoneStatus;
          proof_video_url?: string | null;
          proof_video_asset_id?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          amount?: number;
          order_index?: number;
          status?: MilestoneStatus;
          proof_video_url?: string | null;
          proof_video_asset_id?: string | null;
          stripe_payment_intent_id?: string | null;
          funded_at?: string | null;
          released_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          sender_id: string;
          content: string;
          filtered_content: string | null;
          is_flagged: boolean;
          flag_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender_id: string;
          content: string;
          filtered_content?: string | null;
          is_flagged?: boolean;
          flag_reason?: string | null;
        };
        Update: {
          content?: string;
          filtered_content?: string | null;
          is_flagged?: boolean;
          flag_reason?: string | null;
        };
      };
    };
    Functions: {
      transition_milestone_status: {
        Args: {
          p_milestone_id: string;
          p_new_status: MilestoneStatus;
          p_user_id: string;
        };
        Returns: Database["public"]["Tables"]["milestones"]["Row"];
      };
      calculate_platform_fee: {
        Args: { amount: number };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      subscription_tier: SubscriptionTier;
      project_status: ProjectStatus;
      milestone_status: MilestoneStatus;
    };
  };
}
