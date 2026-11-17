-- Deterministic, repeatable demo content. Names and review text are illustrative;
-- all people/listings are demo records and should not be treated as endorsements.
-- UUIDs use a stable demo namespace so rerunning this file updates the same rows.

insert into public.profiles (id, role, display_name, bio)
select ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, role::public.profile_role, display_name, bio
from (values
  (1, 'agency', 'Silk Road Demo Agency', 'Illustrative demo agency.'),
  (10, 'traveler', 'Demo Traveler One', 'Seed account for sample reviews.'),
  (11, 'traveler', 'Demo Traveler Two', 'Seed account for sample reviews.'),
  (12, 'traveler', 'Demo Traveler Three', 'Seed account for sample reviews.'),
  (20, 'host', 'Demo Host 01', 'Illustrative host profile; not a real booking.'),
  (21, 'host', 'Demo Host 02', 'Illustrative host profile; not a real booking.'),
  (22, 'host', 'Demo Host 03', 'Illustrative host profile; not a real booking.'),
  (23, 'host', 'Demo Host 04', 'Illustrative host profile; not a real booking.'),
  (24, 'host', 'Demo Host 05', 'Illustrative host profile; not a real booking.'),
  (25, 'host', 'Demo Host 06', 'Illustrative host profile; not a real booking.'),
  (26, 'host', 'Demo Host 07', 'Illustrative host profile; not a real booking.'),
  (27, 'host', 'Demo Host 08', 'Illustrative host profile; not a real booking.'),
  (28, 'host', 'Demo Host 09', 'Illustrative host profile; not a real booking.'),
  (29, 'host', 'Demo Host 10', 'Illustrative host profile; not a real booking.'),
  (40, 'artisan', 'Demo Artisan 01', 'Illustrative artisan profile.'),
  (41, 'artisan', 'Demo Artisan 02', 'Illustrative artisan profile.'),
  (42, 'artisan', 'Demo Artisan 03', 'Illustrative artisan profile.'),
  (43, 'artisan', 'Demo Artisan 04', 'Illustrative artisan profile.'),
  (44, 'artisan', 'Demo Artisan 05', 'Illustrative artisan profile.'),
  (45, 'artisan', 'Demo Artisan 06', 'Illustrative artisan profile.'),
  (46, 'artisan', 'Demo Artisan 07', 'Illustrative artisan profile.'),
  (47, 'artisan', 'Demo Artisan 08', 'Illustrative artisan profile.')
) as s(n, role, display_name, bio)
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name, bio = excluded.bio;

-- 12 restaurants/cafes, 12 attractions, 6 stays, and practical city services.
insert into public.places (id, type, name, lat, lng, city, price_level, rating, review_count, cuisine, tags, accessibility, description, verified)
select ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, kind::public.place_type, name, lat, lng, city, price_level, rating, review_count, cuisine, tags::text[],
       jsonb_build_object('wheelchair', wheelchair, 'women_safe', women_safe, 'halal', halal, 'vegetarian', vegetarian, 'family', family, 'budget', budget), description, false
