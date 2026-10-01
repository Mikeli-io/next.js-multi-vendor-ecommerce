"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  ExpandIcon,
  GlobeIcon,
  GridIcon,
  HomeIcon,
  type IconProps,
  LockIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  MonitorIcon,
  SearchIcon,
  SlidersIcon,
  TagIcon,
  UserIcon,
} from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";
import { signOutAction } from "@/lib/actions/login";

/**
 * The seller/admin app shell: a 236px ink sidebar and a 64px white topbar
 * over a `--bg-dash` canvas. The sidebar is the only dashboard navigation.
 *
 * Only destinations that exist are links. Items for pages not built yet are
 * drawn but inert (see `NavTarget`).
 *
 * At ≥1024px the topbar toggle shows or hides the sidebar, as in the designs.
 * Below that the sidebar would crowd the content, so it starts hidden and the
 * same toggle opens it as a drawer.
 */

type Role = "vendor" | "admin";

type NavLink = {
  label: string;
  icon?: ComponentType<IconProps>;
  /** Omit while the page does not exist yet; the item renders inert. */
  href?: string;
};

/** A sidebar item; `children` makes it an expandable group (one level deep). */
type NavItem = NavLink & { children?: NavLink[] };

type NavGroup = { title: string; items: NavItem[] };

type SidebarConfig = {
  title: string;
  icon: ComponentType<IconProps>;
  groups: NavGroup[];
};

export type Crumb = { label: string; href?: string };

const DASHBOARD_HREF: Record<Role, string> = {
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Each role's navigation. The vendor keeps its existing Overview items; items
 * without an `href` (POS) have no page yet and render inert.
 */
const SIDEBAR: Record<Role, SidebarConfig> = {
  vendor: {
    title: "Home",
    icon: HomeIcon,
    groups: [
      {
        title: "Overview",
        items: [
          { label: "Dashboard", icon: DashboardIcon, href: DASHBOARD_HREF.vendor },
          { label: "POS", icon: MonitorIcon },
        ],
      },
    ],
  },
  admin: {
    title: "Home",
    icon: HomeIcon,
    groups: [
      {
        title: "Overview",
        items: [{ label: "Dashboard", icon: DashboardIcon, href: DASHBOARD_HREF.admin }],
      },
      {
        title: "Catalog",
        items: [
          { label: "Brands", icon: TagIcon, href: "/admin/brands" },
          {
            label: "Category Setup",
            icon: GridIcon,
            children: [
              { label: "Categories", href: "/admin/categories" },
              { label: "Sub Categories", href: "/admin/sub-categories" },
              { label: "Sub Sub Categories", href: "/admin/sub-sub-categories" },
            ],
          },
        ],
      },
    ],
  },
};

const DEFAULT_CRUMBS: Crumb[] = [{ label: "Home", href: "/" }, { label: "Dashboard" }];

const PROFILE_MENU: Record<Role, Array<NavLink & { icon: ComponentType<IconProps> }>> = {
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

/** Active for the page itself and anything beneath it (e.g. /admin/brands/[id]). */
function isActive(href: string | undefined, pathname: string): boolean {
  return Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));
}

/**
 * Narrow the navigation to a menu search. A group whose own label matches
 * keeps all its children; otherwise it keeps only the matching ones.
 */
