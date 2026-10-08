import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import {
  CartIcon,
  ChevronDownIcon,
  GridIcon,
  HeartIcon,
  PackageStackIcon,
  SearchIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";
import { formatMoney } from "@/lib/format";

/**
 * Storefront chrome from the customer designs (DESIGN_SYSTEM.md §9): an ink
 * utility bar, the sticky header, and the category nav.
 *
 * Search, categories, wishlist and cart are storefront features that later
 * phases build; until then they are drawn per the design but inert, and the
 * category mega-menu panels (which need real categories) are not rendered.
 */

const NAV_LINKS: ReadonlyArray<{ label: string; href?: string }> = [
  { label: "Home", href: "/" },
  { label: "Brands" },
  { label: "Offers" },
  { label: "All Sellers" },
  { label: "Gift Cards" },
];

export function StorefrontHeader({ greetingName }: { greetingName?: string }) {
  return (
    <>
      <div className="bg-ink text-on-ink">
        <div className="mx-auto flex h-10 max-w-[var(--container-max)] items-center justify-between px-[var(--cpad)] text-[12.5px] leading-none">
          <p className="flex items-center gap-2">
            <TruckIcon size={14} className="text-iris-400" />
            <span>
              Free delivery on orders over{" "}
              <span className="font-semibold text-surface">$50</span>
            </span>
          </p>
          <nav aria-label="Utility" className="hidden items-center gap-[26px] md:flex">
            <Link href="/" className="text-on-ink hover:text-surface">
              Home
            </Link>
            <NavTarget className="text-on-ink">All Sellers</NavTarget>
            <Link href="/vendor/register" className="text-on-ink hover:text-surface">
              Sell on Covet
            </Link>
            <NavTarget className="text-on-ink">Help Center</NavTarget>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
        <div className="mx-auto flex h-[72px] max-w-[var(--container-max)] items-center gap-4 px-[var(--cpad)] lg:h-20 lg:gap-7">
          <span className="flex-none">
            <Logo size={27} />
          </span>

          <SearchBar className="hidden md:flex" />

          <div className="ml-auto flex flex-none items-center gap-1 sm:gap-2 md:ml-0">
            <NavTarget
              label="Wishlist"
              className="flex flex-col items-center gap-[3px] rounded-[10px] px-[10px] py-[6px] text-ink-soft"
            >
              <HeartIcon size={21} />
              <span className="hidden text-[11px] font-medium leading-none text-muted sm:block">
                Wishlist
              </span>
            </NavTarget>

            <Link
              href="/dashboard"
              className="flex items-center gap-[10px] rounded-[10px] px-2 py-[6px] transition-colors duration-200 hover:bg-field"
            >
              <span className="grid size-[38px] place-items-center rounded-full bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-500">
                <UserIcon size={20} />
              </span>
              <span className="hidden text-left lg:block">
                <span className="mb-[3px] block text-[11px] leading-none text-muted">
                  {greetingName ? `Hello, ${greetingName}` : "Hello"}
                </span>
                <span className="flex items-center gap-1 font-display text-[13px] font-semibold leading-none text-ink">
                  Dashboard
                  <ChevronDownIcon size={14} className="text-muted" />
                </span>
              </span>
            </Link>

            <NavTarget
              label="My cart"
              className="ml-[6px] flex items-center gap-3 rounded-[12px] border border-iris-100 bg-iris-50 py-[9px] pl-3 pr-3 sm:pr-[14px]"
            >
              <span className="text-iris-500">
                <CartIcon size={23} />
              </span>
              <span className="hidden text-left sm:block">
                <span className="mb-[3px] block text-[11px] leading-none text-muted">
                  My cart
                </span>
                <span className="block font-display text-[14px] font-bold leading-none text-ink">
                  {formatMoney(0)}
                </span>
              </span>
            </NavTarget>
          </div>
        </div>

        {/* Below md the search moves to its own row under the header. */}
        <div className="border-t border-line-soft px-[var(--cpad)] py-3 md:hidden">
          <SearchBar className="flex" />
        </div>
      </header>

      <nav aria-label="Categories" className="border-b border-line-soft bg-surface">
        <div className="mx-auto flex h-[54px] max-w-[var(--container-max)] items-center gap-2 overflow-x-auto px-[var(--cpad)]">
          <NavTarget className="mr-[14px] flex h-[38px] flex-none items-center gap-[10px] rounded-[10px] bg-ink px-[18px] text-[13.5px] font-semibold leading-none text-surface">
            <GridIcon size={17} />
            All Categories
            <ChevronDownIcon />
          </NavTarget>
          {NAV_LINKS.map((link) => (
            <NavTarget
              key={link.label}
              href={link.href}
              className="flex h-[38px] flex-none items-center rounded-sm px-[14px] text-[13.5px] font-medium leading-none text-ink-soft hover:text-iris-500"
            >
              {link.label}
            </NavTarget>
          ))}
          <Link
            href="/vendor/register"
            className="ml-auto hidden flex-none items-center gap-2 text-[13px] font-medium leading-none text-success-solid hover:text-success xl:flex"
          >
            <PackageStackIcon size={16} />
            Sell on Covet — open a store free
          </Link>
        </div>
      </nav>
    </>
  );
}

function SearchBar({ className }: { className: string }) {
  return (
    <div
      role="search"
      className={`h-12 flex-1 items-center rounded-[12px] border border-line bg-field transition-[border-color] duration-200 field-focus-within ${className}`}
    >
      <NavTarget className="hidden h-full items-center gap-[6px] whitespace-nowrap border-r border-line px-4 text-[13px] font-medium leading-none text-ink-soft lg:flex">
        All Categories
        <ChevronDownIcon className="text-muted" />
      </NavTarget>
      <label className="sr-only" htmlFor="storefront-search">
        Search for items
      </label>
      <input
        id="storefront-search"
        type="search"
        placeholder="Search for items…"
        className="h-full min-w-0 flex-1 border-none bg-transparent px-4 text-[14px] leading-none text-ink outline-none placeholder:text-muted-soft"
      />
      <button
        type="button"
        aria-label="Search"
        aria-disabled="true"
        title="Search arrives with the storefront"
        className="grid h-full flex-none cursor-default place-items-center rounded-r-[11px] bg-iris-500 px-5 text-surface"
      >
        <SearchIcon size={19} />
      </button>
    </div>
  );
}
