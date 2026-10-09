// TEMPORARY preview index. Never committed.
import Link from "next/link";

const pages = [
  ["Start here: Campaigns (only Getimg exists)", "/preview/campaigns"],
  ["Getimg, before joining", "/preview/getimg"],
  ["Getimg, joined (nothing posted yet)", "/preview/getimg?joined=1"],
  ["Submissions (empty)", "/preview/submissions"],
  ["Earnings (empty)", "/preview/earnings"],
  ["Profile (new creator)", "/preview/profile"],
  ["Accounts (empty)", "/preview/accounts"],
  ["Videos (empty)", "/preview/videos"],
  ["Payments (empty)", "/preview/payments"],
  ["Demo with made-up posts: creator view", "/preview/getimg?demo=1"],
  ["Demo with made-up posts: brand view", "/preview/brand-getimg"],
  ["Demo with made-up posts: admin statements", "/preview/admin-getimg"],
];

export default function Index() {
  return (
    <div className="dark-invert relative z-10 min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading text-2xl font-semibold">Preview</h1>
        <p className="mt-2 text-sm text-muted-foreground">The first nine are the real, empty state. The last three use made-up posts so you can see the tracking.</p>
        <ul className="mt-6 flex flex-col gap-2">
          {pages.map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="block rounded-xl border border-border/70 bg-card px-4 py-3 text-[15px] font-medium hover:bg-muted/40">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
