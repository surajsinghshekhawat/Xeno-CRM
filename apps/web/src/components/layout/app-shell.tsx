import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h1>
          {description ? (
            <div className="mt-2 text-sm text-neutral-600">{description}</div>
          ) : null}
        </header>
        {children ?? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-sm text-neutral-500">
            Screen scaffold ready — implementation in progress.
          </div>
        )}
      </main>
    </div>
  );
}
