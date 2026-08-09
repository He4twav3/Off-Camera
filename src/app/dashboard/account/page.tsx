import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";
import { resetProgress } from "@/app/dashboard/actions";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = (await getSession()) ?? {
    email: "student@example.com",
    displayName: "Student",
    initials: "ST",
  };
  const { completedLessons, totalLessons } = await getDashboardProgress();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account</h1>
      <p className="mt-1.5 text-muted-foreground">
        Signed in as this browser&apos;s session, see how that works below.
      </p>

      <Card className="mt-8 border-border/70">
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/15 text-lg font-medium text-primary">
              {session.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{session.displayName}</p>
            <p className="text-sm text-muted-foreground">{session.email}</p>
            <Badge variant="secondary" className="mt-2 rounded-full px-3 py-1 text-xs">
              Full course · Lifetime access
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70">
        <CardContent>
          <h2 className="text-sm font-semibold">How sign-in works here</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a demo build with no user database: logging in sets a
            session cookie for the email you typed, and your lesson
            progress is stored the same way, in this browser only. Log out
            and back in with a different email and you&apos;ll land back
            on a fresh account.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70">
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Progress</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedLessons} of {totalLessons} lessons marked complete
                in this browser.
              </p>
            </div>
            <form action={resetProgress}>
              <Button type="submit" variant="outline" size="sm">
                <RotateCcw />
                Reset
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/logout" />}
        className="w-full"
      >
        <LogOut />
        Log out
      </Button>
    </div>
  );
}
