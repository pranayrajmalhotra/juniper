-- Juniper Club — Phase 3: site_content
-- A single generic key/value store for every editable section of editorial copy
-- across the public site. Pages opt in with data-cms / data-cms-html /
-- data-cms-src attributes; js/cms-render.js hydrates them; the Admin → Content
-- tab edits them. Idempotent — safe to re-run (seed uses on-conflict-do-nothing,
-- so admin edits are never clobbered).

create table if not exists public.site_content (
  id            uuid primary key default gen_random_uuid(),
  page          text not null,                       -- 'home','directory','offers','venue','events','drift','support'
  section       text not null,                       -- machine name of the section
  item_key      text not null,                       -- machine name of the field
  label         text not null,                       -- human label shown in the admin
  value         text,                                -- the content (text / html / image URL)
  kind          text not null default 'text'
                  check (kind in ('text','longtext','image')),
  display_order integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (page, section, item_key)
);

create index if not exists site_content_page_idx
  on public.site_content (page, display_order);

alter table public.site_content enable row level security;

drop policy if exists "site_content_public_read"  on public.site_content;
drop policy if exists "site_content_admin_insert" on public.site_content;
drop policy if exists "site_content_admin_update" on public.site_content;
drop policy if exists "site_content_admin_delete" on public.site_content;

create policy "site_content_public_read"
  on public.site_content for select
  using (true);

create policy "site_content_admin_insert"
  on public.site_content for insert to authenticated
  with check (public.is_admin());

create policy "site_content_admin_update"
  on public.site_content for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "site_content_admin_delete"
  on public.site_content for delete to authenticated
  using (public.is_admin());

-- updated_at trigger — self-contained so 007 runs even if migration 005
-- was never applied (create-or-replace is harmless if it already exists).
create or replace function public.set_updated_at() returns trigger as $func$
begin new.updated_at := now(); return new; end;
$func$ language plpgsql;

