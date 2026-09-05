import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  FolderKanban,
  HardDrive,
  LogOut,
  Menu,
  ScanLine,
  UploadCloud,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: Activity },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new-inspection", label: "Inspections", icon: UploadCloud },
  { to: "/drive", label: "Drive", icon: HardDrive },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-40 no-print">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center gap-4 px-5 lg:px-8">
          <Link to="/dashboard" className="brand group flex min-w-fit items-center gap-3">
            <span className="brand-mark">
              <ScanLine className="size-[18px] text-primary" aria-hidden />
              <span className="brand-ring" aria-hidden />
            </span>
            <span className="leading-none">
              <span className="block text-[16px] font-semibold tracking-[-0.02em]">
                AI-NDT <span className="text-primary">VISION</span>
              </span>
              <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Inspection intelligence
              </span>
            </span>
          </Link>

          <div className="mx-2 hidden h-7 w-px bg-white/10 lg:block" />

          <nav aria-label="Main" className="hidden flex-1 items-center justify-center lg:flex">
            <div className="nav-pill">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="nav-item"
                  activeProps={{ className: "nav-item nav-item-active" }}
                >
                  <Icon className="size-3.5" aria-hidden />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground xl:flex">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              AI service ready
            </div>

            <Button
              asChild
              size="sm"
              className="hidden h-9 rounded-lg px-4 shadow-[0_0_30px_var(--cyan-glow)] sm:inline-flex"
            >
              <Link to="/new-inspection">
                <UploadCloud className="size-3.5" aria-hidden />
                New inspection
              </Link>
            </Button>

            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="size-9 rounded-lg">
              <LogOut className="size-4" aria-hidden />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </Button>
          </div>
        </div>

        <nav
          aria-label="Mobile"
          className={cn(
            "border-t border-white/10 bg-[#071018]/98 px-5 pb-4 pt-3 backdrop-blur-2xl lg:hidden",
            !open && "hidden",
          )}
        >
          <div className="grid gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 text-sm text-foreground ring-1 ring-primary/20",
                }}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1480px] px-5 py-8 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header mb-8 flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mono-label text-primary/80">AI-NDT VISION / WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-[34px]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
