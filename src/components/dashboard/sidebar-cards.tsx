import Link from "next/link";
import { Download, Mail, MessageCircle, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { siteConfig } from "@/lib/site-config";

// Real files, actually downloadable, not decorative links to "#".
const downloads = [
  {
    icon: FileText,
    label: "Pitch email templates",
    href: "/downloads/pitch-email-templates.txt",
  },
  {
    icon: FileText,
    label: "Contract template",
    href: "/downloads/contract-template.txt",
  },
];

export async function SidebarCards() {
  const session = (await getSession()) ?? {
    email: "student@example.com",
    displayName: "Student",
    initials: "ST",
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardContent className="flex flex-col items-center text-center">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/15 text-lg font-medium text-primary">
              {session.initials}
            </AvatarFallback>
          </Avatar>
          <p className="mt-3 text-sm font-medium">{session.displayName}</p>
          <p className="text-xs text-muted-foreground">{session.email}</p>
          <Badge variant="secondary" className="mt-3 rounded-full px-3 py-1 text-xs">
            Full course · Lifetime access
          </Badge>
          <Separator className="my-4" />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            nativeButton={false}
            render={<Link href="/course" />}
          >
            View course details
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent>
          <h3 className="text-sm font-semibold">Resources</h3>
          <ul className="mt-3 space-y-1">
            {downloads.map((r) => (
              <li key={r.label}>
                <a
                  href={r.href}
                  download
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <r.icon className="size-4" />
                  {r.label}
                  <Download className="ml-auto size-3.5 opacity-60" />
                </a>
              </li>
            ))}
            <li>
              {siteConfig.communityUrl ? (
                <a
                  href={siteConfig.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <MessageCircle className="size-4" />
                  Join the private community
                </a>
              ) : (
                <a
                  href={`mailto:${siteConfig.contactEmail}?subject=Private%20community%20access`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="No live invite link yet — this emails us to ask instead of pretending one exists"
                >
                  <Mail className="size-4" />
                  Request community access
                </a>
              )}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
