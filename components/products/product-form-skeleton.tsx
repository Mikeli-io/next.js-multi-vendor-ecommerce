/** The Add/Edit form's loading state, as in the design: three section placeholders. */
export function ProductFormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product form" className="flex flex-col gap-5">
      <div className="skeleton h-[260px] rounded-[18px]" />
      <div className="skeleton h-[150px] rounded-[18px]" />
      <div className="skeleton h-[150px] rounded-[18px]" />
    </div>
  );
}
