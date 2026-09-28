import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import {
  AwardIcon,
  BoxIcon,
  ChevronRightIcon,
  HeartIcon,
  type IconProps,
  LifeBuoyIcon,
  LogoutIcon,
  MailIcon,
  PinIcon,
  RefreshIcon,
  ShareIcon,
  TicketIcon,
  TruckIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";
import { signOutAction } from "@/lib/actions/login";
import { firstName } from "@/lib/format";

/**
 * The customer dashboard shell (DESIGN_SYSTEM.md §9): storefront header and
 * footer around a left account sidebar and a white content card.
 *
 * The design's per-item count badges (orders, wishlist, inbox) are not drawn:
 * those features have no data yet. Below 1024px the sidebar sits above the
 * content and its links become a horizontally scrolling row.
 */

type AccountNavItem = { label: string; icon: ComponentType<IconProps>; href?: string };

const NAV: AccountNavItem[] = [
  { label: "Profile Info", icon: UserIcon, href: "/dashboard" },
  { label: "My Orders", icon: BoxIcon },
  { label: "Restock Requests", icon: RefreshIcon },
  { label: "Wish List", icon: HeartIcon },
  { label: "My Wallet", icon: WalletIcon },
  { label: "My Loyalty Point", icon: AwardIcon },
  { label: "Inbox", icon: MailIcon },
  { label: "My Address", icon: PinIcon },
  { label: "Support Ticket", icon: LifeBuoyIcon },
  { label: "Refer & Earn", icon: ShareIcon },
  { label: "Coupons", icon: TicketIcon },
  { label: "Track Order", icon: TruckIcon },
];

export function AccountShell({
  user,
  active = "Profile Info",
  children,
}: {
  /** Omitted while loading or on error: the identity block renders as a skeleton. */
  user?: { name: string; email: string };
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <StorefrontHeader greetingName={user ? firstName(user.name) : undefined} />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex w-full max-w-[var(--container-max)] items-center gap-2 px-[var(--cpad)] pt-[22px] text-[13px] leading-none text-muted-soft"
      >
        <Link href="/" className="text-muted">
          Home
        </Link>
        <ChevronRightIcon className="text-muted-soft" />
        <span className="font-semibold text-ink">My Dashboard</span>
      </nav>

      <div className="mx-auto grid w-full max-w-[var(--container-max)] flex-1 grid-cols-1 items-start gap-6 px-[var(--cpad)] pt-5 lg:grid-cols-[300px_1fr]">
        <aside className="min-w-0 rounded-xl border border-line-soft bg-surface p-[14px] shadow-xs lg:sticky lg:top-24">
          <div className="mb-2 flex items-center gap-[13px] border-b border-line-soft px-3 pb-4 pt-3">
            <span className="grid size-[46px] flex-none place-items-center rounded-[14px] bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-500">
              <UserIcon size={24} strokeWidth={1.9} />
            </span>
            {user ? (
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold leading-[1.1] text-ink">
                  {user.name}
                </p>
                <p className="mt-[5px] truncate text-[12px] leading-none text-muted-soft">
                  {user.email}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="skeleton h-[14px] w-28 rounded-[5px]" />
                <span className="skeleton h-[11px] w-36 rounded-[5px]" />
              </div>
            )}
          </div>

          <ul className="flex gap-[2px] overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map(({ label, icon: Icon, href }) => {
              const isActive = label === active;
              return (
                <li key={label} className="flex-none">
                  <NavTarget
                    href={href}
                    className={`flex items-center gap-3 whitespace-nowrap rounded-[11px] px-[14px] py-[11px] text-[13.5px] leading-none transition-colors duration-150 ${
                      isActive
                        ? "bg-iris-50 font-semibold text-iris-500 hover:text-iris-500"
                        : "font-medium text-ink-soft hover:bg-field hover:text-ink-soft"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    {label}
                  </NavTarget>
                </li>
              );
            })}
          </ul>

          <form action={signOutAction} className="mt-[10px] border-t border-line-soft px-3 pt-[14px]">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-3 rounded-[11px] px-3 py-[10px] text-[13.5px] font-semibold leading-none text-error-solid transition-colors duration-150 hover:bg-error-bg"
            >
              <LogoutIcon size={18} />
              Sign out
            </button>
          </form>
        </aside>

        <section className="min-h-[640px] min-w-0 rounded-xl border border-line-soft bg-surface p-5 shadow-xs sm:p-[32px_36px_40px]">
          {children}
        </section>
      </div>

      <StorefrontFooter />
    </div>
  );
}

/** "Profile Info" style heading with the design's short iris underline. */
export function AccountHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2">
      <h1 className="font-display text-[22px] font-bold leading-none tracking-[-0.01em] text-ink">
        {children}
      </h1>
      <div className="mt-3 h-[3px] w-11 rounded-[2px] bg-iris-500" />
    </div>
  );
}
