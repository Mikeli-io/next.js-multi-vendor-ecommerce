import { AccountHeading, AccountShell } from "@/components/account/account-shell";

/** The design's "Loading" state: avatar, name and six field placeholders. */
export default function CustomerDashboardLoading() {
  return (
    <AccountShell>
      <AccountHeading>Profile Info</AccountHeading>
      <div aria-busy="true" aria-label="Loading profile">
        <div className="mb-[34px] mt-5 flex flex-col items-center">
          <span className="skeleton size-[120px] rounded-full" />
          <span className="skeleton mt-4 h-4 w-[120px] rounded-[6px]" />
        </div>
        <div className="mx-auto grid max-w-[840px] grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <span className="skeleton mb-[10px] block h-[11px] w-[38%] rounded-[5px]" />
              <span className="skeleton block h-12 rounded-[11px]" />
            </div>
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
