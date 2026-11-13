prisma commands
---------------
npx prisma migrate reset    --> delete data from db

npx prisma studio           --> open db in local host

npx prisma migrate dev      --> update & push the new model to the db ,it will ask you for the migration name also (update name)

npx prisma generate         --> to retrive the migrations to the codebase (very important after the migration)

npx inngest-cli@latest dev  --> install inngest

npm run inngest:dev         --> run inngest in local host

npm run all                 --> run all the processes in one terminal


----
remember to add error state
share my id with friends via whatsapp
share locations with others ( menu wil pop up when sharing the location with other)

add sharing locations with other (enter the user id to share the location with , or choose from friends)

make each and every new user have an id, and give the ability to have share button for sharing the id via whatsapp or using the airdrop which will pop up the user profile on the other device and show all the locations he saved

for account Id regex -> GEM@12345678
for location ID regex -> LOC@123456789

Google Maps locations
---------------------
To save a Google Maps place, open the place in Google Maps, choose Share, copy its link, and paste the link into Gemezy. No Google Maps API key is required.

Location image uploads
----------------------
Optional location images are stored in Cloudinary. Configure these server-side environment variables:

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Keep the API secret server-side and never prefix it with NEXT_PUBLIC_.

Polar billing
-------------
The dashboard Billing Portal action and one-time location promotion checkouts use Polar. Configure these server-side environment variables:

```env
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_SERVER=sandbox
POLAR_SINGLE_REFRESH_PRODUCT_ID=your_single_refresh_product_id
POLAR_SINGLE_FEATURED_PRODUCT_ID=your_single_featured_product_id
POLAR_SINGLE_ELITE_PRODUCT_ID=your_single_elite_product_id
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SUCCESS_URL=http://localhost:3000/locations
```

Create these three as one-time Polar products and set `POLAR_SERVER` to `production` for live checkout. Their checkout slugs are `single-refresh`, `single-featured`, and `single-elite`. The plan selector displays EGP 30, EGP 35, and EGP 50 respectively; keep these labels in sync with the Polar product prices. Create a Polar webhook pointing to `https://your-domain/api/auth/polar/webhooks`, subscribe it to `checkout.created`, `checkout.updated`, `order.paid`, and `order.updated`, and set its signing secret as `POLAR_WEBHOOK_SECRET`. Apply the location promotion schema migration with `npx prisma migrate deploy`. Free locations do not start a checkout. A paid selection on the new-location form saves the location first and then opens Polar checkout; existing locations can start a purchase from the **Promote address** action on the location details page. A verified paid-order webhook activates the plan for 7 or 10 days. Only one active plan or pending checkout is allowed per location; another plan can be purchased after expiration or checkout cancellation. Promotion placement in Explore will be implemented separately. Keep the access token and webhook secret server-side and never prefix either with `NEXT_PUBLIC_`.

Location sharing
----------------
Locations can be **Private**, **Friends only**, or **Public**. Any signed-in user can view public locations; accepted friends can also view friends-only locations. Private locations remain visible only to their owner. Shared pages expose only the location name, photos, and Google Maps link; notes, tags, and exact coordinates remain private. Public share links can be copied, sent through WhatsApp, or displayed as a locally generated QR code.

Friends and privacy controls
----------------------------
Friend invitations use the public `GEM@########` ID. Searching an ID lets you view that user's public locations or send a friend request. Accepted friends can also see friends-only locations. Pending invitations can be cancelled, and users can be blocked or reported from the Friends page. Manage blocked users and unblock them later from **More → Blocked users**.

Run `npm test` to execute the friend request and privacy policy tests. The additive Prisma migration `20261011010000_add_friend_safety_controls` creates the block and report tables; after reviewing the target database and migration history, apply pending migrations with `npx prisma migrate deploy`. Do not use `prisma migrate reset` on a database containing data.


TODOS
------
- Improve Explore as it grows. Add search, sorting, and pagination rather than loading every public location at once.✅

- enhance the searching methodology✅

- add notifaction center to the navbar and red dot when new netofification is here ✅

- add the functionality of sending the location to my friends ✅

- add friend page to the pages ✅

- improve the prefetching for faster render ✅

- add billing portal (Polar) ✅

- add payment plan to put your location in the explore top page and increase the views ✅

- create explore folder and add pagination to it later ✅

- make the private pages has it's own layout and make special button to show them

- on the top of my locations add filters like "public only, private only, friends only , all"

- create saved collection page to save from explore directly

- enable adding and adjusting profile picture ✅

- enable email verification by sending code to email 

- add the methodology of sending the location to my friends and it will pop up on the notification

- allow the user to adjust and see how the image will look like in the grid

- have action button allow the user to "share, save , etc" for the location , instead of having all the action button on the image card

- push a notification to alarm the user that he is one day a way from turing over the location to free plan

- check how to expand the number of users when it comes to the database and cloudinary image uploader