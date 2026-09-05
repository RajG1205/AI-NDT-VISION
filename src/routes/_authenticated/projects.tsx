import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Plus, Search, ArrowUpRight, HardDrive, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject, listProjects, type Project } from "@/lib/projectDrive";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — AI-NDT Vision" },
      { name: "description", content: "Organize NDT inspections, source images, reports and project documents." },
    ],
  }),
});

function NewProjectDialog({ onCreated }: { onCreated: (project: Project) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const project = await createProject({
      name: name.trim(),
      code: code.trim() || `NDT-${new Date().getFullYear()}`,
      description: description.trim(),
    });

    onCreated(project);
    setName("");
    setCode("");
    setDescription("");
  }

  return (
    <form onSubmit={submit} className="panel-elevated grid gap-3 p-4 lg:grid-cols-[1.4fr_0.7fr_1.5fr_auto]">
      <div>
        <label className="mono-label" htmlFor="project-name">Project name</label>
        <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Turbine Weld Integrity" className="mt-2" />
      </div>
      <div>
        <label className="mono-label" htmlFor="project-code">Project code</label>
        <Input id="project-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="NDT-2026-01" className="mt-2" />
      </div>
      <div>
        <label className="mono-label" htmlFor="project-description">Description</label>
        <Input id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Component, site or inspection campaign" className="mt-2" />
      </div>
      <Button type="submit" className="self-end">
        <Plus className="size-4" aria-hidden /> Create project
      </Button>
    </form>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/drive"
      search={{ project: project.id }}
      className="group panel-elevated block overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_28px_var(--cyan-glow)]">
          <FolderKanban className="size-5 text-primary" aria-hidden />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>
      <div className="mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">{project.code}</p>
        <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {project.description || "Inspection workspace ready for source images, reports and documents."}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><HardDrive className="size-3.5" /> Project Drive</span>
        <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshProjects() {
    try {
      setLoading(true);
      setError(null);
      setProjects(await listProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshProjects();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.code} ${project.description}`.toLowerCase().includes(q),
    );
  }, [projects, query]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Create an isolated workspace for each inspection campaign or asset."
        action={
          <Button asChild variant="outline">
            <Link to="/drive"><HardDrive className="size-4" /> Storage drive</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." className="pl-9" aria-label="Search projects" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--cyan-glow)]" />
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <NewProjectDialog
        onCreated={() => {
          void refreshProjects();
        }}
      />

      {loading ? (
        <div className="mt-5 rounded-xl border border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          Loading projects…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">{projects.length ? "No matching projects" : "Create your first project"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Keep every inspection campaign together with its source images, AI results, reports and supporting documents.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </>
  );
}
