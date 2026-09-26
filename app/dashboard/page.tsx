import type { Metadata } from "next";

import { AccountHeading, AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";
import { UserIcon } from "@/components/ui/icons";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "My Dashboard · Covet" };

/**
 * Customer dashboard — the "Profile Info" screen from
 * `designs/.../userdashboard.dc.html`. The guard is the real boundary: guests
 * go to /login and other roles to /unauthorized, whatever the proxy did.
 */
export default async function CustomerDashboardPage() {
  const user = await requireRole("CUSTOMER");
  const [first = "", ...rest] = user.name.trim().split(/\s+/);

  return (
    <AccountShell user={{ name: user.name, email: user.email }}>
      <AccountHeading>Profile Info</AccountHeading>

      <div className="mb-[34px] mt-5 flex flex-col items-center">
        {/* The design's "change photo" button is omitted: there is no avatar storage yet. */}
        <span className="grid size-[120px] place-items-center rounded-full border border-iris-100 bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-400">
          <UserIcon size={56} strokeWidth={1.6} />
        </span>
        <p className="mt-4 text-center font-display text-[18px] font-bold leading-[1.2] text-ink">
          {user.name}
        </p>
      </div>

      <ProfileForm firstName={first} lastName={rest.join(" ")} email={user.email} />
    </AccountShell>
  );
}
