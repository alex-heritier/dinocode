import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";

import { SidebarInset } from "../components/ui/sidebar.tsx";
import { useStore } from "../store.ts";
import type { Project } from "../types.ts";

interface ProjectEntry {
  environmentId: EnvironmentId;
  project: Project;
}

function BoardIndexRouteView() {
  const envStateById = useStore((state) => state.environmentStateById);
  const activeEnvironmentId = useStore((state) => state.activeEnvironmentId);

  const grouped = useMemo(() => {
    const byEnv: Array<[EnvironmentId, ProjectEntry[]]> = [];
    for (const [environmentId, envState] of Object.entries(envStateById)) {
      const entries: ProjectEntry[] = [];
      for (const projectId of envState.projectIds) {
        const project = envState.projectById[projectId];
        if (project) {
          entries.push({ environmentId: environmentId as EnvironmentId, project });
        }
      }
      if (entries.length > 0) {
        entries.sort((a, b) => a.project.name.localeCompare(b.project.name));
        byEnv.push([environmentId as EnvironmentId, entries]);
      }
    }
    return byEnv;
  }, [envStateById]);

  const totalProjects = grouped.reduce((sum, [, entries]) => sum + entries.length, 0);

  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-h-0 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Kanban Boards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a project to open its board. Each board reads tasks from the orchestration
            projection for that project.
          </p>
        </div>

        {totalProjects === 0 ? (
          <div className="rounded-lg border bg-card/30 p-6 text-sm text-muted-foreground">
            No projects registered yet. Create a project from the sidebar (or open a workspace via
            the chat view) and it will show up here.
          </div>
        ) : (
          <div className="flex flex-col gap-6 overflow-y-auto">
            {grouped.map(([environmentId, entries]) => (
              <section key={environmentId} className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {environmentId === activeEnvironmentId
                    ? `${environmentId} (active)`
                    : environmentId}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map(({ project }) => (
                    <Link
                      key={project.id}
                      to="/board/$environmentId/$projectId"
                      params={{
                        environmentId: environmentId as string,
                        projectId: project.id as string as ProjectId,
                      }}
                      className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="truncate text-sm font-semibold">{project.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{project.cwd}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </SidebarInset>
  );
}

export const Route = createFileRoute("/_chat/board/")({
  component: BoardIndexRouteView,
});
