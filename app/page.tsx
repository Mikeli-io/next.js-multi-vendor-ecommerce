import { redirect } from "next/navigation";

/**
 * There is no storefront home page yet, so `/` sends visitors to the customer
 * sign-in. A temporary (307) redirect, since this route will become the store.
 *
 * Signed-in users are not stranded on a login form: the proxy bounces any
 * session away from `/login` to the landing page its role owns.
 */
export default function Home() {
  redirect("/login");
}
