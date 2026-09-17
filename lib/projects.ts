import { supabase } from "./supabaseClient";

export type Character = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
};

export type Poster = {
  id: string;
  characterIds: string[];
  description: string;
  imageUrl: string;
  createdAt: number;
};

export type Video = {
  id: string;
  characterIds: string[];
  prompt: string;
  videoUrl?: string;
  createdAt: number;
};

export type Project = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  vibe: string;
  instructions: string;
  characters: Character[];
  posters: Poster[];
  videos: Video[];
  currentStep: "summary" | "characters" | "poster" | "video";
  createdAt: number;
  updatedAt: number;
};

const LOCAL_STORAGE_KEY = "dark_romance_projects_v1";
const MIGRATION_FLAG_KEY = "dark_romance_projects_migrated_v1";

export function createEmptyProject(): Project {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "",
    summary: "",
    genre: "",
    vibe: "",
    instructions: "",
    characters: [],
    posters: [],
    videos: [],
    currentStep: "summary",
    createdAt: now,
    updatedAt: now,
  };
}

// Ancien stockage local (avant la migration vers Supabase). On ne s'en sert
// plus que pour récupérer une fois les projets déjà créés par l'utilisatrice
// avant ce correctif, afin de ne pas perdre son travail.
function readLegacyLocalProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

/**
 * Migre une seule fois (par navigateur) les projets stockés en localStorage
 * vers Supabase, pour l'utilisateur connecté. Sans cette étape, tout ce qui
 * avait été rempli avant le passage à un stockage serveur serait perdu.
 */
async function migrateLegacyProjectsIfNeeded(userId: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return;

  const legacyProjects = readLegacyLocalProjects();

  if (legacyProjects.length > 0) {
    const rows = legacyProjects.map((project) => ({
      id: project.id,
      user_id: userId,
      data: project,
      created_at: new Date(project.createdAt || Date.now()).toISOString(),
      updated_at: new Date(project.updatedAt || Date.now()).toISOString(),
    }));

    // On ignore les doublons éventuels (upsert) pour rendre l'opération sûre
    // même si elle tournait deux fois.
    await supabase.from("dark_romance_projects").upsert(rows, { onConflict: "id" });
  }

  localStorage.setItem(MIGRATION_FLAG_KEY, "1");
}

export async function fetchProjects(): Promise<Project[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  if (!userId) return [];

  await migrateLegacyProjectsIfNeeded(userId);

  const { data, error } = await supabase
    .from("dark_romance_projects")
    .select("id, data, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => row.data as Project);
}

export async function saveProject(project: Project): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  if (!userId) return;

  const updated: Project = { ...project, updatedAt: Date.now() };

  await supabase.from("dark_romance_projects").upsert(
    {
      id: updated.id,
      user_id: userId,
      data: updated,
      updated_at: new Date(updated.updatedAt).toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.from("dark_romance_projects").delete().eq("id", id);
}
