import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Eye, GitCompareArrows } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { fetchInspections, deleteInspection, highestSeverity } from "@/lib/inspections";
import { SeverityBadge } from "@/components/inspection/SeverityBadge";
import { useState } from "react";
export const Route = createFileRoute("/_authenticated/history")({ component: History });
function History() {
  const [selected, setSelected] = useState<string[]>([]);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["inspections"], queryFn: fetchInspections });
  const del = useMutation({
    mutationFn: deleteInspection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inspections"] }),
  });
  function toggleCompare(id: string) {
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : current.length < 2 ? [...current, id] : [current[1]!, id]);
  }

  function compare() {
    sessionStorage.setItem("ndt-compare", JSON.stringify(selected));
    window.location.href = "/compare";
  }

  return (
    <>
      <PageHeader
        title="Inspection history"
        description="Your stored inspection records and findings."
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-primary/5 p-3">
        <p className="text-sm text-muted-foreground">Select two inspections to compare their model outputs.</p>
        <Button size="sm" disabled={selected.length !== 2} onClick={compare}><GitCompareArrows className="mr-2 size-4" />Compare ({selected.length}/2)</Button>
      </div>
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">File</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Findings</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((i) => (
                <tr key={i.id} className={`border-b border-border last:border-0 ${selected.includes(i.id) ? "bg-primary/5" : ""}`}>
                  <td className="p-3 text-muted-foreground">
                    {new Date(i.created_at).toLocaleString()}
                  </td>
                  <td className="max-w-56 truncate p-3">{i.file_name ?? "—"}</td>
                  <td className="p-3 font-mono text-xs uppercase">{i.status}</td>
                  <td className="p-3">{i.detections.length}</td>
                  <td className="p-3">
                    {highestSeverity(i.detections) ? (
                      <SeverityBadge severity={highestSeverity(i.detections)!} />
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant={selected.includes(i.id) ? "default" : "ghost"} onClick={() => toggleCompare(i.id)} aria-label={`Select ${i.file_name ?? i.id} for comparison`}>
                        <GitCompareArrows className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/inspection/$id" params={{ id: i.id }}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => del.mutate(i.id)}
                        disabled={del.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!q.isLoading && !q.data?.length && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    No inspections yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
