import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Who am I", robots: { index: false, follow: false } };

/**
 * Shows the signed-in person only their own sign-in: which email the site sees, and whether that
 * email is on the admin list. Nothing about anyone else. It exists because the admin page answers
 * "Not found" to anyone who isn't an admin, which makes it hard to tell which account you are using.
 */
export default async function WhoAmIPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin: boolean | null = null;
  if (user) {
    const { data } = await supabase.rpc("is_admin");
    isAdmin = Boolean(data);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Who am I</h1>
      {user ? (
        <dl className="mt-6 space-y-3 text-[15px]">
          <div>
            <dt className="text-sm text-muted-foreground">Signed in as</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">On the admin list</dt>
            <dd className="font-medium">{isAdmin ? "Yes" : "No"}</dd>
          </div>
          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              This email is not on the admin list, so the admin page shows &ldquo;Not found&rdquo;. The list is matched
              on the exact email (lower case, no spaces). To change which account you use, sign in with another email at{" "}
              <Link href="/login" className="underline underline-offset-2">
                /login
              </Link>
              .
            </p>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-[15px] text-muted-foreground">
          You are not signed in.{" "}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>
          .
        </p>
      )}
    </div>
  );
}
