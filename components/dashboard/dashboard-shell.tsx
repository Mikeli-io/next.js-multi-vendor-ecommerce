"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  BagIcon,
  BarChartIcon,
  BellIcon,
  BoxIcon,
  CartIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  ExpandIcon,
  GlobeIcon,
  HomeIcon,
  type IconProps,
  LockIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  MonitorIcon,
  SearchIcon,
  SlidersIcon,
  SpeakerIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";
import { signOutAction } from "@/lib/actions/login";

/**
 * The seller/admin app shell from DESIGN_SYSTEM.md §9: a 64px dark icon rail,
 * a 236px white sidebar and a 64px topbar over a `--bg-dash` canvas.
 *
 * Only destinations that exist are links. Everything else in the rail,
 * sidebar and menus is drawn per the design but inert (see `NavTarget`).
 *
 * At ≥1024px the toggle collapses the rail and sidebar, as in the design.
 * Below that they would crowd the content, so they start hidden and the same
 * toggle opens them as a drawer.
 */

type Role = "vendor" | "admin";

type NavItem = {
  label: string;
  icon: ComponentType<IconProps>;
  href?: string;
};

const DASHBOARD_HREF: Record<Role, string> = {
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Primary sections, named after the section each icon opens in the design
 * files (the sidebar title of the page that highlights it) and PRD §4.3/§4.4.
 * Icons with no section defined in the designs or PRD are deliberately left
 * out rather than given a guessed name; add them back when their section is.
 * Admin order follows the admin section pages (People before Reports).
 */
const RAIL: Record<Role, NavItem[]> = {
  vendor: [
    { label: "Home", icon: HomeIcon, href: DASHBOARD_HREF.vendor },
    { label: "Catalog", icon: BoxIcon },
    { label: "Orders", icon: BagIcon },
    { label: "Marketing", icon: SpeakerIcon },
    { label: "Reports", icon: BarChartIcon },
  ],
  admin: [
    { label: "Home", icon: HomeIcon, href: DASHBOARD_HREF.admin },
    { label: "Catalog", icon: BoxIcon },
    { label: "Orders", icon: BagIcon },
    { label: "People", icon: UsersIcon },
    { label: "Reports", icon: BarChartIcon },
  ],
};

const SIDEBAR: Record<Role, NavItem[]> = {
  vendor: [
    { label: "Dashboard", icon: DashboardIcon, href: DASHBOARD_HREF.vendor },
    { label: "POS", icon: MonitorIcon },
  ],
  admin: [
    { label: "Dashboard", icon: DashboardIcon, href: DASHBOARD_HREF.admin },
    { label: "POS", icon: MonitorIcon },
  ],
};

const PROFILE_MENU: Record<Role, NavItem[]> = {
  vendor: [
    { label: "Profile Setting", icon: UserIcon },
    { label: "Change Password", icon: LockIcon },
  ],
  admin: [
    { label: "Profile", icon: UserIcon },
    { label: "Settings", icon: SlidersIcon },
  ],
};

export type ShellUser = {
  name: string;
  /** Masked email for vendors, a role title for admins. */
  subtitle: string;
};

export function DashboardShell({
  role,
  user,
  children,
}: {
  role: Role;
  /**
   * `undefined` while loading renders the profile chip as a skeleton; `null`
   * (an error screen, where the user could not be loaded) omits it.
   */
  user?: ShellUser | null;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");

  function toggleNavigation() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((c) => !c);
    } else {
      setDrawerOpen((o) => !o);
    }
  }

  // Drawer: close on Escape, and stop the page scrolling underneath it.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const query = menuQuery.trim().toLowerCase();
  const sidebarItems = query
    ? SIDEBAR[role].filter((item) => item.label.toLowerCase().includes(query))
    : SIDEBAR[role];

  return (
    <div className="flex min-h-dvh bg-bg-dash">
      {/* Desktop navigation, in flow. Collapsing keeps the rail, icon-only,
          and hides the secondary sidebar. */}
      <div className="sticky top-0 hidden h-dvh flex-none lg:flex">
        <Rail role={role} labelled={!collapsed} />
        {!collapsed ? <Sidebar items={sidebarItems} /> : null}
      </div>

      {/* Mobile / tablet navigation, as a drawer. */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[rgba(20,18,31,.55)] backdrop-blur-[3px]"
          />
          <div className="relative flex h-full w-fit max-w-[calc(100vw-48px)] shadow-xl">
            <Rail role={role} labelled />
            <Sidebar items={sidebarItems} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:gap-4 sm:px-[26px]">
          <button
            type="button"
            onClick={toggleNavigation}
            aria-label="Toggle navigation"
            aria-expanded={drawerOpen || !collapsed}
            className="grid size-[30px] flex-none cursor-pointer place-items-center rounded-sm border border-line bg-surface text-muted transition-colors duration-150 hover:bg-field"
          >
            <span className="lg:hidden">
              <MenuIcon />
            </span>
            <span className="hidden lg:block">
              {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
            </span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-2 text-[13px] font-medium leading-none sm:flex"
          >
            <Link href="/" className="text-iris-500">
              Home
            </Link>
            <ChevronRightIcon className="text-muted-soft" />
            <span className="text-muted">Dashboard</span>
          </nav>

          {role === "admin" ? (
            <label className="ml-[14px] hidden h-10 max-w-[420px] flex-1 items-center overflow-hidden rounded-[10px] border border-line bg-field transition-[border-color,box-shadow] duration-200 focus-within:border-iris-500 focus-within:shadow-[0_0_0_3px_var(--iris-100)] md:flex">
              <span className="px-3 text-muted-soft">
                <SearchIcon size={16} />
              </span>
              <span className="sr-only">Search menu</span>
              <input
                type="search"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Search Menu..."
                className="min-w-0 flex-1 border-none bg-transparent px-1 text-[13px] leading-none text-ink outline-none placeholder:text-muted-soft"
              />
            </label>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {role === "vendor" ? (
              <TopbarButton label="Visit store" icon={GlobeIcon} className="hidden md:grid" />
            ) : null}
            <TopbarButton label="Notifications" icon={BellIcon} className="hidden sm:grid" />
            <TopbarButton label="Messages" icon={MessageIcon} className="hidden md:grid" />
            <FullscreenButton />
            <ProfileMenu role={role} user={user} />
          </div>
        </header>

        <main
          className={`mx-auto flex w-full flex-col gap-[22px] p-4 sm:p-[26px] ${
            role === "admin" ? "max-w-[1280px]" : "max-w-[1240px]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * The dark primary rail. Expanded, each icon carries its section name beneath
 * it (the rail widens from 64px to 80px); collapsed, it is icon-only. Icon
 * tiles, colours and the active state are the same in both.
 */
function Rail({ role, labelled }: { role: Role; labelled: boolean }) {
  return (
    <nav
      aria-label="Sections"
      className={`flex h-full flex-none flex-col items-center overflow-y-auto bg-ink py-4 transition-[width] duration-200 ${
        labelled ? "w-20 gap-3" : "w-16 gap-2"
      }`}
    >
      <span className="mb-[14px] grid size-[38px] flex-none place-items-center rounded-[11px] bg-iris-500 text-surface">
        <CartIcon size={20} />
      </span>
      {RAIL[role].map(({ label, icon: Icon, href }, index) => {
        const active = index === 0;
        return (
          <NavTarget
            key={label}
            href={href}
            // Visible text names the link when labelled; otherwise the icon needs one.
            label={labelled ? undefined : label}
            className={`group flex w-full flex-none flex-col items-center gap-1 transition-colors duration-150 ${
              active
                ? "text-surface hover:text-surface"
                : "text-on-ink-muted hover:text-surface"
            }`}
          >
            <span
              className={`grid size-10 place-items-center rounded-[11px] ${
                active ? "bg-iris-500" : ""
              }`}
            >
              <Icon size={20} strokeWidth={1.9} />
            </span>
            {labelled ? (
              <span
                className={`max-w-full truncate px-1 text-[10.5px] leading-none ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {label}
              </span>
            ) : null}
          </NavTarget>
        );
      })}
    </nav>
  );
}

