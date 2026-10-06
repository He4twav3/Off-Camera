# Briefing for the lawyer

**Preliminary notes, prepared by an AI assistant from the codebase and from general knowledge. Not legal advice. Please confirm, correct or reject each point.** Rules differ by country and change; nothing here is checked against the specific jurisdictions involved.

## The business in one paragraph
OnCamera is a UGC agency platform. Brands run campaigns; creators (independent contractors) make short-form videos from their own social accounts; OnCamera matches them, manages the work, counts post views, and handles payment. **Planned money flow (updated):** the brand pays the creator's rate to OnCamera, by **bank transfer against an invoice** (no card payments from brands); OnCamera may keep a commission **out of the creator's share**, but the **commission is not decided and the pilot may run at 0%**; the creator is paid only after the brand has paid and the post is approved. Brands pay **no separate agency fee** at launch. Each campaign has its **own payout formula** set with the brand (a fixed fee per video, a rate per 1,000 views, view-milestone bonuses, a cap per creator, and a measurement window), and the contract for that campaign is generated from it. Creators must label posts as paid partnerships.

**How creators receive money (new; built and tested but not yet switched on, so no real money has moved):** when OnCamera releases a creator's share it is credited to a **balance** shown on the creator's Earnings page. The creator **requests a withdrawal** and OnCamera pays it by bank transfer through **Wise** ("send by email", so Wise collects the creator's bank details on its own page and the details never reach OnCamera's site or database). Safeguards in place: each request must be confirmed from an emailed link; a hold of 24 to 72 hours before it can be paid; limits (US$2,000 per 24 hours, 3 requests per hour); requests of US$1,000 or more need one admin to approve and a different admin to pay; admin money actions need two-step (authenticator app) sign-in; admins can freeze a creator's withdrawals; the creator can cancel before payment; every admin action is logged; a daily "books check" confirms balances equal credits minus withdrawals.

## Known facts about the founders (added)
- The founders are connected to **Greece and North Macedonia**; the company is **not registered yet** and the choice of entity/country is open.
- Brands and creators will be located **all over the world**, so the payment stack must work across many countries.
- Open question for the lawyer and accountant: which country is best to register in so that (a) a business bank account and licensed payment providers are available, (b) EU VAT and platform-reporting rules (DAC7) are handled, and (c) the founders' own tax residency doesn't create problems. Candidates discussed: a **Greek** company, a company in another **EU** country (for example Estonia via e-Residency), or a **US LLC**. A company in North Macedonia may have limited access to some payment providers. **Please confirm current availability.**

## What has been decided or built since the first version (added)
- **Payment tools.** Payouts: **Wise Business** (manual batch or single transfers, "send by email"). Brands pay by bank transfer to the company account (a Wise Business account can receive transfers). **Considered and postponed:** Stripe Connect. Our understanding (please confirm): a platform in the EEA can pay connected accounts only in the EEA, UK, US, Canada and Switzerland, topping up a Stripe balance by bank transfer in the EU was in limited preview, and it needs a registered company. Two other providers are integrated in the code **for the optional course checkout only** (Dodo Payments, a merchant of record; NowPayments for crypto), and are switched off while the course is free.
- **Course:** now optional and free; nothing on the platform is locked behind it.
- **Brand-run affiliate links (built, not yet switched on).** A campaign can include an affiliate link supplied by the brand (most brands create theirs in Dub). OnCamera only displays it to assigned creators; any affiliate commission is between the brand and the creator and is not handled or tracked by OnCamera.
- **Optional sample video.** A brand can ask applicants for a short sample video, shared as a **Google Drive link** (OnCamera stores only the link, not the file). The admin and brand see it with the creator's profile.
- **Payment details.** Creators give only a name and a payout email; the email is stored **encrypted** with a key kept outside the database, hidden from lists, and **deleted** once a request is paid, rejected, cancelled or expired (only its first four characters remain). Revealing it is restricted to admins and logged.
- **Registration status.** Not yet registered, so the first campaigns will be run manually and at small scale.

## What we need to know from the founders (to answer properly)
1. Where is the company (or will it be) registered? Where do the founders live?
2. In which countries will brands and creators be located (EU, UK, US, other)?
3. Expected volume in year one (number of campaigns, total money handled).
4. Will money pass through a company bank account, or only through a payment provider?

## Q1. Does taking commission from creators require a talent-agency licence?
**General understanding.** Some places license people who "procure engagements" for performers or creators. In the **US**, California (Talent Agencies Act) and New York (employment/theatrical agency licensing) are the best-known; other states have their own rules. In the **EU/UK** it varies widely and is often tied to employment or modelling agencies; pure influencer marketing is frequently unregulated but not always.
**Common ways businesses reduce this risk:** present the service as marketing/campaign management for the brand rather than representing the creator; sign the brand, not the creator, as the main contract; avoid exclusivity or long-term management of the creator; keep the commission as a service fee on a specific campaign.
**Ask:** For the creators' and the company's locations, does this structure need a licence? If so, which one, and does a "marketing agency, principal-to-principal" structure (Q2, option B) avoid it?

