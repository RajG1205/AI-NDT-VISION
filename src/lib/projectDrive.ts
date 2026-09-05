import { supabase } from "@/integrations/supabase/client";

export type Project = {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  folder: "source-images" | "inspection-data" | "reports" | "documents";
  name: string;
  type: string;
  size: number;
  createdAt: string;
  storagePath?: string;
};

const BUCKET = "project-files";

function toProject(row: {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFile(row: {
  id: string;
  project_id: string;
  folder: ProjectFile["folder"];
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  storage_path: string;
}): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    folder: row.folder,
    name: row.name,
    type: row.mime_type,
    size: row.size_bytes,
    createdAt: row.created_at,
    storagePath: row.storage_path,
  };
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,code,description,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,code,description,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toProject(data) : null;
}

export async function createProject(
  input: Pick<Project, "name" | "code" | "description">,
): Promise<Project> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("You must be signed in to create a project.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userData.user.id,
      name: input.name,
      code: input.code,
      description: input.description || null,
    })
    .select("id,name,code,description,created_at,updated_at")
    .single();

  if (error) throw new Error(error.message);
  return toProject(data);
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "name" | "code" | "description">>,
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({
      name: patch.name,
      code: patch.code,
      description: patch.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteProject(id: string): Promise<void> {
  const files = await listProjectFiles(id);

  if (files.length) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove(files.map((file) => file.storagePath!).filter(Boolean));

    if (storageError) throw new Error(storageError.message);
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("id,project_id,folder,name,mime_type,size_bytes,created_at,storage_path")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFile);
}

export async function saveProjectFile(
  projectId: string,
  file: File,
  folder: ProjectFile["folder"],
): Promise<ProjectFile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("You must be signed in to upload project files.");
  }

  const userId = userData.user.id;
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension)
    ? `.${extension}`
    : "";

  const storagePath =
    `${userId}/${projectId}/${folder}/${crypto.randomUUID()}${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("project_files")
    .insert({
      project_id: projectId,
      owner_id: userId,
      folder,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    })
    .select("id,project_id,folder,name,mime_type,size_bytes,created_at,storage_path")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error(error.message);
  }

  return toFile(data);
}

export async function getProjectFile(id: string): Promise<ProjectFile & { blob: Blob } | null> {
  const { data: metadata, error } = await supabase
    .from("project_files")
    .select("id,project_id,folder,name,mime_type,size_bytes,created_at,storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!metadata) return null;

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(metadata.storage_path);

  if (downloadError) throw new Error(downloadError.message);

  return {
    ...toFile(metadata),
    blob,
  };
}

export async function deleteProjectFile(id: string): Promise<void> {
  const { data: metadata, error } = await supabase
    .from("project_files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!metadata) return;

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([metadata.storage_path]);

  if (storageError) throw new Error(storageError.message);

  const { error: dbError } = await supabase
    .from("project_files")
    .delete()
    .eq("id", id);

  if (dbError) throw new Error(dbError.message);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
