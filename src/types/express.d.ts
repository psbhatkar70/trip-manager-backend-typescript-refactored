import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string;
  role: "user" | "owner";
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      profile?: Profile;
    }
  }
}

export {};