drop trigger if exists trg_site_content_updated on public.site_content;
create trigger trg_site_content_updated
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- ============================================================
-- Seed — current copy for every wired field. Dollar-quoted so
-- apostrophes / quotes / inline HTML need no escaping.
-- ============================================================
insert into public.site_content (page, section, item_key, label, value, kind, display_order)
values
  -- ── home ──────────────────────────────────────────────
  ('home','hero','eyebrow','Hero · eyebrow',$$Tonight in the city$$,'text',10),
  ('home','hero','headline_1','Hero · headline line 1',$$An evening,$$,'text',20),
  ('home','hero','headline_2','Hero · headline line 2 (italic)',$$unhurried.$$,'text',30),
  ('home','hero','body','Hero · body paragraph',$$A quiet list of the city's most considered tables, bars, and ateliers — curated for a small membership that prefers the door <em class="font-display italic">held open</em>, not announced.$$,'longtext',40),
  ('home','hero','cta_primary','Hero · primary button',$$View Tonight's Offer$$,'text',50),
  ('home','hero','cta_secondary','Hero · secondary button',$$Apply for Membership$$,'text',60),
  ('home','hero','ribbon_label','Hero · ribbon label',$$Tonight$$,'text',70),
  ('home','hero','ribbon_text','Hero · ribbon text',$$Complimentary signature gin flight · Tasting menu open from 7 PM$$,'text',80),
  ('home','hero','image','Hero · portrait image URL',null,'image',90),
  ('home','hero','caption','Hero · figure caption',$$<em>Photograph —</em> the back bar at the Velvet Botanist, Mayfair. Member access, all evenings.$$,'longtext',100),
  ('home','logos','eyebrow','Partner logos · eyebrow',$$In quiet company with —$$,'text',110),
  ('home','bento','eyebrow','New partnerships · eyebrow',$$No. 02 — New Partnerships$$,'text',120),
  ('home','bento','headline_1','New partnerships · headline part 1',$$Curated additions, $$,'text',130),
  ('home','bento','headline_2','New partnerships · headline part 2 (italic)',$$this season.$$,'text',140),
  ('home','bento','link','New partnerships · link',$$Explore the directory →$$,'text',150),
  ('home','bento','f1_name','Feature 1 · name',$$Marble & Moss$$,'text',160),
  ('home','bento','f1_perk','Feature 1 · perk',$$20% off — all brunch items$$,'text',170),
  ('home','bento','f1_image','Feature 1 · image URL',null,'image',180),
  ('home','bento','f2_name','Feature 2 · name',$$Apex Lounge$$,'text',190),
  ('home','bento','f2_perk','Feature 2 · perk',$$15% off cocktails$$,'text',200),
  ('home','bento','f2_image','Feature 2 · image URL',null,'image',210),
  ('home','bento','f3_name','Feature 3 · name',$$Cacao Archive$$,'text',220),
  ('home','bento','f3_perk','Feature 3 · perk',$$Complimentary appetiser$$,'text',230),
  ('home','bento','f3_image','Feature 3 · image URL',null,'image',240),
  ('home','favourites','eyebrow','Member favourites · eyebrow',$$No. 03 — Member Favourites$$,'text',250),
  ('home','favourites','headline_1','Member favourites · headline part 1',$$Quietly, $$,'text',260),
  ('home','favourites','headline_2','Member favourites · headline part 2 (italic)',$$enduringly$$,'text',270),
  ('home','favourites','headline_3','Member favourites · headline part 3',$$, ours.$$,'text',280),
  ('home','cta','eyebrow','Membership CTA · eyebrow',$$No. 04 — Apply$$,'text',290),
  ('home','cta','headline_1','Membership CTA · headline line 1',$$Host your own,$$,'text',300),
  ('home','cta','headline_2','Membership CTA · headline line 2 (italic)',$$private evening.$$,'text',310),
  ('home','cta','body','Membership CTA · body',$$Members may take over partner venues for gatherings of twelve to a hundred, with a dedicated concierge planning each detail from cellar to soundtrack.$$,'longtext',320),
  ('home','cta','cta_primary','Membership CTA · primary button',$$Inquire about an event$$,'text',330),
  ('home','cta','cta_secondary','Membership CTA · secondary button',$$Apply for membership$$,'text',340),

  -- ── directory ─────────────────────────────────────────
  ('directory','toolbar','label','Filter toolbar · label',$$Filter by category$$,'text',10),
  ('directory','logos','eyebrow','Partner logos · eyebrow',$$In quiet company with —$$,'text',20),
  ('directory','newsletter','eyebrow','Newsletter · eyebrow',$$No. 05 — Quietly Curated$$,'text',30),
  ('directory','newsletter','headline_1','Newsletter · headline part 1',$$New partners $$,'text',40),
  ('directory','newsletter','headline_2','Newsletter · headline part 2 (italic)',$$added quietly,$$,'text',50),
  ('directory','newsletter','headline_3','Newsletter · headline part 3',$$ by invitation.$$,'text',60),
  ('directory','newsletter','body','Newsletter · body',$$A short note to your inbox when something joins the list — never more than once a fortnight.$$,'longtext',70),
  ('directory','newsletter','cta','Newsletter · button',$$Join the list$$,'text',80),

  -- ── offers ────────────────────────────────────────────
  ('offers','toolbar','hint','Filter toolbar · hint',$$Tap a card for the venue$$,'text',10),

  -- ── venue (shared across every venue detail page) ──────
  ('venue','dateline','back','Dateline · back link',$$The Directory$$,'text',10),
  ('venue','dateline','label','Dateline · label',$$Partner Venue$$,'text',20),
  ('venue','dateline','label_serif','Dateline · label (serif)',$$— Member Privilege$$,'text',30),
  ('venue','benefits','eyebrow','Member benefits · eyebrow',$$No. 01 — Member Benefits$$,'text',40),
  ('venue','location','eyebrow','Location · eyebrow',$$No. 02 — Where to find it$$,'text',50),
  ('venue','location','headline_1','Location · headline part 1',$$Find your way $$,'text',60),
  ('venue','location','headline_2','Location · headline part 2 (italic)',$$in.$$,'text',70),
  ('venue','location','neighbourhood_label','Location · neighbourhood label',$$Neighbourhood$$,'text',80),
  ('venue','location','access_label','Location · access label',$$Access$$,'text',90),
  ('venue','location','access_text','Location · access text',$$Present your digital member pass to staff on arrival.$$,'longtext',100),
  ('venue','location','maps_cta','Location · maps button',$$Open in Maps$$,'text',110),
  ('venue','sidebar','status_label','Offer sidebar · status label',$$Redemption Status$$,'text',120),
  ('venue','sidebar','status_value','Offer sidebar · status value',$$Active Offer$$,'text',130),
  ('venue','sidebar','point_1','Offer sidebar · point 1',$$Valid for 1 member + 3 guests$$,'text',140),
  ('venue','sidebar','point_2','Offer sidebar · point 2',$$One redemption per 24 hours$$,'text',150),
  ('venue','sidebar','point_3','Offer sidebar · point 3',$$Show digital pass on arrival$$,'text',160),
  ('venue','sidebar','redeem_cta','Offer sidebar · redeem button',$$Redeem Offer$$,'text',170),
  ('venue','sidebar','footnote','Offer sidebar · footnote',$$Present digital pass to staff upon arrival$$,'text',180),
  ('venue','terms','heading','Terms · heading',$$Terms & Conditions$$,'text',190),
  ('venue','terms','term_1','Terms · item 1',$$Advance booking recommended via the Juniper Club Concierge.$$,'longtext',200),
  ('venue','terms','term_2','Terms · item 2',$$Offer not valid with other seasonal promotions.$$,'longtext',210),
  ('venue','terms','term_3','Terms · item 3',$$Membership verification required via live digital ID.$$,'longtext',220),
  ('venue','terms','term_4','Terms · item 4',$$Smart-elegant dress code strictly enforced.$$,'longtext',230),

  -- ── events ────────────────────────────────────────────
  ('events','featured','eyebrow','Featured event · eyebrow',$$No. 01 — Next on the calendar$$,'text',10),
  ('events','featured','headline_1','Featured event · headline part 1',$$The featured $$,'text',20),
  ('events','featured','headline_2','Featured event · headline part 2 (italic)',$$evening.$$,'text',30),
  ('events','featured','aside','Featured event · aside note',$$Members may reserve$$,'text',40),
  ('events','featured','image','Featured event · image URL',null,'image',50),
  ('events','featured','badge','Featured event · badge',$$Featured Event$$,'text',60),
  ('events','featured','date_day','Featured event · date day',$$14$$,'text',70),
  ('events','featured','date_month','Featured event · date month',$$June 2026$$,'text',80),
  ('events','featured','date_time','Featured event · weekday & time',$$Saturday · from 8 PM$$,'text',90),
  ('events','featured','title_1','Featured event · title part 1',$$The Midsummer $$,'text',100),
  ('events','featured','title_2','Featured event · title part 2 (italic)',$$Cellar Dinner$$,'text',110),
  ('events','featured','venue','Featured event · venue line',$$Perch Wine & Coffee Bar · Vasant Vihar$$,'text',120),
  ('events','featured','description','Featured event · description',$$A seven-course collaboration between Perch's sommelier and a visiting chef — each course drawn up against a bottle pulled from the back of the cellar. One long table, one unhurried evening.$$,'longtext',130),
  ('events','featured','meta1_label','Featured event · meta 1 label',$$Seating$$,'text',140),
  ('events','featured','meta1_value','Featured event · meta 1 value',$$Twenty-four covers$$,'text',150),
  ('events','featured','meta2_label','Featured event · meta 2 label',$$Open to$$,'text',160),
  ('events','featured','meta2_value','Featured event · meta 2 value',$$All members$$,'text',170),
  ('events','featured','cta_primary','Featured event · primary button',$$Reserve a place$$,'text',180),
  ('events','featured','cta_secondary','Featured event · secondary button',$$About the venue$$,'text',190),
  ('events','calendar','eyebrow','Calendar · eyebrow',$$No. 02 — Also on the calendar$$,'text',200),
  ('events','calendar','e1_date','Calendar · event 1 date',$$28 June 2026$$,'text',210),
  ('events','calendar','e1_title','Calendar · event 1 title',$$Negroni Hour$$,'text',220),
  ('events','calendar','e1_desc','Calendar · event 1 description',$$A bartender's table at Sidecar — eighteen negroni variations poured and talked through, one by one.$$,'longtext',230),
  ('events','calendar','e1_venue','Calendar · event 1 venue',$$Sidecar · Greater Kailash II$$,'text',240),
  ('events','calendar','e2_date','Calendar · event 2 date',$$11 July 2026$$,'text',250),
  ('events','calendar','e2_title','Calendar · event 2 title',$$After Dark — A DRIFT Session$$,'text',260),
  ('events','calendar','e2_desc','Calendar · event 2 description',$$A late listening session behind the unmarked door at PCO, programmed with the DRIFT residency.$$,'longtext',270),
  ('events','calendar','e2_venue','Calendar · event 2 venue',$$PCO · Vasant Vihar$$,'text',280),
  ('events','past','eyebrow','Past evenings · eyebrow',$$No. 03 — Past evenings$$,'text',290),
  ('events','past','headline_1','Past evenings · headline part 1',$$Lately, in good $$,'text',300),
  ('events','past','headline_2','Past evenings · headline part 2 (italic)',$$company.$$,'text',310),
  ('events','past','intro','Past evenings · intro',$$A look back at the gatherings our members have shared across partner rooms this season.$$,'longtext',320),
  ('events','past','tile1_image','Gallery tile 1 · image URL',null,'image',330),
  ('events','past','tile1_title','Gallery tile 1 · title',$$The Spring Tasting$$,'text',340),
  ('events','past','tile1_sub','Gallery tile 1 · caption',$$March · Mason$$,'text',350),
  ('events','past','tile2_image','Gallery tile 2 · image URL',null,'image',360),
  ('events','past','tile2_title','Gallery tile 2 · title',$$Founders' Dinner$$,'text',370),
  ('events','past','tile2_sub','Gallery tile 2 · caption',$$February · Sidecar$$,'text',380),
  ('events','past','tile3_image','Gallery tile 3 · image URL',null,'image',390),
  ('events','past','tile3_title','Gallery tile 3 · title',$$A Night of Mezcal$$,'text',400),
  ('events','past','tile3_sub','Gallery tile 3 · caption',$$February · Lord of the Drinks$$,'text',410),
  ('events','past','tile4_image','Gallery tile 4 · image URL',null,'image',420),
  ('events','past','tile4_title','Gallery tile 4 · title',$$The Winter Salon$$,'text',430),
  ('events','past','tile4_sub','Gallery tile 4 · caption',$$January · Townhall$$,'text',440),
  ('events','past','tile5_image','Gallery tile 5 · image URL',null,'image',450),
  ('events','past','tile5_title','Gallery tile 5 · title',$$The Gin Atelier$$,'text',460),
  ('events','past','tile5_sub','Gallery tile 5 · caption',$$December · The Drunken Botanist$$,'text',470),
  ('events','past','tile6_image','Gallery tile 6 · image URL',null,'image',480),
  ('events','past','tile6_title','Gallery tile 6 · title',$$New Year's Eve$$,'text',490),
  ('events','past','tile6_sub','Gallery tile 6 · caption',$$December · Hauz Khas Social$$,'text',500),
  ('events','past','tile7_image','Gallery tile 7 · image URL',null,'image',510),
  ('events','past','tile7_title','Gallery tile 7 · title',$$Cellar Notes$$,'text',520),
  ('events','past','tile7_sub','Gallery tile 7 · caption',$$November · Perch$$,'text',530),
  ('events','past','tile8_image','Gallery tile 8 · image URL',null,'image',540),
  ('events','past','tile8_title','Gallery tile 8 · title',$$The Long Table$$,'text',550),
  ('events','past','tile8_sub','Gallery tile 8 · caption',$$November · Tres$$,'text',560),
  ('events','cta','eyebrow','Inquiry CTA · eyebrow',$$No. 04 — Inquire$$,'text',570),
  ('events','cta','headline_1','Inquiry CTA · headline part 1',$$Tell us what you $$,'text',580),
  ('events','cta','headline_2','Inquiry CTA · headline part 2 (italic)',$$have in mind.$$,'text',590),
  ('events','cta','body','Inquiry CTA · body',$$Drop a note with date, headcount, and the venue you have your heart set on (or ask us to suggest). We respond within one business day.$$,'longtext',600),
  ('events','cta','cta_primary','Inquiry CTA · primary button',$$Email the concierge$$,'text',610),
  ('events','cta','cta_secondary','Inquiry CTA · secondary button',$$Call us$$,'text',620),
  ('events','notes','eyebrow','Practical notes · eyebrow',$$No. 05 — Practical notes$$,'text',630),
  ('events','notes','n1_label','Practical notes · 1 label',$$Typical lead time$$,'text',640),
  ('events','notes','n1_text','Practical notes · 1 text',$$Three weeks for tasting tables. Six for floor takeovers.$$,'longtext',650),
  ('events','notes','n2_label','Practical notes · 2 label',$$Cancellation$$,'text',660),
  ('events','notes','n2_text','Practical notes · 2 text',$$Free up to seventy-two hours before. Venue policies apply thereafter — we'll tell you.$$,'longtext',670),
  ('events','notes','n3_label','Practical notes · 3 label',$$Guest list$$,'text',680),
  ('events','notes','n3_text','Practical notes · 3 text',$$Members may include non-member guests up to the venue's discretion. ID at the door.$$,'longtext',690),

  -- ── drift ─────────────────────────────────────────────
  ('drift','hero','eyebrow','Hero · eyebrow',$$An after-hours residency$$,'text',10),
  ('drift','hero','headline_1','Hero · headline part 1',$$DRIFT$$,'text',20),
  ('drift','hero','headline_2','Hero · headline part 2 (italic)',$$— the room shifts$$,'text',30),
  ('drift','hero','body','Hero · body',$$When the kitchens have closed and the candles burn lower, the floor opens. <em class="font-display italic text-bone">Drift</em> is Juniper Club's late-night sound programme — a small, selectively-booked rotation of DJs across our partner rooms.$$,'longtext',40),
  ('drift','hero','cta_primary','Hero · primary button',$$See Upcoming$$,'text',50),
  ('drift','hero','cta_secondary','Hero · secondary button',$$Meet the Residents$$,'text',60),
  ('drift','hero','ribbon_label','Hero · ribbon label',$$From midnight$$,'text',70),
  ('drift','hero','ribbon_text','Hero · ribbon text',$$Members admitted first · Plus-one on the door$$,'text',80),
  ('drift','upcoming','eyebrow','Upcoming · eyebrow',$$No. 01 — Upcoming nights$$,'text',90),
  ('drift','upcoming','headline_1','Upcoming · headline part 1',$$On the calendar, $$,'text',100),
  ('drift','upcoming','headline_2','Upcoming · headline part 2 (italic)',$$unannounced.$$,'text',110),
  ('drift','upcoming','link','Upcoming · link',$$Request the guest list →$$,'text',120),
  ('drift','residents','eyebrow','Residents · eyebrow',$$No. 02 — The selectors$$,'text',130),
  ('drift','residents','headline_1','Residents · headline part 1',$$Drift residents, $$,'text',140),
  ('drift','residents','headline_2','Residents · headline part 2 (italic)',$$on rotation.$$,'text',150),
  ('drift','residents','intro','Residents · intro',$$A small house — chosen for taste, restraint and a feel for the room. Bookings sit at three sets a month, no more.$$,'longtext',160),
  ('drift','programming','eyebrow','Programming · eyebrow',$$No. 03 — Programming$$,'text',170),
  ('drift','programming','headline_1','Programming · headline part 1',$$A sound for $$,'text',180),
  ('drift','programming','headline_2','Programming · headline part 2 (italic)',$$the small hours.$$,'text',190),
  ('drift','programming','p1_label','Programming · 1 label',$$Selectors$$,'text',200),
  ('drift','programming','p1_text','Programming · 1 text',$$Booked for restraint and feel. No headliners. Sets sit between ninety minutes and three hours.$$,'longtext',210),
  ('drift','programming','p2_label','Programming · 2 label',$$The room$$,'text',220),
  ('drift','programming','p2_text','Programming · 2 text',$$Always small. Never advertised. The capacity matches the venue's late-night seating, not its dancefloor.$$,'longtext',230),
  ('drift','programming','p3_label','Programming · 3 label',$$The door$$,'text',240),
  ('drift','programming','p3_text','Programming · 3 text',$$Members enter first. Plus-ones are welcome but counted. The list closes when the room is full.$$,'longtext',250),
  ('drift','programming','p4_label','Programming · 4 label',$$The hour$$,'text',260),
  ('drift','programming','p4_text','Programming · 4 text',$$From eleven, sometimes ten. Until the venue's licence sleeps — and occasionally a little later.$$,'longtext',270),
  ('drift','archive','eyebrow','Archive · eyebrow',$$No. 04 — Archive$$,'text',280),
  ('drift','archive','headline_1','Archive · headline part 1',$$Drift, $$,'text',290),
  ('drift','archive','headline_2','Archive · headline part 2 (italic)',$$in retrospect.$$,'text',300),
  ('drift','archive','stat','Archive · stat line',$$Sixteen nights · Eight rooms · Twenty-two selectors$$,'text',310),
  ('drift','cta','eyebrow','Booking CTA · eyebrow',$$No. 05 — Two ways in$$,'text',320),
  ('drift','cta','headline_1','Booking CTA · headline part 1',$$For the floor, or $$,'text',330),
  ('drift','cta','headline_2','Booking CTA · headline part 2 (italic)',$$the booth.$$,'text',340),
  ('drift','cta','body','Booking CTA · body',$$Members on the guest list, selectors on the booking list. Tell us which one — and bring something to listen to.$$,'longtext',350),
  ('drift','cta','cta_primary','Booking CTA · primary button',$$Join the guest list$$,'text',360),
  ('drift','cta','cta_secondary','Booking CTA · secondary button',$$Submit a mix$$,'text',370),

  -- ── support ───────────────────────────────────────────
  ('support','hero','dateline','Hero · dateline (serif)',$$— Help & Concierge$$,'text',10),
  ('support','hero','hours','Hero · hours note',$$9 AM – 11 PM · Every day$$,'text',20),
  ('support','hero','eyebrow','Hero · eyebrow',$$Help & Concierge$$,'text',30),
  ('support','hero','headline_1','Hero · headline line 1',$$How can we$$,'text',40),
  ('support','hero','headline_2','Hero · headline line 2 (italic)',$$help you?$$,'text',50),
  ('support','hero','body','Hero · body',$$For anything membership-related, redemption-related, or just a question about a venue — your concierge is <em class="font-display italic">one click away.</em>$$,'longtext',60),
  ('support','contact','eyebrow','Contact · eyebrow',$$No. 01 — Reach the desk$$,'text',70),
  ('support','contact','c1_title','Contact · email title',$$Email$$,'text',80),
  ('support','contact','c1_desc','Contact · email description',$$For non-urgent questions and inquiries.$$,'text',90),
  ('support','contact','c1_value','Contact · email value',$$concierge@juniper.club$$,'text',100),
  ('support','contact','c2_title','Contact · call title',$$Call$$,'text',110),
  ('support','contact','c2_desc','Contact · call description',$$9 AM – 11 PM, every day.$$,'text',120),
  ('support','contact','c2_value','Contact · call value',$$+91 11 4000 0000$$,'text',130),
  ('support','contact','c3_title','Contact · WhatsApp title',$$WhatsApp$$,'text',140),
  ('support','contact','c3_desc','Contact · WhatsApp description',$$Fastest for last-minute reservations.$$,'text',150),
  ('support','contact','c3_value','Contact · WhatsApp value',$$Open chat →$$,'text',160),
  ('support','faq','eyebrow','FAQ · eyebrow',$$No. 02 — Common questions$$,'text',170),
  ('support','faq','headline_1','FAQ · headline part 1',$$Questions, $$,'text',180),
  ('support','faq','headline_2','FAQ · headline part 2 (italic)',$$answered.$$,'text',190),
  ('support','faq','q1','FAQ · question 1',$$How do I redeem an offer at a partner venue?$$,'text',200),
  ('support','faq','a1','FAQ · answer 1',$$Open the offer page on your phone before you arrive and tap <span class="font-semibold text-primary">Redeem Offer</span>. Show the resulting digital pass to the host. Some venues will also ask for a quick membership check via your registered email.$$,'longtext',210),
  ('support','faq','q2','FAQ · question 2',$$When does my subscription renew?$$,'text',220),
  ('support','faq','a2','FAQ · answer 2',$$Membership runs annually from your join date. We'll send a reminder 45 days before expiry. To renew now or upgrade your tier, <a href="mailto:concierge@juniper.club?subject=Membership%20Renewal" class="text-primary underline underline-offset-2">drop the concierge a line</a> and we'll process it within one business day.$$,'longtext',230),
  ('support','faq','q3','FAQ · question 3',$$Can I bring guests?$$,'text',240),
  ('support','faq','a3','FAQ · answer 3',$$Yes — most member benefits include "1 member + 3 guests" by default. Some signature programming (the Platinum series, certain private events) is members-only. The offer page will tell you the limit per venue.$$,'longtext',250),
  ('support','faq','q4','FAQ · question 4',$$I haven't received my verification email.$$,'text',260),
  ('support','faq','a4','FAQ · answer 4',$$Check spam, then your "Promotions" tab. If still missing after ten minutes, sign up again with the same email — the system will resend. Persistent issue? <a href="mailto:concierge@juniper.club?subject=Verification%20email%20issue" class="text-primary underline underline-offset-2">Email us</a> with the address you used and we'll resolve it manually.$$,'longtext',270),
  ('support','faq','q5','FAQ · question 5',$$Can a venue refuse a Juniper redemption?$$,'text',280),
  ('support','faq','a5','FAQ · answer 5',$$Only in very specific cases — private events, blackout dates clearly noted on the offer, or dress-code mismatches at members' clubs. If you ever feel unfairly refused a benefit, message the concierge with a screenshot and we'll mediate the same day.$$,'longtext',290),
  ('support','faq','q6','FAQ · question 6',$$How do I propose a new partner venue?$$,'text',300),
  ('support','faq','a6','FAQ · answer 6',$$We love this question. Email <a href="mailto:partnerships@juniper.club" class="text-primary underline underline-offset-2">partnerships@juniper.club</a> with the venue name, your relationship to it (regular, friend of the owner, etc.) and what you think makes it fit our roster. We curate quietly; the average waiting list is six months.$$,'longtext',310),
  ('support','account','eyebrow','Account · eyebrow',$$No. 03 — Account$$,'text',320),
  ('support','account','headline_1','Account · headline part 1',$$Manage your $$,'text',330),
  ('support','account','headline_2','Account · headline part 2 (italic)',$$membership.$$,'text',340),
  ('support','account','a1_title','Account · card 1 title',$$Renew or upgrade$$,'text',350),
  ('support','account','a1_desc','Account · card 1 description',$$Drop a note to the concierge — we'll handle the rest.$$,'text',360),
  ('support','account','a2_title','Account · card 2 title',$$Update details$$,'text',370),
  ('support','account','a2_desc','Account · card 2 description',$$Email, phone, or preferred name.$$,'text',380),
  ('support','account','a3_title','Account · card 3 title',$$Suggest a venue$$,'text',390),
  ('support','account','a3_desc','Account · card 3 description',$$Help us curate.$$,'text',400),
  ('support','account','a4_title','Account · card 4 title',$$Pause or cancel$$,'text',410),
  ('support','account','a4_desc','Account · card 4 description',$$No-questions-asked.$$,'text',420)
on conflict (page, section, item_key) do nothing;
