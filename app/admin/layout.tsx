import { requireAdmin } from "@/lib/auth/guards";

/**
 * Every page under /admin/* (the dashboard, brands, ...). Resolves access
 * *before* any segment's `loading.tsx` starts streaming, so a rejection is a
 * real HTTP redirect rather than a client-side refresh after a skeleton.
 *
 * It is not the only check: layouts do not re-run on client-side navigation,
 * so every admin page's data loader and every admin Server Action calls the
 * same guard itself. The result is memoized per request.
 *
 * `/admin/login` lives in the `(auth)` route group, outside this layout.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
