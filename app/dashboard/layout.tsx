import { requireRole } from "@/lib/auth/guards";

/**
 * Resolves access before `loading.tsx` streams, so a rejection is a real HTTP
 * redirect rather than a client-side refresh. The page re-checks; see
 * `app/vendor/dashboard/layout.tsx`.
 */
export default async function CustomerDashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await requireRole("CUSTOMER");
  return children;
}
