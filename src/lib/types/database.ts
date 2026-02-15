export type UserRole = "client" | "contractor" | "admin";
export type SubscriptionTier = "basic" | "pro" | "elite";
export type ProjectStatus = "draft" | "bidding" | "active" | "completed" | "disputed";
export type MilestoneStatus =
  | "waiting_for_funds"
  | "funded"
  | "work_in_progress"
  | "verification_pending"
  | "released";
export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type ServiceListingStatus = "active" | "paused";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type NotificationType =
  | "bid_received"
  | "bid_accepted"
  | "bid_rejected"
  | "milestone_funded"
  | "milestone_started"
  | "milestone_proof"
  | "milestone_released"
  | "message_received"
  | "project_completed"
  | "review_received"
  | "dispute_opened";

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
          latitude: number | null;
          longitude: number | null;
          hype_video_playback_id: string | null;
          hype_video_asset_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string;
          trial_ends_at: string;
          current_period_end: string | null;
          reputation_score: number;
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
          latitude?: number | null;
          longitude?: number | null;
          hype_video_playback_id?: string | null;
          hype_video_asset_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string;
          current_period_end?: string | null;
          reputation_score?: number;
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
          latitude?: number | null;
          longitude?: number | null;
          hype_video_playback_id?: string | null;
          hype_video_asset_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string;
          current_period_end?: string | null;
          reputation_score?: number;
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
          is_public: boolean;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
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
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
        };
        Update: {
          client_id?: string;
          contractor_id?: string | null;
          title?: string;
          description?: string | null;
          total_budget?: number;
          status?: ProjectStatus;
          has_funded_deposit?: boolean;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
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
          check_in_lat: number | null;
          check_in_lng: number | null;
          check_in_on_site: boolean | null;
          checked_in_at: string | null;
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
          check_in_lat?: number | null;
          check_in_lng?: number | null;
          check_in_on_site?: boolean | null;
          checked_in_at?: string | null;
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
      conversations: {
        Row: {
          id: string;
          client_id: string;
          contractor_id: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          contractor_id: string;
          last_message_at?: string;
        };
        Update: {
          last_message_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          project_id: string;
          contractor_id: string;
          amount: number;
          message: string | null;
          status: BidStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          contractor_id: string;
          amount: number;
          message?: string | null;
          status?: BidStatus;
        };
        Update: {
          amount?: number;
          message?: string | null;
          status?: BidStatus;
        };
      };
      service_listings: {
        Row: {
          id: string;
          contractor_id: string;
          title: string;
          description: string | null;
          category: string;
          starting_price: number;
          status: ServiceListingStatus;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          title: string;
          description?: string | null;
          category: string;
          starting_price: number;
          status?: ServiceListingStatus;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          starting_price?: number;
          status?: ServiceListingStatus;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          filtered_content: string | null;
          is_flagged: boolean;
          flag_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
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
      disputes: {
        Row: {
          id: string;
          project_id: string;
          opened_by: string;
          reason: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          opened_by: string;
          reason: string;
          resolved_at?: string | null;
        };
        Update: {
          resolved_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          project_id: string;
          client_id: string;
          contractor_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          client_id: string;
          contractor_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          action_url: string | null;
          data: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          action_url?: string | null;
          data?: Record<string, unknown>;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          bid_received: boolean;
          bid_accepted: boolean;
          bid_rejected: boolean;
          milestone_funded: boolean;
          milestone_started: boolean;
          milestone_proof: boolean;
          milestone_released: boolean;
          message_received: boolean;
          project_completed: boolean;
          review_received: boolean;
          dispute_opened: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bid_received?: boolean;
          bid_accepted?: boolean;
          bid_rejected?: boolean;
          milestone_funded?: boolean;
          milestone_started?: boolean;
          milestone_proof?: boolean;
          milestone_released?: boolean;
          message_received?: boolean;
          project_completed?: boolean;
          review_received?: boolean;
          dispute_opened?: boolean;
          email_enabled?: boolean;
        };
        Update: {
          bid_received?: boolean;
          bid_accepted?: boolean;
          bid_rejected?: boolean;
          milestone_funded?: boolean;
          milestone_started?: boolean;
          milestone_proof?: boolean;
          milestone_released?: boolean;
          message_received?: boolean;
          project_completed?: boolean;
          review_received?: boolean;
          dispute_opened?: boolean;
          email_enabled?: boolean;
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
      find_nearby_contractors: {
        Args: {
          user_lat: number;
          user_long: number;
          search_radius_meters?: number;
        };
        Returns: {
          id: string;
          business_name: string;
          dist_meters: number;
          is_active_nearby: boolean;
        }[];
      };
      find_nearby_active_projects: {
        Args: {
          user_lat: number;
          user_long: number;
          search_radius_meters?: number;
        };
        Returns: {
          id: string;
          title: string;
          dist_meters: number;
          contractor_id: string;
        }[];
      };
      check_on_site: {
        Args: {
          contractor_lat: number;
          contractor_long: number;
          p_project_id: string;
        };
        Returns: boolean;
      };
      find_nearby_bidding_projects: {
        Args: {
          user_lat: number;
          user_long: number;
          search_radius_meters?: number;
        };
        Returns: {
          id: string;
          title: string;
          total_budget: number;
          dist_meters: number;
          client_id: string;
          created_at: string;
        }[];
      };
      recalculate_reputation: {
        Args: {
          p_contractor_id: string;
        };
        Returns: number;
      };
      get_contractor_rating: {
        Args: {
          p_contractor_id: string;
        };
        Returns: {
          avg_rating: number;
          review_count: number;
        }[];
      };
      create_notification: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_body: string;
          p_action_url?: string;
          p_data?: Record<string, unknown>;
        };
        Returns: string | null;
      };
    };
    Enums: {
      user_role: UserRole;
      subscription_tier: SubscriptionTier;
      project_status: ProjectStatus;
      milestone_status: MilestoneStatus;
      bid_status: BidStatus;
      service_listing_status: ServiceListingStatus;
    };
  };
}
