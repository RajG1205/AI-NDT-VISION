import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileArchive,
  FileImage,
  FileText,
  FolderOpen,
  HardDrive,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteProjectFile,
  formatBytes,
  getProject,
  listProjectFiles,
  listProjects,
  saveProjectFile,
  type ProjectFile,
  type Project,
} from "@/lib/projectDrive";

const folders = [
  { id: "source-images", label: "Source Images", icon: FileImage },
  { id: "inspection-data", label: "Inspection Data", icon: FileArchive },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
] as const;

export const Route = createFileRoute("/_authenticated/drive")({
  validateSearch: z.object({ project: z.string().optional() }),
  component: DrivePage,
  head: () => ({
    meta: [
      { title: "Project Drive — AI-NDT Vision" },
      { name: "description", content: "Private project workspace for NDT images, inspection data, reports and documents." },
    ],
  }),
});

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <FileImage className="size-5 text-primary" aria-hidden />;
  if (type.includes("pdf") || type.includes("text")) return <FileText className="size-5 text-primary" aria-hidden />;
  return <FileArchive className="size-5 text-primary" aria-hidden />;
}

function DrivePage() {
  const { project: requestedProject } = Route.useSearch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(requestedProject ?? "");
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [folder, setFolder] = useState<ProjectFile["folder"]>("source-images");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadError(null);
        const items = await listProjects();
        if (!active) return;
        setProjects(items);
        setProjectId((current) => current || requestedProject || items[0]?.id || "");
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Unable to load projects.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [requestedProject]);

  useEffect(() => {
    if (requestedProject && requestedProject !== projectId) setProjectId(requestedProject);
  }, [requestedProject, projectId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!projectId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    Promise.all([
      getProject(projectId),
      listProjectFiles(projectId),
    ])
      .then(([item, items]) => {
        if (!active) return;
        setProject(item);
        setFiles(items);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Unable to load project files.");
          setProject(null);
          setFiles([]);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [projectId]);

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((file) =>
      file.folder === folder && (!q || file.name.toLowerCase().includes(q)),
    );
  }, [files, folder, query]);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  async function upload(selected: FileList | File[]) {
    if (!projectId || !selected.length) return;
    setUploading(true);
    try {
      const added: ProjectFile[] = [];
      for (const file of Array.from(selected)) {
        added.push(await saveProjectFile(projectId, file, folder));
      }
      setFiles((current) => [...added, ...current]);
    } finally {
      setUploading(false);
    }
  }

  async function remove(file: ProjectFile) {
    await deleteProjectFile(file.id);
    setFiles((current) => current.filter((item) => item.id !== file.id));
  }

  async function download(file: ProjectFile) {
    const stored = await import("@/lib/projectDrive").then((module) => module.getProjectFile(file.id));
    if (!stored?.blob) return;
    const url = URL.createObjectURL(stored.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = stored.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <HardDrive className="mx-auto size-10 text-primary" />
        <h1 className="mt-5 text-2xl font-semibold">Your project drive</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a project first, then use its private workspace to organize inspection data.</p>
        <Button asChild className="mt-6"><Link to="/projects"><Plus className="size-4" /> Create project</Link></Button>
      </div>
    );
  }

  return (
    <>
      {loadError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="mb-5">
        <Link to="/projects" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" /> Projects
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={`${project.code} · Project Drive`}
        action={
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Select project"
          >
            {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="panel p-3">
          <div className="px-2 pb-3">
            <p className="mono-label">Project storage</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-2xl font-semibold">{formatBytes(totalSize)}</span>
              <HardDrive className="size-5 text-primary" aria-hidden />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[6%] rounded-full bg-primary shadow-[0_0_18px_var(--cyan-glow)]" />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Local project storage · ready for cloud sync</p>
          </div>

          <div className="space-y-1">
            {folders.map((item) => {
              const Icon = item.icon;
              const active = folder === item.id;
              const count = files.filter((file) => file.folder === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFolder(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-primary/10 text-foreground ring-1 ring-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  <span className="font-mono text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="panel-elevated overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
              <div>
                <p className="font-semibold">{folders.find((item) => item.id === folder)?.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{visibleFiles.length} files</p>
              </div>
              <div className="relative ml-auto min-w-[220px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files..." className="pl-9" />
              </div>
              <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
                <UploadCloud className="size-4" /> {uploading ? "Uploading…" : "Upload"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) void upload(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </div>

            <div
              className="m-4 rounded-xl border border-dashed border-border bg-background/30 p-7 text-center transition-colors hover:border-primary/40"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void upload(event.dataTransfer.files);
              }}
            >
              <UploadCloud className="mx-auto size-7 text-primary" aria-hidden />
              <p className="mt-3 text-sm font-medium">Drop files into {folders.find((item) => item.id === folder)?.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Files stay in this browser until Supabase Storage is connected.</p>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading project files…</p>
            ) : visibleFiles.length === 0 ? (
              <div className="p-10 text-center">
                <FolderOpen className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">This folder is empty</p>
                <p className="mt-1 text-xs text-muted-foreground">Upload source images, reports or project documents to build this workspace.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/10"><FileIcon type={file.type} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(file.size)} · {new Date(file.createdAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => void download(file)} aria-label={`Download ${file.name}`}><Download className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => void remove(file)} aria-label={`Delete ${file.name}`}><Trash2 className="size-4 text-destructive" /></Button>
                    <MoreHorizontal className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