function Sidebar({ items, onClose }: { items: NavItem[]; onClose?: () => void }) {
  return (
    <aside className="h-full w-[236px] flex-none overflow-y-auto border-r border-line bg-surface px-4 py-5">
      <div className="mb-4 flex items-center gap-[10px] border-b border-line-soft px-2 pb-5">
        <span className="grid size-[34px] place-items-center rounded-[10px] bg-iris-50 text-iris-500">
          <HomeIcon />
        </span>
        <span className="font-display text-[16px] font-bold leading-none text-ink">
          Home
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto grid size-8 cursor-pointer place-items-center rounded-sm text-muted hover:bg-field"
          >
            <CloseIcon size={16} />
          </button>
        ) : null}
      </div>

      <p className="mb-[10px] px-2 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-soft">
        Overview
      </p>

      <div className="flex flex-col gap-[3px]">
        {items.map(({ label, icon: Icon, href }, index) => (
          <NavTarget
            key={label}
            href={href}
            className={`flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[13.5px] leading-none transition-colors duration-150 ${
              index === 0 && href
                ? "bg-iris-50 font-semibold text-iris-500 hover:text-iris-500"
                : "font-medium text-ink-soft hover:bg-field hover:text-ink-soft"
            }`}
          >
            <Icon size={17} strokeWidth={1.9} />
            {label}
          </NavTarget>
        ))}
        {!items.length ? (
          <p className="px-3 py-2 text-[12.5px] text-muted">No matching menu items.</p>
        ) : null}
      </div>
    </aside>
  );
}

