import Link from "next/link";
import type { Metadata } from "next";

import { VendorRegisterForm } from "@/components/auth/vendor-register-form";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Logo } from "@/components/ui/logo";
import {
  ChartIcon,
  StoreIcon,
  UploadIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = { title: "Vendor registration · Covet" };

/**
 * Seller registration, from `designs/.../VendorRegister.dc.html`.
 *
 * The header, hero form and the two marketing sections below it follow the
 * mockup. Its app-download block, FAQ accordion, newsletter sign-up and help
 * cards are not built: each is non-functional marketing chrome outside the
 * scope of authentication, and would ship dead links or dead inputs.
 */

const PERKS = [
  {
    Icon: StoreIcon,
    title: "Your own storefront",
    desc: "A dedicated store page with your products, your branding and your reviews.",
  },
  {
    Icon: UsersIcon,
    title: "Ready-made audience",
    desc: "Reach shoppers already browsing and buying across the Covet marketplace.",
  },
  {
    Icon: ChartIcon,
    title: "Reporting that is yours",
    desc: "Order, product and transaction reports scoped to your store alone.",
  },
  {
    Icon: WalletIcon,
    title: "Clear earnings",
    desc: "Track your balance, commission and tax from a single seller wallet.",
  },
] as const;

const STEPS = [
  {
    Icon: StoreIcon,
    title: "Register your store",
    desc: "Tell us who you are and what your store is called. Our team reviews it before it goes live.",
  },
  {
    Icon: UploadIcon,
    title: "Upload your products",
    desc: "Add detailed product information, images and pricing from your seller dashboard.",
  },
  {
    Icon: WalletIcon,
    title: "Start selling",
    desc: "Fulfil orders as they arrive and follow your earnings as they build up.",
  },
] as const;

export default function VendorRegisterPage() {
  return (
    <div className="bg-bg">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
        <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-7 px-8">
          <Logo href="/" />
          <Link
            href="/vendor/login"
            className="ml-auto flex h-11 items-center rounded-md bg-iris-500 px-[22px] font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 hover:text-surface"
          >
            Vendor Login
          </Link>
        </div>
      </header>

      <section className="border-b border-line-soft bg-[linear-gradient(120deg,var(--iris-50),#FBFAFF)]">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-8 py-12 lg:grid-cols-[340px_1fr]">
          <div>
            <h1 className="m-0 font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
              Vendor Registration
            </h1>
            <p className="mb-5 mt-[14px] text-[14px] leading-[1.5] text-muted">
              Create your own store. Already have a store?{" "}
              <Link href="/vendor/login" className="font-semibold">
                Login
              </Link>
            </p>
            <ImagePlaceholder
              label="seller illustration"
              aspect="4/3"
              className="max-lg:hidden"
            />
          </div>

          <div className="rounded-xl border border-line-soft bg-surface p-6 shadow-sm sm:p-[30px_32px]">
            <VendorRegisterForm />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-8 pt-16 text-center">
        <h2 className="m-0 font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
          Why Sell With Us
        </h2>
        <p className="mb-10 mt-[14px] text-[15px] leading-[1.5] text-muted">
          Boost your sales! Join us for a seamless, profitable selling
          experience.
        </p>
        <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-line-soft bg-surface p-[26px_24px] shadow-xs transition-[box-shadow,transform] duration-250 hover:-translate-y-[3px] hover:shadow-md"
            >
              <span className="mb-[18px] grid size-[52px] place-items-center rounded-[15px] bg-iris-50 text-iris-500">
                <Icon />
              </span>
              <div className="font-display text-[16px] font-bold leading-[1.2] text-ink">
                {title}
              </div>
              <div className="mt-[10px] text-[13px] leading-[1.5] text-muted">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 bg-[linear-gradient(120deg,var(--iris-900),var(--iris-700))]">
        <div className="mx-auto w-full max-w-[1240px] px-8 py-14 text-center">
          <h2 className="m-0 font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.01em] text-surface">
            3 Easy Steps To Start Selling
          </h2>
          <p className="mx-auto mb-11 mt-[14px] max-w-[520px] text-[15px] leading-[1.5] text-white/75">
            Register, upload your products with detailed info and images, and
            reach shoppers across the marketplace.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ Icon, title, desc }) => (
              <div key={title} className="text-center">
                <span className="mx-auto mb-[18px] grid size-16 place-items-center rounded-xl bg-white/[0.12] text-surface">
                  <Icon size={26} />
                </span>
                <div className="font-display text-[18px] font-bold leading-[1.2] text-surface">
                  {title}
                </div>
                <div className="mx-auto mt-[10px] max-w-[280px] text-[13px] leading-[1.6] text-white/[0.72]">
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-[#B3B0BD]">
        <div className="mx-auto w-full max-w-[1240px] px-8 py-14">
          <div className="font-display text-[24px] font-extrabold leading-none tracking-[-0.02em] text-surface">
            Covet<span className="text-iris-400">.</span>
          </div>
          <p className="mt-4 max-w-[380px] text-[13px] leading-[1.6] text-[#8B8895]">
            A curated multi-vendor marketplace bringing independent sellers and
            beloved brands under one trusted checkout.
          </p>
        </div>
        <div className="border-t border-white/[0.08] px-8 py-[22px] text-center text-[12.5px] leading-none text-[#6C6976]">
          © 2026 Covet Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