from (values
  (1,'restaurant','Plov & Co. (demo listing)',41.3111,69.2797,'Tashkent',2,4.7,3,'Uzbek','{plov,local-food,lunch}',false,true,true,true,true,true,'Demo listing for Tashkent-style plov.'),
  (2,'restaurant','Chorsu Teahouse (demo listing)',41.3265,69.2340,'Tashkent',1,null,0,'Uzbek','{tea,market,local-food}',false,true,true,true,true,true,'Demo listing near the old bazaar.'),
  (3,'cafe','Anor Garden Cafe (demo listing)',41.2995,69.2401,'Tashkent',2,null,0,'Cafe','{cafe,vegetarian,breakfast}',true,true,false,true,true,false,'Demo cafe listing with vegetarian options.'),
  (4,'restaurant','Registan Table (demo listing)',39.6548,66.9758,'Samarkand',2,4.7,3,'Uzbek','{plov,local-food,family}',false,true,true,true,true,true,'Demo family-style restaurant listing.'),
  (5,'cafe','Silk & Spice Cafe (demo listing)',39.6552,66.9682,'Samarkand',2,null,0,'Cafe','{coffee,patio,vegetarian}',true,true,false,true,true,false,'Demo cafe with a shaded courtyard.'),
  (6,'restaurant','Bibikhanum Kitchen (demo listing)',39.6595,66.9804,'Samarkand',3,null,0,'Uzbek','{local-food,halal,dinner}',false,true,true,false,true,false,'Demo Uzbek dinner listing.'),
  (7,'restaurant','Lyabi House Cafe (demo listing)',39.7747,64.4151,'Bukhara',2,4.7,3,'Uzbek','{courtyard,local-food,halal}',false,true,true,true,true,true,'Demo courtyard cafe listing.'),
  (8,'cafe','Old Town Coffee (demo listing)',39.7762,64.4190,'Bukhara',2,null,0,'Cafe','{coffee,cafe,breakfast}',true,true,false,true,true,false,'Demo coffee stop in the old town.'),
  (9,'restaurant','Bukhara Bread House (demo listing)',39.7705,64.4271,'Bukhara',1,null,0,'Bakery','{bread,bakery,budget}',false,true,true,true,true,true,'Demo bakery listing for fresh non.'),
  (10,'restaurant','Ichan Qala Table (demo listing)',41.3782,60.3598,'Khiva',2,4.7,3,'Khorezm','{shivit-oshi,local-food,halal}',false,true,true,true,true,false,'Demo listing for Khorezm green-noodle dishes.'),
  (11,'cafe','Kalta Minor Tea Room (demo listing)',41.3787,60.3605,'Khiva',1,null,0,'Cafe','{tea,courtyard,budget}',false,true,true,true,true,true,'Demo tea-room listing within the old town.'),
  (12,'restaurant','Desert Gate Kitchen (demo listing)',41.3772,60.3652,'Khiva',2,null,0,'Uzbek','{local-food,dinner,family}',false,true,true,true,true,true,'Demo family restaurant listing.'),
  (13,'attraction','Amir Timur Square',41.3111,69.2797,'Tashkent',1,4.7,0,null,'{landmark,park,history}',true,true,false,false,true,true,'Central square and city landmark.'),
  (14,'attraction','Chorsu Bazaar',41.3268,69.2342,'Tashkent',1,4.8,0,null,'{market,food,shopping}',false,true,true,true,true,true,'Historic market with produce and craft stalls.'),
  (15,'attraction','Hazrati Imam Complex',41.3261,69.2375,'Tashkent',1,4.8,0,null,'{architecture,history,mosque}',false,true,true,false,true,false,'Historic religious complex; check visitor guidance before entering.'),
  (16,'attraction','Registan Square',39.6548,66.9758,'Samarkand',2,4.7,3,null,'{unesco,architecture,history}',true,true,false,false,true,false,'Samarkand ensemble of monumental madrasas.'),
  (17,'attraction','Shah-i-Zinda',39.6627,66.9882,'Samarkand',1,4.7,3,null,'{architecture,history,unesco}',false,true,true,false,true,false,'Historic avenue of mausoleums.'),
  (18,'attraction','Gur-e-Amir Mausoleum',39.6486,66.9654,'Samarkand',1,4.8,0,null,'{history,architecture}',false,true,true,false,true,false,'Timurid-era mausoleum and architectural landmark.'),
  (19,'attraction','Poi Kalyan Complex',39.7767,64.4151,'Bukhara',1,4.7,3,null,'{architecture,history,unesco}',false,true,true,false,true,false,'Minaret, mosque, and madrasa ensemble.'),
  (20,'attraction','Ark of Bukhara',39.7806,64.4137,'Bukhara',1,4.7,0,null,'{fortress,museum,history}',false,true,true,false,true,false,'Historic citadel and museum complex.'),
  (21,'attraction','Lyabi-Hauz Ensemble',39.7744,64.4151,'Bukhara',1,4.8,0,null,'{plaza,history,architecture}',true,true,false,false,true,true,'Historic square around a central pool.'),
  (22,'attraction','Itchan Kala',41.3785,60.3598,'Khiva',2,4.7,3,null,'{unesco,old-town,architecture}',false,true,true,false,true,false,'Walled inner town and open-air museum.'),
  (23,'attraction','Kunya-Ark Citadel',41.3788,60.3618,'Khiva',1,4.7,0,null,'{citadel,history,viewpoint}',false,true,true,false,true,false,'Citadel within Itchan Kala.'),
  (24,'attraction','Tash Khauli Palace',41.3775,60.3621,'Khiva',1,4.8,0,null,'{palace,architecture,history}',false,true,true,false,true,false,'Khivan palace known for carved columns and tilework.'),
  (25,'hotel','Tashkent Courtyard Stay (demo)',41.3055,69.2692,'Tashkent',3,4.6,0,null,'{hotel,courtyard,central}',true,true,true,true,true,false,'Illustrative hotel listing; availability and details unverified.'),
  (26,'hostel','Old Tashkent Guesthouse (demo)',41.3201,69.2470,'Tashkent',1,4.4,0,null,'{hostel,budget,shared-kitchen}',false,true,true,true,true,true,'Illustrative hostel listing; availability and details unverified.'),
  (27,'hotel','Samarkand Garden Hotel (demo)',39.6581,66.9677,'Samarkand',3,4.7,0,null,'{hotel,garden,family}',true,true,true,true,true,false,'Illustrative hotel listing; availability and details unverified.'),
  (28,'hostel','Registan Walk Hostel (demo)',39.6514,66.9705,'Samarkand',1,4.5,0,null,'{hostel,budget,central}',false,true,true,true,true,true,'Illustrative hostel listing; availability and details unverified.'),
  (29,'hotel','Bukhara Silk Road Inn (demo)',39.7753,64.4177,'Bukhara',2,4.6,0,null,'{hotel,old-town,courtyard}',false,true,true,true,true,false,'Illustrative hotel listing; availability and details unverified.'),
  (30,'hostel','Khiva Gate Hostel (demo)',41.3791,60.3579,'Khiva',1,4.4,0,null,'{hostel,budget,old-town}',false,true,true,true,true,true,'Illustrative hostel listing; availability and details unverified.'),
  (31,'atm','Demo ATM — Tashkent Center',41.3116,69.2790,'Tashkent',null,null,0,null,'{atm,cash}',false,true,false,false,false,true,'Demo map marker; exact location and operation need verification.'),
  (32,'atm','Demo ATM — Samarkand Center',39.6550,66.9742,'Samarkand',null,null,0,null,'{atm,cash}',false,true,false,false,false,true,'Demo map marker; exact location and operation need verification.'),
  (33,'atm','Demo ATM — Bukhara Center',39.7757,64.4165,'Bukhara',null,null,0,null,'{atm,cash}',false,true,false,false,false,true,'Demo map marker; exact location and operation need verification.'),
  (34,'pharmacy','Demo Pharmacy — Tashkent',41.3078,69.2812,'Tashkent',null,null,0,null,'{pharmacy,health}',false,true,false,false,false,false,'Demo map marker; not medical advice; verify hours and address.'),
  (35,'pharmacy','Demo Pharmacy — Samarkand',39.6570,66.9760,'Samarkand',null,null,0,null,'{pharmacy,health}',false,true,false,false,false,false,'Demo map marker; not medical advice; verify hours and address.'),
  (36,'pharmacy','Demo Pharmacy — Khiva',41.3778,60.3631,'Khiva',null,null,0,null,'{pharmacy,health}',false,true,false,false,false,false,'Demo map marker; not medical advice; verify hours and address.'),
  (37,'hospital','Demo Hospital — Tashkent',41.2995,69.2401,'Tashkent',null,null,0,null,'{hospital,health}',false,true,false,false,false,false,'Demo map marker; use locally verified emergency services.'),
  (38,'hospital','Demo Hospital — Bukhara',39.7684,64.4215,'Bukhara',null,null,0,null,'{hospital,health}',false,true,false,false,false,false,'Demo map marker; use locally verified emergency services.'),
  (39,'police','Demo Police Station — Samarkand',39.6600,66.9685,'Samarkand',null,null,0,null,'{police,help}',false,true,false,false,false,false,'Demo map marker; address and contact details need verification.'),
  (40,'police','Demo Police Station — Khiva',41.3801,60.3602,'Khiva',null,null,0,null,'{police,help}',false,true,false,false,false,false,'Demo map marker; address and contact details need verification.'),
  (41,'transport','Demo Rail Station — Tashkent',41.2916,69.2788,'Tashkent',null,null,0,null,'{train,transport}',true,true,false,false,true,false,'Demo transport marker; check current operator schedules.'),
  (42,'transport','Demo Rail Station — Samarkand',39.6869,66.9286,'Samarkand',null,null,0,null,'{train,transport}',true,true,false,false,true,false,'Demo transport marker; check current operator schedules.')
) as s(n, kind, name, lat, lng, city, price_level, rating, review_count, cuisine, tags, wheelchair, women_safe, halal, vegetarian, family, budget, description)
on conflict (id) do update set type=excluded.type, name=excluded.name, lat=excluded.lat, lng=excluded.lng, city=excluded.city,
  price_level=excluded.price_level, rating=excluded.rating, review_count=excluded.review_count, cuisine=excluded.cuisine,
  tags=excluded.tags, accessibility=excluded.accessibility, description=excluded.description, verified=excluded.verified;

