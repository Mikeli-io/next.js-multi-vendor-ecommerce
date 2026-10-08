"use client";

import { useFormStatus } from "react-dom";

import { Button } from "./button";

/**
 * Disables itself while the enclosing form's action is in flight, which also
 * stops a double submit from creating two accounts.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "w-full",
}: {
  children: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
