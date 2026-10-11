# Mason Homes — Exact Replica Audit

Snapshot branch: `exact-replica-2026-10-11`
Source: `master` as of 2026-10-11
Live: https://masonhomesconstruction.com/

## What is preserved

- 97 HTML routes including 10 admin pages and 87 public pages
- 275 bundled project image files
- Original HTML, CSS, JS, design system, galleries, sitemap, robots, middleware, API handlers and Vercel configuration
- Identical URL paths, with the existing static-site architecture rather than an approximation

## Full file-route inventory

- `/`
- `/about/`
- `/admin/`
- `/admin/estimates/`
- `/admin/invoices/`
- `/admin/leads/`
- `/admin/projects/`
- `/admin/reports/`
- `/admin/schedule/`
- `/admin/settings/`
- `/admin/tasks/`
- `/admin/team/`
- `/bathroom-remodeling-clearwater/`
- `/bathroom-remodeling-south-tampa/`
- `/bathroom-remodeling-st-petersburg/`
- `/blog/`
- `/blog/best-flooring-for-florida-humidity/`
- `/blog/best-time-to-remodel-tampa/`
- `/blog/can-you-live-in-home-during-remodel/`
- `/blog/florida-adu-law-2024/`
- `/blog/how-to-choose-custom-home-builder-tampa/`
- `/blog/kitchen-cabinet-refacing-vs-replacement/`
- `/blog/kitchen-remodel-roi-tampa/`
- `/blog/lvp-vs-tile-florida/`
- `/blog/open-concept-kitchen-remodel-tampa/`
- `/blog/permits-for-home-additions-hillsborough-county/`
- `/blog/quartz-vs-granite-tampa/`
- `/blog/tampa-building-permit-guide/`
- `/blog/tampa-flood-zone-building-requirements/`
- `/blog/tampa-hoa-renovation-rules/`
- `/blog/what-to-look-for-tampa-remodeling-contractor/`
- `/case-studies/`
- `/case-studies/cbs-custom-home/`
- `/case-studies/mediterranean-luxury-remodel/`
- `/case-studies/screened-outdoor-living/`
- `/contact/`
- `/cost-guides/`
- `/cost-guides/adu-construction-cost-tampa/`
- `/cost-guides/bathroom-remodel-cost-tampa/`
- `/cost-guides/countertop-installation-cost-tampa/`
- `/cost-guides/custom-home-cost-per-sq-ft-tampa/`
- `/cost-guides/flooring-installation-cost-tampa/`
- `/cost-guides/home-addition-cost-tampa/`
- `/cost-guides/kitchen-remodel-cost-tampa/`
- `/free-estimate/`
- `/gallery/`
- `/home-remodeling-brandon/`
- `/home-remodeling-largo/`
- `/home-remodeling-new-tampa/`
- `/home-remodeling-riverview/`
- `/home-remodeling-wesley-chapel/`
- `/kitchen-remodeling-brandon/`
- `/kitchen-remodeling-carrollwood/`
- `/kitchen-remodeling-clearwater/`
- `/kitchen-remodeling-south-tampa/`
- `/locations/`
- `/locations/apollo-beach/`
- `/locations/bradenton/`
- `/locations/brandon/`
- `/locations/carrollwood/`
- `/locations/clearwater/`
- `/locations/counties/hillsborough/`
- `/locations/counties/manatee/`
- `/locations/counties/pasco/`
- `/locations/counties/pinellas/`
- `/locations/counties/sarasota/`
- `/locations/dunedin/`
- `/locations/land-o-lakes/`
- `/locations/largo/`
- `/locations/lutz/`
- `/locations/new-port-richey/`
- `/locations/new-tampa/`
- `/locations/odessa/`
- `/locations/pinellas-park/`
- `/locations/plant-city/`
- `/locations/riverview/`
- `/locations/sarasota/`
- `/locations/south-tampa/`
- `/locations/st-petersburg/`
- `/locations/sun-city-center/`
- `/locations/tampa/`
- `/locations/valrico/`
- `/locations/wesley-chapel/`
- `/locations/westchase/`
- `/privacy-policy/`
- `/process/`
- `/services/`
- `/services/adu-accessory-dwelling-units/`
- `/services/bathroom-remodeling/`
- `/services/countertop-installation/`
- `/services/custom-home-building/`
- `/services/flooring-installation/`
- `/services/home-additions/`
- `/services/kitchen-remodeling/`
- `/services/whole-home-renovation/`
- `/showroom/`
- `/terms-of-service/`

## Deployment

Create a separate Vercel project from this repository and choose the exact-replica branch. Set Framework Preset to Other and Root Directory to `.`; vercel.json sets `outputDirectory` to `site`. Keep the original domain on the existing project until preview verification is complete.

Configure necessary environment variables for Supabase lead submissions and admin authentication; never commit secrets. Test lead capture and email notifications end to end.

## Audit limitations

The repository tree, HTML pages, original files, and deployment configuration were inspected. The public live website was sampled, but a complete production crawl and pixel comparison have not been performed. Site connectivity, functional forms, admin integrations, and third-party services must be checked on a deployed preview.

## Known risk

`api/lead-submit.js` can respond with HTTP 200 and `ok:false` on an error. Validate form payload and database entry, not just HTTP status. No production files, domain, or master branch were changed.