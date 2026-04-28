export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
      };
      ngos: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          category: string;
          latitude: number | null;
          longitude: number | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          category?: string;
          latitude?: number | null;
          longitude?: number | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          category?: string;
          latitude?: number | null;
          longitude?: number | null;
          verified?: boolean;
          created_at?: string;
        };
      };
      volunteers: {
        Row: {
          id: string;
          user_id: string | null;
          availability_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          availability_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          availability_status?: string;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          latitude: number | null;
          longitude: number | null;
          status: string;
          urgency: string;
          reported_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: string;
          urgency?: string;
          reported_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: string;
          urgency?: string;
          reported_by?: string | null;
          created_at?: string;
        };
      };
      issue_assignments: {
        Row: {
          id: string;
          issue_id: string;
          assigned_type: string;
          assigned_ngo_id: string | null;
          assigned_volunteer_id: string | null;
          status: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          assigned_type?: string;
          assigned_ngo_id?: string | null;
          assigned_volunteer_id?: string | null;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          assigned_type?: string;
          assigned_ngo_id?: string | null;
          assigned_volunteer_id?: string | null;
          assigned_at?: string;
        };
      };
      issue_updates: {
        Row: {
          id: string;
          issue_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          message?: string;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          skills: string[] | null;
          interests: string[] | null;
          latitude: number | null;
          longitude: number | null;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skills?: string[] | null;
          interests?: string[] | null;
          latitude?: number | null;
          longitude?: number | null;
          onboarding_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skills?: string[] | null;
          interests?: string[] | null;
          latitude?: number | null;
          longitude?: number | null;
          onboarding_completed?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      [key: string]: any;
    };
  };
}
