// TEMPORARY preview data: made-up people and numbers. Never committed.
import type { VideoItem } from "@/components/app/VideosCard";
import type { StatementRowData } from "@/app/admin/statements/StatementsView";
import type { BrandCampaign } from "@/lib/brand-data";
import type { BrandStatement } from "@/lib/direct-pay-data";

const day = 86400000;
export const iso = (d: number) => new Date(Date.now() + d * day).toISOString();

export const videos: VideoItem[] = [
  { id: "1", platform: "tiktok", url: "https://www.tiktok.com/@maya/video/7100000000000000001", title: "Skincare routine in 20 seconds" },
  { id: "2", platform: "instagram", url: "https://www.instagram.com/reel/AbC123xyz/", title: "Unboxing: protein bars" },
  { id: "3", platform: "youtube_shorts", url: "https://www.youtube.com/shorts/AbC123xyz", title: null },
  { id: "4", platform: "tiktok", url: "https://www.tiktok.com/@maya/video/7100000000000000004", title: "App walkthrough" },
];

const person = (name: string, handle: string) => ({ name, email: `${handle}@example.com`, handle });
const job = (title: string, brand: string | null) => ({ title, brand_accounts: brand ? { company_name: brand } : null });
const dp = (o: Partial<NonNullable<StatementRowData["direct_payments"]>> & { amount: number }) => ({
  id: crypto.randomUUID(), cycle: 1, issued_at: iso(-10), due_at: iso(4), brand_paid_at: null, brand_method: null, brand_reference: null,
  creator_confirmed_at: null, creator_disputed_at: null, creator_dispute_note: null, our_fee: 20, fee_received_at: null, ...o,
});
let n = 0;
const row = (p: Partial<StatementRowData> & Pick<StatementRowData, "applicants" | "jobs" | "state">): StatementRowData => ({
  id: `r${n++}`, status: "submitted", views: 0, proof_url: "https://www.tiktok.com/@example/video/1", suggested: null, direct_payments: null, ...p,
});

export const statementRows: StatementRowData[] = [
  row({ applicants: person("Maya Rivers", "mayarivers"), jobs: job("Skincare launch", "Glow Labs"), state: "disputed",
    direct_payments: dp({ amount: 180, brand_paid_at: iso(-3), brand_method: "PayPal", creator_disputed_at: iso(-1), creator_dispute_note: "Nothing has arrived in my PayPal yet." }) }),
  row({ applicants: person("Jonas Weber", "jonasweber"), jobs: job("App walkthrough", "Pocket Pay"), state: "overdue", direct_payments: dp({ amount: 240, due_at: iso(-3), our_fee: 36 }) }),
  row({ applicants: person("Ana Costa", "anacosta"), jobs: job("Skincare launch", "Glow Labs"), state: null, views: 12400, suggested: 99 }),
  row({ applicants: person("Leo Park", "leopark"), jobs: job("Snack taste test", null), state: null, views: 3100, suggested: 40 }),
  row({ applicants: person("Sofia Marin", "sofiamarin"), jobs: job("App walkthrough", "Pocket Pay"), state: "awaiting_payment", direct_payments: dp({ amount: 150 }) }),
  row({ applicants: person("Tomas Novak", "tomasnovak"), jobs: job("Snack taste test", "Crunch Co"), state: "brand_says_paid",
    direct_payments: dp({ amount: 120, brand_paid_at: iso(-1), brand_method: "Wise", brand_reference: "WISE-4821" }) }),
  row({ applicants: person("Ines Duarte", "inesduarte"), jobs: job("Skincare launch", "Glow Labs"), state: "confirmed",
    direct_payments: dp({ amount: 99, brand_paid_at: iso(-8), brand_method: "Bank transfer", creator_confirmed_at: iso(-6), fee_received_at: iso(-5) }) }),
];

const st = (o: Record<string, unknown>) => ({
  id: crypto.randomUUID(), amount: 100, issued_at: iso(-9), due_at: iso(5), brand_paid_at: null, brand_method: null, brand_reference: null,
  creator_confirmed_at: null, creator_disputed_at: null, campaign: "Skincare launch", creatorName: "Maya Rivers", creatorHandle: "mayarivers", payTo: "https://buy.stripe.com/test_abc123XYZ", ...o,
});
export const brandStatements = [
  st({ amount: 180 }),
  st({ amount: 99, creatorName: "Ana Costa", creatorHandle: "anacosta", due_at: iso(-2), payTo: null }),
  st({ amount: 120, creatorName: "Tomas Novak", creatorHandle: "tomasnovak", brand_paid_at: iso(-1), brand_method: "Wise", brand_reference: "WISE-4821" }),
  st({ amount: 75, creatorName: "Ines Duarte", creatorHandle: "inesduarte", brand_paid_at: iso(-8), brand_method: "Bank transfer", creator_confirmed_at: iso(-6) }),
] as unknown as BrandStatement[];

export const brandCampaigns: BrandCampaign[] = [
  { id: "c1", title: "Skincare launch", platform: "tiktok", status: "open", logoUrl: null, createdAt: iso(-20), totalViews: 38200, creators: [
    { assignmentId: "a1", name: "Maya Rivers", handle: "mayarivers", platform: "tiktok", status: "submitted", proofUrl: "https://www.tiktok.com/@x/video/1", views: 21400, pay: null },
    { assignmentId: "a2", name: "Ana Costa", handle: "anacosta", platform: "tiktok", status: "paid", proofUrl: "https://www.tiktok.com/@y/video/2", views: 12400, pay: null },
    { assignmentId: "a3", name: "Leo Park", handle: "leopark", platform: "tiktok", status: "active", proofUrl: null, views: 0, pay: null },
  ] },
  { id: "c2", title: "Snack taste test", platform: "instagram", status: "filled", logoUrl: null, createdAt: iso(-45), totalViews: 9100, creators: [
    { assignmentId: "a4", name: "Tomas Novak", handle: "tomasnovak", platform: "instagram", status: "paid", proofUrl: "https://www.instagram.com/reel/1", views: 9100, pay: null },
  ] },
];
