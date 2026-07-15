# Brampton-Area Businesses Without Websites — Lead List

A prospecting list of small businesses in **Brampton, Ontario** and nearby
communities (**Mississauga, Caledon, Bolton, Caledon East**) that appear to
**not have a website**. Intended as web-design / digital-presence sales leads.

- Data file: [`brampton-area-no-website-leads.csv`](./brampton-area-no-website-leads.csv)
- ~34 candidate businesses across auto repair, landscaping/lawn care, and cleaning.

## Important: these are *candidates*, not confirmed

Each row was found in an online business directory (YellowPages.ca,
CanadaPages.com, Allbiz.ca) where the listing showed **only a phone number /
address and no website link**. That is a strong signal but **not proof** that a
business has no website. Before outreach, verify each one because a business may:

- Have a website that simply isn't listed in that directory.
- Use a Facebook / Instagram page instead of a website.
- Have recently built or taken down a site.

**Verify before you claim "you don't have a website" to an owner.**

## How to verify a lead (2-minute check)

1. Google the exact business name + city (e.g. `"Khaira Auto Repair" Brampton`).
2. Open its Google Business Profile / Google Maps listing and look for a
   **Website** button in the info panel. No button = no website registered.
3. Check for a Facebook/Instagram page — note it in the `notes` column so you can
   tailor the pitch ("you have a Facebook page but no website").
4. Update `website_status` to `Confirmed - no website`, `Has website`, or
   `Social only`.

## How to expand this list (repeatable method)

The most reliable at-scale method is **Google Maps prospecting**:

1. On Google Maps, search `<niche> in Brampton` (or Mississauga/Caledon/Bolton),
   e.g. `plumbers in Brampton`, `barbers in Mississauga`, `restaurants in Bolton`.
2. Click each listing; if the left info panel has **no Website button**, it's a lead.
3. Record name, phone, address, review count. Prioritize businesses with **20+
   reviews** — active enough to afford and value a website.
4. Repeat across niches: auto repair, landscaping, cleaning, plumbing, HVAC,
   electricians, salons/barbers, restaurants/takeout, convenience stores,
   contractors, movers, tutors, daycares, driving schools, tailors.

Directories to mine for the same signal:
- YellowPages.ca — listings without a "Website" link.
- CanadaPages.com white-pages (phone-only entries).
- Allbiz.ca — often states "There is no website listed for ..." explicitly.

To do it in bulk, a Google Maps scraper with a "no-website" filter (e.g. Apify
actors) can return hundreds of qualified leads per city/niche; results still need
spot-verification.

## CSV columns

| column | meaning |
| --- | --- |
| `business_name` | Business name as listed |
| `category` | Trade / industry |
| `address`, `city`, `province`, `postal_code` | Location (blank where directory omitted it) |
| `phone` | Primary phone from the listing |
| `source` | Directory the record came from |
| `website_status` | Why it's a candidate (e.g. "No website link in listing") |
| `notes` | Extra context / verification reminders |

## Outreach tip

For no-website businesses, a strong first touch is a short message that leads
with a concrete result: offer a simple 1-page site (like the landing page in this
repo) plus a Google Business Profile tune-up, and mention a specific gap you saw
(no website, few photos, no hours). Keep it local and low-pressure.
