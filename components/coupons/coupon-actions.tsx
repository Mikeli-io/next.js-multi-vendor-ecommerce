"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { DeleteButton, IconAction, RowActions, actionClass } from "@/components/catalog/row-actions";
import { EditIcon, EyeIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { deleteCoupon, setCouponStatus } from "@/lib/actions/coupons";
import type { CouponRow } from "@/lib/coupons/queries";
import { CouponViewDialog } from "./coupon-view-dialog";

/** The list's Status switch: ACTIVE ⇄ INACTIVE, ownership checked on the server. */
export function CouponStatusSwitch({ id, code, active }: { id: string; code: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await setCouponStatus(id, next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.formError ?? "Couldn't change the status.");
    });
  }

  return <Switch checked={optimistic} onChange={toggle} disabled={pending} label={`Coupon ${code} is ${optimistic ? "active" : "inactive"}`} />;
}

/** View (modal) · Edit · Delete for one coupon row. */
export function CouponRowActions({ coupon }: { coupon: CouponRow }) {
  const [viewing, setViewing] = useState(false);
  return (
    <>
      <RowActions>
        <IconAction kind="view" label={`View coupon ${coupon.code}`} title="View" icon={EyeIcon} onClick={() => setViewing(true)} />
        <Link href={`/vendor/coupons/${coupon.id}/edit`} aria-label={`Edit coupon ${coupon.code}`} title="Edit" className={actionClass("edit")}>
          <EditIcon size={15} />
        </Link>
        <DeleteButton
          id={coupon.id}
          name={coupon.code}
          noun="coupon"
          body={<>Customers will no longer be able to use this code. This can&apos;t be undone.</>}
          onDelete={deleteCoupon}
        />
      </RowActions>
      <CouponViewDialog coupon={viewing ? coupon : null} onClose={() => setViewing(false)} />
    </>
  );
}