## Q2. Holding brand money before paying creators: payments licence?
**General understanding.** Holding funds for one party and paying them to another can count as a regulated payment or money-transmission activity (EU: payment-services rules, with a "commercial agent" exemption that generally fits poorly when you act for both sides; US: federal money-services-business registration plus state licences). Marketplaces normally use a **licensed payment provider** that holds and splits the funds (for example Stripe Connect, Adyen for Platforms, Mangopay, PayPal Payouts).
**Two ways to structure it:**
- **A. Intermediary:** the brand's money is the creator's money; OnCamera passes it on. Needs a licensed provider to hold and split funds.
- **B. Principal (what many agencies do):** the brand buys a campaign service from OnCamera and pays OnCamera's invoice (the amount is the campaign price). OnCamera separately pays its creators as its own contractors, keeping the difference. This is an ordinary B2B sale rather than money handled for someone else. Economically identical to the "commission out of the creator's share" plan, but the contracts and tax treatment differ.
**Ask:** Which of A or B is appropriate in our jurisdiction? If B: how must the brand and creator contracts change, and what do we say to creators about the "cut" so it is not misleading?
**Follow-up questions raised by what we have built (added):**
1. Creators now see a **balance** and withdraw from it. Does keeping a running balance for each creator (money we owe them, held in our own bank account until they withdraw) amount to holding client money or issuing e-money or a wallet? Would it help to treat it purely as "amount owed to a contractor", and what wording on the site and in the agreements keeps it that way (for example "earnings available to withdraw" rather than "wallet")?
2. We pay withdrawals manually, only after a safety hold of 24 to 72 hours, with the right to freeze or reject a request we suspect is fraudulent. What must the creator agreement say about payment timing, the hold, our right to withhold or reverse a payment, and cancellation?
3. If a creator does not claim a Wise transfer within the 7 days Wise allows, the money returns to us and the withdrawal is rejected back to their balance. Is that acceptable, and how should it be written down?
4. Will you advise whether a **Wise Business** account may be used to pay contractors before the company is registered, or whether the account must wait for registration?

## Q3. Tax and VAT
**General understanding (verify):**
- **Brand invoices:** under B, the invoice is OnCamera's own revenue; VAT/sales tax rules depend on the countries (EU cross-border B2B often uses reverse charge; US sales tax on services is limited and state-specific).
- **Creator payments:** contractors pay their own income tax. A **US** payer paying **US** contractors usually must collect a W-9 and report payments over a threshold (the threshold has been changing, so check the current figure). Paying non-US creators from the US usually involves W-8 forms; paying from the EU/UK involves local reporting.
- **EU platform reporting:** platform operators that facilitate people selling services may have to report sellers' income to tax authorities (the EU "DAC7" rules). Please confirm whether OnCamera is in scope.
**Ask:** Which registrations, forms, invoices and reporting do we need, and from what volume?
**Added:** the withdrawal flow does **not** collect tax forms (W-9, W-8 or equivalents) or tax IDs. At what volume or for which countries must we collect them **before** the first payout, and should the Withdraw button be disabled until they are on file?

## Q4. Entity and governing law
**General understanding.** Operate through a company, not personally, for liability reasons. Choose the entity's country where you can bank and use payment providers. Contract governing law and courts are normally those of the entity.
**Ask:** Which entity type and jurisdiction, and what governing law and courts should the Terms and agreements name? Are there mandatory local rules (consumer, contractor, data) that override our choice?

## Q5. Data protection (GDPR / UK GDPR and similar)
**General understanding.** If there are EU/UK creators or the company is in the EU/UK, OnCamera is the **controller** and needs: a privacy notice (drafted), a lawful basis for each use, **data-processing agreements** with its processors (database/sign-in, hosting, email, scraping/data APIs, payment provider; most offer standard online DPAs), a mechanism for transfers outside the EU/UK, a process for access/deletion requests, and a 72-hour breach-notification process. Only essential cookies (the sign-in session) are used today, which usually need no consent banner; adding analytics changes that.
**Specific items:** (1) The site reads creators' **public** profile and post data via third-party services to verify handles and count views. Please confirm the lawful basis and transparency wording, and whether those platforms' terms permit it. (2) Creators' date of birth is collected to confirm age 18+. (3) Creator tax details will be collected later.
**Added items:** (4) Creators' **payout email and name** are processed for withdrawals and stored encrypted, then deleted after the payment closes; **admin actions are logged with the admin's email** (audit log). Please confirm the lawful basis, the retention periods, and whether the logging needs mention in the privacy notice. (5) **Google Drive sample videos:** only links are stored, but the videos are shared with brands. Please confirm what consent and wording creators need, and who owns and may use a sample that is not selected.
**Ask:** What exactly must be signed, published or recorded before launch?

## Other points to review (not in the original list)
- **Disclosure of paid posts:** OnCamera requires the platform's paid-partnership label or #ad (shown on every campaign, and confirmed by a tick box when a post is submitted). Is that sufficient for the target markets, and who carries responsibility?
- **Platform rules:** brand-paid posts from "new" accounts presented as organic can breach platform rules and advertising rules. The current plan uses creators' own genuine accounts.
- **Contractor classification:** is the planned control over creators (briefs, deadlines, approval) consistent with independent-contractor status?
- **IP and usage rights:** the draft agreements assume creators keep ownership and give the brand campaign-specific usage rights.
- **Advertising claims:** brands remain responsible for product claims; the brand agreement says so.
- **Liability cap, refunds and disputes** wording in the drafts is a placeholder.
- **Affiliate links:** OnCamera shows a brand-supplied affiliate link to assigned creators but does not run or pay the affiliate program. Who is responsible for the affiliate disclosure and for any commission dispute? Should the brand agreement say so expressly?
- **Per-campaign payout formulas:** the contract for each campaign is generated from the formula (fixed fee, rate per views, bonuses, cap, measurement window). Is the generated wording enough, or should the lawyer provide the clauses?

## Documents to review
`terms-of-service.md`, `privacy-policy.md`, `creator-agreement.md`, `brand-agreement.md` (all `[BRACKETS]` need the founders' decisions). **Note:** these drafts were written before the balance and withdrawal system, the per-campaign payout formulas, the affiliate links and the sample videos existed. We will update them once the questions above are answered, so please tell us what they should now say.
