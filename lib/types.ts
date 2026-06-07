export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type PostInput = Omit<Post, "id" | "created_at" | "updated_at">;

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  cover_image: string | null;
  tech_stack: string[] | null;
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<Project, "id" | "created_at" | "updated_at">;

export type ContactSubmission = {
  id: string;
  type: "meeting" | "contact";
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  created_at: string;
};

export type SubmissionType = ContactSubmission["type"];