const TOPBAR_BUTTON =
  "size-[38px] flex-none place-items-center rounded-[10px] border border-line bg-surface text-muted transition-colors duration-150";

/** An icon button whose feature does not exist yet — drawn, but inert. */
function TopbarButton({
  label,
  icon: Icon,
  className,
}: {
  label: string;
  icon: ComponentType<IconProps>;
  className: string;
}) {
  return (
    <span
      role="button"
      aria-disabled="true"
      aria-label={label}
      title={`${label} — coming soon`}
      className={`${TOPBAR_BUTTON} cursor-default ${className}`}
    >
      <Icon size={18} strokeWidth={1.9} />
    </span>
  );
}

/** Real: toggles the browser's fullscreen mode. */
function FullscreenButton() {
  function toggle() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle fullscreen"
      className={`${TOPBAR_BUTTON} hidden cursor-pointer hover:bg-field hover:text-iris-500 md:grid`}
    >
      <ExpandIcon size={17} />
    </button>
  );
}

function ProfileMenu({ role, user }: { role: Role; user?: ShellUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (user === null) return null;

  if (!user) {
    return (
      <div className="ml-[6px] flex h-11 items-center gap-[10px] rounded-full border border-line pl-[6px] pr-3">
        <span className="skeleton size-[34px] rounded-full" />
        <span className="hidden flex-col gap-[6px] sm:flex">
          <span className="skeleton h-3 w-16 rounded-[5px]" />
          <span className="skeleton h-[10px] w-24 rounded-[5px]" />
        </span>
      </div>
    );
  }

  return (
    // The padding bridge (pt on the panel wrapper) lets the pointer travel from
    // the chip into the menu without it closing — DESIGN_SYSTEM.md §9.
    <div ref={ref} className="relative ml-[6px]" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 cursor-pointer items-center gap-[10px] rounded-full border border-line bg-surface pl-[6px] pr-2 transition-colors duration-150 hover:bg-field"
      >
        <span className="grid size-[34px] flex-none place-items-center rounded-full bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-500">
          <UserIcon size={18} />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate font-display text-[13px] font-semibold leading-none text-ink">
            {user.name}
          </span>
          <span className="mt-1 block text-[11px] leading-none text-muted-soft">
            {user.subtitle}
          </span>
        </span>
        <ChevronDownIcon className="hidden text-muted sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[60] w-[236px] pt-[10px]">
          <div
            role="menu"
            className="rounded-lg border border-line-soft bg-surface p-[6px] shadow-menu"
          >
            {role === "vendor" ? (
              <div className="mb-[6px] flex items-center gap-[11px] border-b border-line-soft px-[14px] py-3">
                <span className="grid size-[38px] flex-none place-items-center rounded-[11px] bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-500">
                  <UserIcon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[13.5px] font-bold leading-none text-ink">
                    {user.name}
                  </p>
                  <p className="mt-[5px] truncate text-[11px] leading-none text-muted-soft">
                    {user.subtitle}
                  </p>
                </div>
              </div>
            ) : null}

            {PROFILE_MENU[role].map(({ label, icon: Icon }) => (
              <NavTarget
                key={label}
                className="flex items-center gap-[11px] rounded-[10px] px-[14px] py-[10px] text-[13.5px] font-medium leading-none text-ink-soft"
              >
                <Icon size={17} strokeWidth={1.9} />
                {label}
              </NavTarget>
            ))}

            <form action={signOutAction} className="mt-[2px] border-t border-line-soft pt-[2px]">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-[11px] rounded-[10px] px-[14px] py-[10px] text-[13.5px] font-semibold leading-none text-error-solid transition-colors duration-150 hover:bg-error-bg"
              >
                <LogoutIcon size={17} strokeWidth={1.9} />
                Logout
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