-- Eight 1–7 day packages across food, culture, adventure, family, budget, and luxury styles.
insert into public.packages (id, title, city, days, price_usd, style, includes, itinerary, agency_id, rating, season, verified)
select ('30000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, title, city::text[], days, price, style::public.package_style, includes::text[],
       jsonb_build_array(jsonb_build_object('day', 1, 'plan', first_day), jsonb_build_object('day', days, 'plan', last_day)),
       '10000000-0000-4000-8000-000000000001'::uuid, rating, season::text[], false
from (values
  (1,'Tashkent Flavors Walk (demo)','{Tashkent}',1,35,'food','{market-walk,tastings,guide}','Chorsu market and a traditional lunch','Old city tea stop',4.7,'{spring,summer,autumn}'),
  (2,'Samarkand in a Day (demo)','{Samarkand}',1,49,'culture','{local-guide,entry-planning}','Registan and Gur-e-Amir','Sunset at Registan',4.7,'{spring,autumn}'),
  (3,'Bukhara Old Town Weekend (demo)','{Bukhara}',2,115,'culture','{walking-tour,breakfast}','Poi Kalyan and trading domes','Lyabi-Hauz evening walk',4.7,'{spring,autumn,winter}'),
  (4,'Khiva Family Discovery (demo)','{Khiva}',2,135,'family','{family-route,local-guide}','Explore Itchan Kala at an easy pace','Palace courtyards and family meal',4.7,'{spring,autumn}'),
  (5,'Four Cities on a Budget (demo)','{Tashkent,Samarkand,Bukhara,Khiva}',4,249,'budget','{rail-planning,walking-routes}','Tashkent arrival and market walk','Khiva old-town loop',4.5,'{spring,autumn}'),
  (6,'Silk Road Heritage Loop (demo)','{Tashkent,Samarkand,Bukhara,Khiva}',7,690,'culture','{city-guides,rail-planning,heritage-stops}','Tashkent museums and Samarkand','Khiva heritage walk',4.7,'{spring,autumn}'),
  (7,'Desert & Ancient Fortresses (demo)','{Khiva,Bukhara}',3,380,'adventure','{route-planning,fortress-stops}','Khiva and a guided countryside day','Return to Bukhara old town',4.6,'{spring,autumn}'),
  (8,'Private Silk Road Collection (demo)','{Tashkent,Samarkand,Bukhara}',5,1450,'luxury','{private-car,curated-stays,guide}','Private Tashkent orientation','Curated Bukhara farewell',4.9,'{spring,summer,autumn}')
) as s(n,title,city,days,price,style,includes,first_day,last_day,rating,season)
on conflict (id) do update set title=excluded.title, city=excluded.city, days=excluded.days, price_usd=excluded.price_usd,
  style=excluded.style, includes=excluded.includes, itinerary=excluded.itinerary, agency_id=excluded.agency_id,
  rating=excluded.rating, season=excluded.season, verified=excluded.verified;

-- Ten fictional host profiles; prices are demo USD estimates, not offers.
insert into public.hosts (id, profile_id, city, languages, interests, vibe, price, rural, women_run, bio, verified)
select ('40000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('10000000-0000-4000-8000-' || lpad(profile_no::text, 12, '0'))::uuid,
       city, languages::text[], interests::text[], vibe, price, rural, women_run, bio, false
from (values
  (1,20,'Tashkent','{Uzbek,English}','{food,architecture}','Curious city walker',18,false,true,'Demo host profile for a neighborhood walk.'),
  (2,21,'Tashkent','{Uzbek,Russian,English}','{markets,crafts}','Warm and practical',15,false,false,'Demo host profile for a market visit.'),
  (3,22,'Samarkand','{Uzbek,English}','{history,photography}','History enthusiast',22,false,true,'Demo host profile for a heritage walk.'),
  (4,23,'Samarkand','{Uzbek,Tajik,English}','{food,family}','Relaxed local guide',20,false,false,'Demo host profile for local food recommendations.'),
  (5,24,'Bukhara','{Uzbek,Russian,English}','{crafts,history}','Old-town storyteller',20,false,true,'Demo host profile for a crafts and history walk.'),
  (6,25,'Bukhara','{Uzbek,English}','{tea,architecture}','Quiet courtyard host',16,false,false,'Demo host profile for a courtyard tea visit.'),
  (7,26,'Khiva','{Uzbek,English}','{architecture,photography}','Early morning explorer',18,false,true,'Demo host profile for an old-town walk.'),
  (8,27,'Khiva','{Uzbek,Karakalpak,English}','{food,crafts}','Craft and food fan',17,false,false,'Demo host profile for local craft introductions.'),
  (9,28,'Nurata','{Uzbek,English}','{nature,village-life}','Rural guest host',24,true,true,'Demo rural host profile; travel and access need confirmation.'),
  (10,29,'Tashkent','{Uzbek,Russian,English}','{museums,coffee}','Easygoing city local',19,false,false,'Demo host profile for museums and cafes.')
) as s(n,profile_no,city,languages,interests,vibe,price,rural,women_run,bio)
on conflict (id) do update set profile_id=excluded.profile_id, city=excluded.city, languages=excluded.languages,
  interests=excluded.interests, vibe=excluded.vibe, price=excluded.price, rural=excluded.rural,
  women_run=excluded.women_run, bio=excluded.bio, verified=excluded.verified;

-- Eight illustrative souvenirs; no real inventory or purchase is implied.
insert into public.products (id, artisan_id, name, price, region, story, currency, verified)
select ('50000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('10000000-0000-4000-8000-' || lpad(artisan_no::text, 12, '0'))::uuid,
       name, price::numeric, region, story, 'USD', false
from (values
  (1,40,'Demo blue tile coaster','12','Samarkand','Illustrative ceramic motif inspired by blue tilework.'),
  (2,41,'Demo suzani cushion cover','48','Bukhara','Illustrative embroidery story; maker and materials need verification.'),
  (3,42,'Demo Khiva wood carving','34','Khiva','Illustrative carved pattern inspired by Khiva architecture.'),
  (4,43,'Demo ikat scarf','29','Fergana Valley','Illustrative silk pattern sample; provenance needs verification.'),
  (5,44,'Demo miniature painting','42','Bukhara','Illustrative miniature-art sample; not an authenticated work.'),
  (6,45,'Demo Rishtan bowl','38','Fergana Valley','Illustrative blue-green ceramic sample.'),
  (7,46,'Demo woven market tote','16','Tashkent','Illustrative reusable woven bag sample.'),
  (8,47,'Demo carved sandalwood box','55','Samarkand','Illustrative craft sample; wood type and origin need verification.')
) as s(n,artisan_no,name,price,region,story)
on conflict (id) do update set artisan_id=excluded.artisan_id, name=excluded.name, price=excluded.price,
  region=excluded.region, story=excluded.story, currency=excluded.currency, verified=excluded.verified;

-- Fifteen approximate guide prices in UZS. Samples only; validate locally and refresh often.
insert into public.price_guide (id, item, city, fair_min, fair_max, currency, unit)
select ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,item,city,fair_min,fair_max,'UZS',unit
from (values
  (1,'Shared city taxi ride','Tashkent',5000,15000,'per passenger'),
  (2,'Tea at a local chaikhana','Tashkent',8000,20000,'per pot'),
  (3,'Fresh non bread','Tashkent',4000,10000,'each'),
  (4,'Simple plov lunch','Tashkent',25000,55000,'per meal'),
  (5,'Metro ride','Tashkent',2000,5000,'per ride'),
  (6,'Tea at a local chaikhana','Samarkand',8000,20000,'per pot'),
  (7,'Simple plov lunch','Samarkand',25000,60000,'per meal'),
  (8,'Local shared taxi','Samarkand',5000,18000,'per passenger'),
  (9,'Fresh non bread','Bukhara',4000,10000,'each'),
  (10,'Simple lunch','Bukhara',25000,60000,'per meal'),
  (11,'Short old-town electric cart ride','Bukhara',10000,30000,'per passenger'),
  (12,'Tea and samsa snack','Khiva',12000,30000,'per person'),
  (13,'Short old-town cycle taxi','Khiva',10000,30000,'per ride'),
  (14,'Small bottled water','Khiva',3000,8000,'each'),
  (15,'Handmade ceramic cup (demo range)','Samarkand',60000,180000,'each')
) as s(n,item,city,fair_min,fair_max,unit)
on conflict (item,city) do update set fair_min=excluded.fair_min, fair_max=excluded.fair_max, currency=excluded.currency, unit=excluded.unit, updated_at=now();

-- Safety examples are general, fictional demo guidance and deliberately unverified.
insert into public.scam_alerts (id, city, title, description, category, verified, is_demo)
select ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,city,title,description,category,false,true
from (values
  (1,'Tashkent','Agree taxi fare before departure','Demo reminder: use a clearly priced ride or agree the fare before starting. This is general guidance, not a report about a named driver.','transport'),
  (2,'Tashkent','Check market prices before buying','Demo reminder: compare a few stalls and confirm the total before paying.','shopping'),
  (3,'Samarkand','Confirm guide inclusions in writing','Demo reminder: confirm the duration, entry costs, and meeting point before a tour.','tours'),
  (4,'Samarkand','Use official ticket counters','Demo reminder: check current ticket rules at the venue before purchasing from a third party.','tickets'),
  (5,'Bukhara','Clarify shop commission stops','Demo reminder: ask whether a walking tour includes shop visits or commissions.','tours'),
  (6,'Bukhara','Check the final restaurant bill','Demo reminder: confirm prices and extras before ordering if a menu is unclear.','dining'),
  (7,'Khiva','Confirm transport price and route','Demo reminder: agree the route and price before taking a local ride.','transport'),
  (8,'Khiva','Verify accommodation off-platform','Demo reminder: confirm address, availability, and total price directly before sending money.','accommodation')
) as s(n,city,title,description,category)
on conflict (id) do update set city=excluded.city,title=excluded.title,description=excluded.description,category=excluded.category,verified=false,is_demo=true;

-- Never ship invented emergency phone numbers. Replace TODO_VERIFY after official verification.
insert into public.emergency_contacts (id, user_id, name, phone, phone_verification, relationship, is_demo)
select ('80000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,null,name,'TODO_VERIFY','TODO_VERIFY','Official local emergency contact — verify before use',true
from (values (1,'Tashkent emergency services — TODO_VERIFY'),(2,'Samarkand emergency services — TODO_VERIFY'),(3,'Bukhara emergency services — TODO_VERIFY'),(4,'Khiva emergency services — TODO_VERIFY')) as s(n,name)
on conflict (id) do update set user_id=null,name=excluded.name,phone='TODO_VERIFY',phone_verification='TODO_VERIFY',relationship=excluded.relationship,is_demo=true;

-- Three clearly marked demo reviews on each of eleven featured items (33 reviews total).
with featured(target_type, target_no) as (
  values ('place',1),('place',4),('place',7),('place',10),
         ('place',16),('place',17),('place',19),('place',22),
         ('package',1),('package',2),('package',6)
), review_rows as (
  select row_number() over (order by f.target_type, f.target_no, r.review_no) as seq,
         f.target_type,
         case when f.target_type='place'
              then ('20000000-0000-4000-8000-' || lpad(f.target_no::text,12,'0'))::uuid
              else ('30000000-0000-4000-8000-' || lpad(f.target_no::text,12,'0'))::uuid end as target_id,
         ('10000000-0000-4000-8000-' || lpad(9 + r.review_no::text::integer,12,'0'))::uuid as user_id,
         (case r.review_no when 1 then 5 when 2 then 4 else 5 end)::smallint as rating,
         case r.review_no when 1 then 'Demo review: clear information and a memorable stop.'
                          when 2 then 'Demo review: a useful sample listing for planning.'
                          else 'Demo review: illustrative feedback; not from a real traveler.' end as text
  from featured f cross join generate_series(1,3) as r(review_no)
)
insert into public.reviews (id, target_type, target_id, user_id, rating, text, is_demo)
select ('90000000-0000-4000-8000-' || lpad((40000 + seq)::text,12,'0'))::uuid,
       target_type,target_id,user_id,rating,text,true
from review_rows
on conflict (id) do update set target_type=excluded.target_type,target_id=excluded.target_id,
  user_id=excluded.user_id,rating=excluded.rating,text=excluded.text,is_demo=true;