function filterGroups(groups: NavGroup[], query: string): NavGroup[] {
  if (!query) return groups;
  const matches = (label: string) => label.toLowerCase().includes(query);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item): NavItem[] => {
        if (matches(item.label)) return [item];
        const children = item.children?.filter((child) => matches(child.label));
        return children?.length ? [{ ...item, children }] : [];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function DashboardShell({
  role,
  user,
  breadcrumb = DEFAULT_CRUMBS,
  children,
}: {
  role: Role;
  breadcrumb?: Crumb[];
  /**
   * `undefined` while loading renders the profile chip as a skeleton; `null`
   * (an error screen, where the user could not be loaded) omits it.
   */
  user?: ShellUser | null;
  children: ReactNode;
}) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");

  function toggleNavigation() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarHidden((hidden) => !hidden);
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

  const pathname = usePathname();
  const query = menuQuery.trim().toLowerCase();
  const sidebar = SIDEBAR[role];
  const groups = filterGroups(sidebar.groups, query);

  return (
    <div className="flex min-h-dvh bg-bg-dash">
      {/* Desktop navigation, in flow. */}
      {!sidebarHidden ? (
        <div className="sticky top-0 hidden h-dvh flex-none lg:flex">
          <Sidebar config={sidebar} groups={groups} pathname={pathname} searching={Boolean(query)} />
        </div>
      ) : null}

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
            <Sidebar
              config={sidebar}
              groups={groups}
              pathname={pathname}
              searching={Boolean(query)}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:gap-4 sm:px-[26px]">
          <button
            type="button"
            onClick={toggleNavigation}
            aria-label="Toggle navigation"
            aria-expanded={drawerOpen || !sidebarHidden}
            className="grid size-[30px] flex-none cursor-pointer place-items-center rounded-sm border border-line bg-surface text-muted transition-colors duration-150 hover:bg-field"
          >
            <span className="lg:hidden">
              <MenuIcon />
            </span>
            <span className="hidden lg:block">
              {sidebarHidden ? <MenuIcon /> : <ChevronLeftIcon />}
            </span>
          </button>
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-2 text-[13px] font-medium leading-none sm:flex"
          >
            {breadcrumb.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <ChevronRightIcon className="text-muted-soft" /> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-iris-500">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="max-w-[240px] truncate text-muted">
                    {crumb.label}
                  </span>
                )}
              </Fragment>
            ))}
          </nav>

          {role === "admin" ? (
            <label className="ml-[14px] hidden h-10 max-w-[420px] flex-1 items-center overflow-hidden rounded-[10px] border border-line bg-field transition-[border-color] duration-200 field-focus-within md:flex">
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

function Sidebar({
  config,
  groups,
  pathname,
  searching,
  onClose,
}: {
  config: SidebarConfig;
  groups: NavGroup[];
  pathname: string;
  /** A menu search is active: expandable groups show their matches open. */
  searching: boolean;
  onClose?: () => void;
}) {
  const HeaderIcon = config.icon;

  return (
    <aside className="h-full w-[236px] flex-none overflow-y-auto border-r border-iris-600 bg-ink px-4 py-5">
      <div className="mb-4 flex items-center gap-[10px] border-b border-iris-400 px-2 pb-5">
        <span className="grid size-[34px] place-items-center rounded-[10px] bg-iris-50 text-iris-500">
          <HeaderIcon />
        </span>
        <span className="font-display text-[16px] font-bold leading-none text-surface">
          {config.title}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto grid size-8 cursor-pointer place-items-center rounded-sm text-iris-100 hover:bg-iris-600 hover:text-surface"
          >
            <CloseIcon size={16} />
          </button>
        ) : null}
      </div>

      <nav aria-label="Dashboard">
        {groups.map((group, index) => (
          <div key={group.title} className="mb-[6px]">
            <p
              className={`mb-[10px] px-2 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-iris-100 ${
                index > 0 ? "mt-[18px]" : ""
              }`}
            >
              {group.title}
            </p>
            <div className="flex flex-col gap-[3px]">
              {group.items.map((item) =>
                item.children ? (
                  <SidebarGroupItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    forceOpen={searching}
                  />
                ) : (
                  <SidebarLink key={item.label} item={item} active={isActive(item.href, pathname)} />
                ),
              )}
            </div>
          </div>
        ))}
        {!groups.length ? (
          <p className="px-3 py-2 text-[12.5px] text-iris-100">No matching menu items.</p>
        ) : null}
      </nav>
    </aside>
  );
}

const ROW =
  "flex w-full items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[13.5px] leading-none transition-colors duration-150";
// On the ink sidebar: idle rows are white; hovering one previews the active
// look — the lavender iris-50 pill with iris-700 text (the design system's
// "text on light iris" pairing).
const ROW_ACTIVE = "bg-iris-50 font-semibold text-iris-700 hover:text-iris-700";
const ROW_IDLE = "font-medium text-surface hover:bg-iris-50 hover:text-iris-700";

function SidebarLink({ item, active }: { item: NavLink; active: boolean }) {
  const Icon = item.icon;
  return (
    <NavTarget href={item.href} className={`${ROW} ${active ? ROW_ACTIVE : ROW_IDLE}`}>
      {Icon ? <Icon size={17} strokeWidth={1.9} /> : null}
      {item.label}
    </NavTarget>
  );
}

/**
 * An expandable item (e.g. Category Setup). Starts open when one of its
 * children is the current page, and while a menu search is narrowing it.
 */
function SidebarGroupItem({
  item,
  pathname,
  forceOpen,
}: {
  item: NavItem;
  pathname: string;
  forceOpen: boolean;
}) {
  const children = item.children ?? [];
  const containsActive = children.some((child) => isActive(child.href, pathname));
  const [open, setOpen] = useState(containsActive);
  const expanded = open || forceOpen;
  const Icon = item.icon;
  const panelId = `nav-${item.label.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={`group ${ROW} cursor-pointer ${containsActive ? "font-semibold text-surface hover:bg-iris-50 hover:text-iris-700" : ROW_IDLE}`}
      >
        {Icon ? <Icon size={17} strokeWidth={1.9} /> : null}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDownIcon
          size={15}
          className={`text-iris-100 transition-[transform,color] duration-200 group-hover:text-iris-700 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div id={panelId} className="mt-[3px] flex flex-col gap-[2px]">
          {children.map((child) => {
            const active = isActive(child.href, pathname);
            return (
              <NavTarget
                key={child.label}
                href={child.href}
                className={`flex w-full items-center rounded-[10px] py-[9px] pl-[40px] pr-3 text-[13px] leading-none transition-colors duration-150 ${
                  active ? ROW_ACTIVE : ROW_IDLE
                }`}
              >
                {child.label}
              </NavTarget>
            );
          })}
        </div>
      ) : null}
    </div>
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
