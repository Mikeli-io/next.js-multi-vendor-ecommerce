import Link from "next/link";

import { DashboardIcon, LockIcon, UserIcon } from "@/components/ui/icons";

export const PROFILE_CRUMBS = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Profile Settings" },
];

const TABS = [
  { key: "basic", label: "Basic Information", href: "/vendor/profile", icon: UserIcon },
  { key: "password", label: "Password", href: "/vendor/profile/password", icon: LockIcon },
] as const;

/** "Profile Information" heading, its Dashboard shortcut, and the two tabs. */
export function ProfileHeader({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[11px] bg-iris-50 text-iris-500">
            <UserIcon size={19} />
          </span>
          <h1 className="font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
            Profile Information
          </h1>
        </div>
        <Link
          href="/vendor/dashboard"
          className="flex h-11 items-center gap-2 rounded-[11px] bg-iris-500 px-5 font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600"
        >
          <DashboardIcon size={17} />
          Dashboard
        </Link>
      </div>
      <nav aria-label="Profile sections" className="flex flex-wrap items-center gap-3">
        {TABS.map(({ key, label, href, icon: Icon }) => {
          const current = key === active;
          return (
            <Link
              key={key}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`flex h-[46px] items-center gap-[9px] rounded-[12px] px-[22px] text-[14px] leading-none transition-colors duration-200 ${
                current ? "bg-iris-500 font-semibold text-surface" : "font-medium text-muted hover:bg-iris-50 hover:text-iris-500"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** The card title row used inside both tabs. */
export function ProfileCardTitle({ icon: Icon, title }: { icon: typeof UserIcon; title: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-iris-50 text-iris-500">
        <Icon size={16} />
      </span>
      <h2 className="font-display text-[17px] font-bold leading-none text-ink">{title}</h2>
    </div>
  );
}

export const PROFILE_CARD = "overflow-hidden rounded-[18px] border border-line-soft bg-surface shadow-xs";
