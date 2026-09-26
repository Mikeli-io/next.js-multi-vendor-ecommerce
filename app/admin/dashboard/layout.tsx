import { requireAdmin } from "@/lib/auth/guards";

/**
 * Resolves access before `loading.tsx` streams, so a rejection is a real HTTP
 * redirect rather than a client-side refresh. The page's loader re-checks;
 * see `app/vendor/dashboard/layout.tsx`.
 */
export default async function AdminDashboardLayout({
  children,
}: LayoutProps<"/admin/dashboard">) {
  await requireAdmin();
  return children;
}
