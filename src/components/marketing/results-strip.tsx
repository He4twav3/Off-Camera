import { CheckCircle2, DollarSign, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ResultsStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          What it looks like when it&apos;s working
        </h2>
        <p className="mt-4 text-muted-foreground">
          Illustrative examples of the kind of outcomes the course is built
          to get you toward.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Card className="card-sticker rounded-2xl">
          <CardContent>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MessageCircle className="size-4" />
              Inbox
            </div>
            <div className="mt-4 flex items-start gap-2.5">
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-xs font-medium">
                  BR
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm">
                Hey! Loved your last video, we&apos;d love to have you as
                part of our next campaign. Interested?
              </div>
            </div>
            <div className="mt-2.5 flex justify-end">
              <div className="rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                Yes, I&apos;d love to! Sending my rate card now.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sticker rounded-2xl">
          <CardContent>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Campaign status
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium">3-video UGC package</p>
              <Badge className="pill-outline rounded-full bg-toy-soft text-toy-soft-foreground hover:bg-toy-soft">
                Confirmed
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Deliverables due in 7 days
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Brand</span>
                <span className="text-foreground">DTC skincare co.</span>
              </div>
              <div className="flex justify-between">
                <span>Usage rights</span>
                <span className="text-foreground">30 days paid social</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sticker rounded-2xl">
          <CardContent>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <DollarSign className="size-4" />
              Payment
            </div>
            <p className="mt-4 font-heading text-3xl font-semibold text-primary">
              +$450.00
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Received for 3-video UGC package
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Paid on delivery, net-7
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Illustrative mockups, not real messages or brand names.
      </p>
    </section>
  );
}
