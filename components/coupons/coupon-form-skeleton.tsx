/** The coupon form's loading state: the card with field placeholders. */
export function CouponFormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading coupon form" className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex flex-col gap-[10px]">
            <div className="skeleton h-[13px] w-2/5 rounded-[6px]" />
            <div className="skeleton h-[50px] rounded-[12px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
