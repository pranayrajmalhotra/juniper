-- Juniper Club — seed 10 well-known Delhi bars.
-- Names are publicly known; descriptions are fresh editorial copy.
-- Images are Picsum placeholders (deterministic per seed) — replace via Admin once real photos are licensed.
-- Run AFTER 001_schema.sql.

insert into public.venues
  (name, slug, category, area, city, description, image_url, perks, is_featured, display_order)
values
  ('Sidecar', 'sidecar', 'cocktail', 'Greater Kailash II', 'Delhi',
   'A two-time Asia''s 50 Best Bars laureate where head bartender Yangdup Lama coaxes single-origin Indian botanicals into globally fluent drinks. Tucked into M-block — easy to miss, impossible to forget.',
   'https://picsum.photos/seed/jc-sidecar/1200/800',
   '["Priority booking", "Complimentary signature negroni", "10% off the bill"]'::jsonb,
   true, 100),

  ('PCO (Pass Code Only)', 'pco', 'speakeasy', 'Vasant Vihar', 'Delhi',
   'A speakeasy you enter through an unmarked door and a rotating password. Inside: low light, leather banquettes and a list that runs from prohibition classics to bartender''s-choice flights.',
   'https://picsum.photos/seed/jc-pco/1200/800',
   '["Member-only entry", "Signature cocktail of the month"]'::jsonb,
   true, 95),

  ('Hauz Khas Social', 'hauz-khas-social', 'gastropub', 'Hauz Khas Village', 'Delhi',
   'Three terraced floors built into the lake-side ruins. Co-working desks by day, design-forward cocktails by night, and the city''s most photographed sundowner view.',
   'https://picsum.photos/seed/jc-hks/1200/800',
   '["15% off food", "1+1 on house pours before 8pm"]'::jsonb,
   false, 90),

  ('Lord of the Drinks', 'lord-of-the-drinks', 'lounge', 'Connaught Place', 'Delhi',
   'Theatrical interiors of brass and stained glass. A live-band schedule that swings between gypsy jazz and electro-funk, and a bar program built around large-format gin & tonics.',
   'https://picsum.photos/seed/jc-lod/1200/800',
   '["No cover charge", "Priority table at live music nights"]'::jsonb,
   false, 85),

  ('Mason', 'mason', 'gastropub', 'Connaught Place', 'Delhi',
   'A small-plates gastropub anchored by an open kitchen and a barrel-aged cocktail program. Menu rotates with seasonal Indian produce; the back room is reservable for tastings.',
   'https://picsum.photos/seed/jc-mason/1200/800',
   '["Complimentary amuse-bouche", "20% off the tasting flight"]'::jsonb,
   false, 80),

  ('Cocktails & Dreams Speakeasy', 'cocktails-and-dreams', 'speakeasy', 'Sector 15, Gurugram', 'Delhi NCR',
   'Operatic glass elevator, a hidden cigar lounge and one of the longest premium spirits selections in the NCR. The kind of place you book for a celebration and end up extending twice.',
   'https://picsum.photos/seed/jc-candspeakeasy/1200/800',
   '["Welcome champagne", "Cigar pairing on request"]'::jsonb,
   false, 75),

  ('The Drunken Botanist', 'drunken-botanist', 'cocktail', 'Cyber Hub, Gurugram', 'Delhi NCR',
   'A glasshouse bar built around an indoor herb garden. Bartenders pluck mint, basil and curry leaf to order; the negroni list runs eighteen deep.',
   'https://picsum.photos/seed/jc-tdb/1200/800',
   '["Garden tour with the head bartender", "Bespoke cocktail tasting"]'::jsonb,
   false, 70),

  ('Townhall', 'townhall', 'lounge', 'Khan Market', 'Delhi',
   'Three stories of Khan Market real estate, each dressed in a different mood — café below, lounge in the middle, terrace bar on top. An industry favourite for late dinners.',
   'https://picsum.photos/seed/jc-townhall/1200/800',
   '["Late-night menu access", "Reserved terrace seating"]'::jsonb,
   false, 65),

  ('Perch Wine & Coffee Bar', 'perch', 'wine', 'Vasant Vihar', 'Delhi',
   'A tight, well-edited European wine list and a roastery-grade coffee program that share the same room. Ideal for an unhurried Tuesday evening.',
   'https://picsum.photos/seed/jc-perch/1200/800',
   '["Sommelier-led wine flight", "Member-only allocations"]'::jsonb,
   false, 60),

  ('Tres', 'tres', 'lounge', 'Lodhi Colony', 'Delhi',
   'Spanish-coastal cooking and a sherry-driven cocktail menu in a softly-lit corner of Lodhi Colony. The kind of bar you take a first date — and a tenth.',
   'https://picsum.photos/seed/jc-tres/1200/800',
   '["Complimentary tapas pairing", "Anniversary table treatment"]'::jsonb,
   false, 55)
on conflict (slug) do nothing;
