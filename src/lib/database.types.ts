// Hand-authored to match supabase/migrations/*.sql. A real Supabase project
// now exists — prefer regenerating this file with the Supabase CLI over
// hand-editing it further, once the CLI is set up and authenticated:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type PlatformEnum = "tiktok" | "instagram" | "youtube_shorts" | "x";
export type PayoutTypeEnum = "flat" | "cpm" | "retainer";
export type AccountRequirementEnum = "new_ok" | "established_required";
export type JobStatusEnum = "open" | "filled" | "closed";
export type ApplicantStatusEnum = "pending" | "approved" | "rejected";
export type AssignmentStatusEnum = "active" | "submitted" | "paid" | "disputed";
export type ApplicationStatusEnum =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn";
export type LeadStatusEnum = "new" | "invited" | "joined" | "rejected";

export interface Database {
  public: {
    Tables: {
      niches: {
        Row: {
          id: string;
          slug: string;
          label: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["niches"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          description: string;
          platform: PlatformEnum;
          niche_id: string;
          payout_type: PayoutTypeEnum;
          payout_amount: number;
          payout_notes: string | null;
          account_requirement: AccountRequirementEnum;
          status: JobStatusEnum;
          notion_sop_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          platform: PlatformEnum;
          niche_id: string;
          payout_type: PayoutTypeEnum;
          payout_amount: number;
          payout_notes?: string | null;
          account_requirement?: AccountRequirementEnum;
          status?: JobStatusEnum;
          notion_sop_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "jobs_niche_id_fkey";
            columns: ["niche_id"];
            isOneToOne: false;
            referencedRelation: "niches";
            referencedColumns: ["id"];
          },
        ];
      };
      applicants: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          handle: string;
          platform: PlatformEnum;
          niche_interest_id: string | null;
          availability_notes: string | null;
          skills: string[];
          preferred_pay_min: number | null;
          preferred_pay_max: number | null;
          bio: string | null;
          portfolio_url: string | null;
          date_of_birth: string | null;
          email_verified: boolean;
          status: ApplicantStatusEnum;
          marketing_opt_in: boolean;
          weekly_digest_opt_in: boolean;
          tos_accepted_at: string | null;
          created_at: string;
          username: string | null;
          location: string | null;
          languages: string[];
          education: string | null;
          education_level: string | null;
          years_creating: number | null;
          experience_summary: string | null;
          brands_worked_with: string[];
          content_types: string[];
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          handle: string;
          platform: PlatformEnum;
          niche_interest_id?: string | null;
          availability_notes?: string | null;
          skills?: string[];
          preferred_pay_min?: number | null;
          preferred_pay_max?: number | null;
          bio?: string | null;
          portfolio_url?: string | null;
          date_of_birth?: string | null;
          email_verified?: boolean;
          status?: ApplicantStatusEnum;
          marketing_opt_in?: boolean;
          weekly_digest_opt_in?: boolean;
          tos_accepted_at?: string | null;
          created_at?: string;
          username?: string | null;
          location?: string | null;
          languages?: string[];
          education?: string | null;
          education_level?: string | null;
          years_creating?: number | null;
          experience_summary?: string | null;
          brands_worked_with?: string[];
          content_types?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["applicants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "applicants_niche_interest_id_fkey";
            columns: ["niche_interest_id"];
            isOneToOne: false;
            referencedRelation: "niches";
            referencedColumns: ["id"];
          },
        ];
      };
      assignments: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          applicant_payout_amount: number;
          status: AssignmentStatusEnum;
          proof_url: string | null;
          assigned_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          applicant_payout_amount: number;
          status?: AssignmentStatusEnum;
          proof_url?: string | null;
          assigned_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "assignments_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          id: string;
          assignment_id: string;
          gross_amount: number;
          applicant_payout_amount: number;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          gross_amount: number;
          applicant_payout_amount: number;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payouts_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: true;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
        ];
      };
      applicant_handles: {
        Row: {
          id: string;
          applicant_id: string;
          platform: PlatformEnum;
          handle: string;
          profile_url: string | null;
          follower_count: number | null;
          is_primary: boolean;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          applicant_id: string;
          platform: PlatformEnum;
          handle: string;
          profile_url?: string | null;
          follower_count?: number | null;
          is_primary?: boolean;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["applicant_handles"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "applicant_handles_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          status: ApplicationStatusEnum;
          cover_note: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          status?: ApplicationStatusEnum;
          cover_note?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          handles: string;
          brands_worked_with: string | null;
          sample_video_path: string | null;
          comments: string | null;
          status: LeadStatusEnum;
          referred_by: string | null;
          applicant_id: string | null;
          invited_at: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          handles: string;
          brands_worked_with?: string | null;
          sample_video_path?: string | null;
          comments?: string | null;
          status?: LeadStatusEnum;
          referred_by?: string | null;
          applicant_id?: string | null;
          invited_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leads_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_emails: {
        Row: { email: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
      // From 0006_off_camera_profiles.sql — the training-domain identity
      // (course progress + payment state), separate from `applicants`
      // (the recruiting-domain identity). See that migration's header
      // comment for why they're not the same table.
      profiles: {
        Row: {
          user_id: string;
          email: string;
          display_name: string;
          completed_lessons: string[];
          paid: boolean;
          paid_at: string | null;
          payment_provider: "dodo" | "nowpayments" | null;
          payment_reference: string | null;
          refunded_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name: string;
          completed_lessons?: string[];
          paid?: boolean;
          paid_at?: string | null;
          payment_provider?: "dodo" | "nowpayments" | null;
          payment_reference?: string | null;
          refunded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    // `{ [_ in never]: never }` rather than `Record<string, never>` — the
    // latter doesn't satisfy supabase-js's GenericSchema constraint, which
    // silently degrades every query result to `never`.
    Views: { [_ in never]: never };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      platform_enum: PlatformEnum;
      payout_type_enum: PayoutTypeEnum;
      account_requirement_enum: AccountRequirementEnum;
      job_status_enum: JobStatusEnum;
      applicant_status_enum: ApplicantStatusEnum;
      assignment_status_enum: AssignmentStatusEnum;
      application_status_enum: ApplicationStatusEnum;
      lead_status_enum: LeadStatusEnum;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Niche = Database["public"]["Tables"]["niches"]["Row"];
export type Applicant = Database["public"]["Tables"]["applicants"]["Row"];
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];
export type ApplicantHandle =
  Database["public"]["Tables"]["applicant_handles"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
