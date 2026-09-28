import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/login";

/** Signing out is a mutation, so it posts a form rather than following a link. */
export function SignOutButton({
  label = "Sign out",
  variant = "secondary",
}: {
  label?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}
