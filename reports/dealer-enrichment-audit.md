# Dealer Enrichment Audit

Generated: 2026-08-15T04:45:04.885Z

This report preserves all 71 normalized records from `MASTER RETAIL LOCATION LIST.xlsx`. A proposal is merged into the application only when its status is `verified`. `needs-review`, `unverified`, and `rejected` records are never selected automatically.

## Summary

| Status | Records |
| --- | ---: |
| Verified | 70 |
| Needs review | 1 |
| Unverified | 0 |
| Rejected | 0 |
| Total | 71 |
| Verified coordinates | 3 |

## Source coverage by retailer

| Retailer sheet | Source records | Authoritatively sourced | Verified | Verified coordinates |
| --- | ---: | ---: | ---: | ---: |
| PGATSS | 15 | 15 | 14 | 0 |
| SCHEELS | 6 | 6 | 6 | 0 |
| CLUB CHAMPION | 50 | 50 | 50 | 3 |

## Review findings

- **Preston, WA:** no matching PGA TOUR Superstore appears in the official directory. The record remains `needs-review`; no candidate data was selected.
- **Woodlands / Shenandoah, TX:** resolved to the official PGA TOUR Superstore named Woodlands at a Shenandoah postal address. The store-name/municipality difference is retained below.
- **Greenwood Village, CO:** the workbook spelling `Greenwodd Village` is retained in provenance; the official spelling is proposed in the overlay.
- **International regions:** NSW, QLD, VIC, Ontario, and Hampshire were added only where the retailer's country-specific official page supplied them.
- **Basingstoke, UK:** official pages conflict on postcode/spelling; the dedicated location page and contact address support `RG24 9NP` and `Priestley Road`. The conflict remains visible below.
- **Austin, TX:** the official Club Champion page contains one inconsistent `Agoura Hills` heading while its title, address, and location content identify Austin. The discrepancy remains visible below.
- No authoritative source reviewed in this pass identified a matched record as permanently closed, relocated, or duplicated. Virginia Beach displayed a one-day closure notice, not a permanent closure.

Normalization warnings retained from Phase 1: 8.

## PGA TOUR Superstore — Roswell, GA

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-roswell-ga-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Roswell / GA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 2 |
| Proposed canonical name | PGA TOUR Superstore Roswell |
| Proposed address | 1005 Holcomb Woods Parkway, Roswell, GA, United States |
| Postal code | 30076-2738 |
| Phone | 770-640-0933 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=0101](https://www.pgatoursuperstore.com/stores/detail?StoreID=0101) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Preston, WA

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-preston-wa-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Preston / WA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 3 |
| Proposed canonical name | — |
| Proposed address | — |
| Postal code | — |
| Phone | — |
| Website | — |
| Latitude / longitude | — |
| Verification status | **needs-review** |
| Confidence | **low** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: none |

Discrepancies:

- No PGA TOUR Superstore in Preston, Washington was found in the official directory. Two stores use Plano, Texas addresses associated with Preston Road, so no candidate was selected.

## PGA TOUR Superstore — Southlake, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-southlake-tx-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Southlake / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 4 |
| Proposed canonical name | PGA TOUR Superstore Southlake |
| Proposed address | 2241 East Southlake Blvd, Southlake, TX, United States |
| Postal code | 76092-6852 |
| Phone | 817-722-5190 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=0403](https://www.pgatoursuperstore.com/stores/detail?StoreID=0403) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Greenwood Village, CO

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-greenwood-village-co-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Greenwodd Village / CO / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 5 |
| Proposed canonical name | PGA TOUR Superstore Greenwood Village |
| Proposed address | 9451 East Arapahoe Road, Greenwood Village, CO, United States |
| Postal code | 80112-3632 |
| Phone | 720-266-2400 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=0601](https://www.pgatoursuperstore.com/stores/detail?StoreID=0601) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- Original workbook city is misspelled as Greenwodd Village; the normalized and official city is Greenwood Village.

## PGA TOUR Superstore — Downers Grove, IL

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-downers-grove-il-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Downers Grove / IL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 6 |
| Proposed canonical name | PGA TOUR Superstore Downers Grove |
| Proposed address | 1017 Butterfield Road, Downers Grove, IL, United States |
| Postal code | 60515-1007 |
| Phone | 630-824-2080 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=0702](https://www.pgatoursuperstore.com/stores/detail?StoreID=0702) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Paramus, NJ

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-paramus-nj-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Paramus / NJ / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 7 |
| Proposed canonical name | PGA TOUR Superstore Paramus |
| Proposed address | 295 Route 17 South, Paramus, NJ, United States |
| Postal code | 07652-2905 |
| Phone | 201-649-9170 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=0901](https://www.pgatoursuperstore.com/stores/detail?StoreID=0901) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Sandy, UT

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-sandy-ut-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Sandy / UT / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 8 |
| Proposed canonical name | PGA TOUR Superstore Sandy |
| Proposed address | 10355 S State Street, Sandy, UT, United States |
| Postal code | 84070-4114 |
| Phone | 801-308-5760 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1204](https://www.pgatoursuperstore.com/stores/detail?StoreID=1204) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Woodlands, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-woodlands-tx-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Woodlands  / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 9 |
| Proposed canonical name | PGA TOUR Superstore Woodlands |
| Proposed address | 19075 I-45 S, 105, Shenandoah, TX, United States |
| Postal code | 77385-8705 |
| Phone | 832-616-4400 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1206](https://www.pgatoursuperstore.com/stores/detail?StoreID=1206) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- Source city is Woodlands; official directory names the store Woodlands but lists the municipality as Shenandoah.

## PGA TOUR Superstore — Austin, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-austin-tx-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Austin / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 10 |
| Proposed canonical name | PGA TOUR Superstore Austin |
| Proposed address | 10515 N Mopac Expy, Austin, TX, United States |
| Postal code | 78759-5324 |
| Phone | 512-382-4000 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1218](https://www.pgatoursuperstore.com/stores/detail?StoreID=1218) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Braintree, MA

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-braintree-ma-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Braintree / MA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 11 |
| Proposed canonical name | PGA TOUR Superstore Braintree |
| Proposed address | 450 Grossman Drive, Braintree, MA, United States |
| Postal code | 02184-4941 |
| Phone | 781-817-8988 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1220](https://www.pgatoursuperstore.com/stores/detail?StoreID=1220) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — East Hanover, NJ

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-east-hanover-nj-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | East Hanover / NJ / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 12 |
| Proposed canonical name | PGA TOUR Superstore East Hanover |
| Proposed address | 98 NJ-10, East Hanover, NJ, United States |
| Postal code | 07936-2103 |
| Phone | 973-526-1111 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1221](https://www.pgatoursuperstore.com/stores/detail?StoreID=1221) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — White Plains, NY

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-white-plains-ny-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | White Plains / NY / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 13 |
| Proposed canonical name | PGA TOUR Superstore White Plains |
| Proposed address | 459 Tarrytown Road, White Plains, NY, United States |
| Postal code | 10607-1313 |
| Phone | 914-323-5578 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1227](https://www.pgatoursuperstore.com/stores/detail?StoreID=1227) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Charlotte, NC

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-charlotte-nc-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Charlotte / NC / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 14 |
| Proposed canonical name | PGA TOUR Superstore Charlotte |
| Proposed address | 5341 Ballantyne Commons Pkwy, Charlotte, NC, United States |
| Postal code | 28277-0525 |
| Phone | 980-256-3582 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1231](https://www.pgatoursuperstore.com/stores/detail?StoreID=1231) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Oklahoma City, OK

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-oklahoma-city-ok-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Oklahoma City / OK / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 15 |
| Proposed canonical name | PGA TOUR Superstore Oklahoma City |
| Proposed address | 2727 West Memorial Road, Oklahoma City, OK, United States |
| Postal code | 73134-8034 |
| Phone | 405-832-4482 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1245](https://www.pgatoursuperstore.com/stores/detail?StoreID=1245) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## PGA TOUR Superstore — Commack, NY

| Field | Value |
| --- | --- |
| Source dealer ID | `pga-tour-superstore-commack-ny-united-states` |
| Retailer | PGA TOUR Superstore |
| Original city / state / country | Commack / NY / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; PGATSS; row 16 |
| Proposed canonical name | PGA TOUR Superstore Commack |
| Proposed address | 84 Jericho Turnpike, Commack, NY, United States |
| Postal code | 11725-3009 |
| Phone | 631-980-8148 |
| Website | [https://www.pgatoursuperstore.com/stores/detail?StoreID=1246](https://www.pgatoursuperstore.com/stores/detail?StoreID=1246) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [PGA TOUR Superstore official store directory](https://www.pgatoursuperstore.com/stores/) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Rapid City, SD

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-rapid-city-sd-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Rapid City / SD / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 2 |
| Proposed canonical name | Rapid City SCHEELS |
| Proposed address | 1225 Eglin St, Rapid City, SD, United States |
| Postal code | 57701 |
| Phone | 1-605-342-9033 |
| Website | [https://www.scheels.com/store/rapid-city/076](https://www.scheels.com/store/rapid-city/076) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Rapid City SCHEELS official location page](https://www.scheels.com/store/rapid-city/076) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Sioux City, IA

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-sioux-city-ia-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Sioux City / IA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 3 |
| Proposed canonical name | Sioux City SCHEELS |
| Proposed address | 4400 Sergeant Road #54, Sioux City, IA, United States |
| Postal code | 51106 |
| Phone | 1-712-252-1551 |
| Website | [https://www.scheels.com/store/sioux-city/050](https://www.scheels.com/store/sioux-city/050) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Sioux City SCHEELS official location page](https://www.scheels.com/store/sioux-city/050) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Meridian, ID

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-meridian-id-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Meridian / ID / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 4 |
| Proposed canonical name | Meridian SCHEELS |
| Proposed address | 700 S Wayfinder Ave, Meridian, ID, United States |
| Postal code | 83642 |
| Phone | 1-208-347-7005 |
| Website | [https://www.scheels.com/store/meridian/030](https://www.scheels.com/store/meridian/030) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Meridian SCHEELS official location page](https://www.scheels.com/store/meridian/030) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Johnstown, CO

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-johnstown-co-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Johnstown / CO / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 5 |
| Proposed canonical name | Johnstown SCHEELS |
| Proposed address | 4755 Ronald Reagan Blvd, Johnstown, CO, United States |
| Postal code | 80534 |
| Phone | 1-970-663-7800 |
| Website | [https://www.scheels.com/store/johnstown/092](https://www.scheels.com/store/johnstown/092) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Johnstown SCHEELS official location page](https://www.scheels.com/store/johnstown/092) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Eden Prairie, MN

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-eden-prairie-mn-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Eden Prairie / MN / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 6 |
| Proposed canonical name | Eden Prairie SCHEELS |
| Proposed address | 8301 Flying Cloud Dr, Eden Prairie, MN, United States |
| Postal code | 55344 |
| Phone | 1-952-826-0067 |
| Website | [https://www.scheels.com/store/?StoreID=098](https://www.scheels.com/store/?StoreID=098) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Eden Prairie SCHEELS official location page](https://www.scheels.com/store/?StoreID=098) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## SCHEELS — Tulsa, OK

| Field | Value |
| --- | --- |
| Source dealer ID | `scheels-tulsa-ok-united-states` |
| Retailer | SCHEELS |
| Original city / state / country | Tulsa / OK / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; SCHEELS; row 7 |
| Proposed canonical name | Tulsa SCHEELS |
| Proposed address | 6929 South Memorial Dr., Tulsa, OK, United States |
| Postal code | 74133 |
| Phone | 1-918-953-8212 |
| Website | [https://www.scheels.com/store/tulsa/028](https://www.scheels.com/store/tulsa/028) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Tulsa SCHEELS official location page](https://www.scheels.com/store/tulsa/028) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Santa Monica, CA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-santa-monica-ca-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Santa Monica / CA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 2 |
| Proposed canonical name | Club Champion Santa Monica |
| Proposed address | 2929 Santa Monica Blvd, Santa Monica, CA, United States |
| Postal code | 90404-2413 |
| Phone | (424) 744-8645 |
| Website | [https://clubchampion.com/locations/santa-monica](https://clubchampion.com/locations/santa-monica) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Santa Monica official location page](https://clubchampion.com/locations/santa-monica) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Newport Beach, CA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-newport-beach-ca-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Newport Beach / CA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 3 |
| Proposed canonical name | Club Champion Newport Beach |
| Proposed address | 3601 Jamboree Road, Newport Beach, CA, United States |
| Postal code | 92660 |
| Phone | (949) 861-3822 |
| Website | [https://clubchampion.com/locations/newport-beach](https://clubchampion.com/locations/newport-beach) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Newport Beach official location page](https://clubchampion.com/locations/newport-beach) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Del Mar, CA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-del-mar-ca-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Del Mar / CA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 4 |
| Proposed canonical name | Club Champion Del Mar |
| Proposed address | 2710 Via de la Valle, Suite B270, Del Mar, CA, United States |
| Postal code | 92014 |
| Phone | (858) 847-2400 |
| Website | [https://clubchampion.com/locations/del-mar](https://clubchampion.com/locations/del-mar) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Del Mar official location page](https://clubchampion.com/locations/del-mar) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — San Carlos, CA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-san-carlos-ca-united-states` |
| Retailer | Club Champion |
| Original city / state / country | San Carlos / CA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 5 |
| Proposed canonical name | Club Champion San Carlos |
| Proposed address | 1123 Industrial Road, San Carlos, CA, United States |
| Postal code | 94070 |
| Phone | (650) 453-3062 |
| Website | [https://clubchampion.com/locations/san-carlos](https://clubchampion.com/locations/san-carlos) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion San Carlos official location page](https://clubchampion.com/locations/san-carlos) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Highlands Ranch, CO

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-highlands-ranch-co-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Highlands Ranch / CO / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 6 |
| Proposed canonical name | Club Champion Highlands Ranch |
| Proposed address | 2670 E County Line Rd, Suite O, Highlands Ranch, CO, United States |
| Postal code | 80126 |
| Phone | (720) 638-4633 |
| Website | [https://clubchampion.com/locations/highlands-ranch](https://clubchampion.com/locations/highlands-ranch) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Highlands Ranch official location page](https://clubchampion.com/locations/highlands-ranch) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Orlando, FL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-orlando-fl-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Orlando / FL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 7 |
| Proposed canonical name | Club Champion Orlando |
| Proposed address | 7720 Turkey Lake Rd., Ste 108, Orlando, FL, United States |
| Postal code | 32819-5224 |
| Phone | (407) 745-5660 |
| Website | [https://clubchampion.com/locations/orlando](https://clubchampion.com/locations/orlando) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Orlando official location page](https://clubchampion.com/locations/orlando) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Jacksonville, FL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-jacksonville-fl-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Jacksonville / FL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 8 |
| Proposed canonical name | Club Champion Jacksonville |
| Proposed address | 13529 Beach Blvd, Suite 202B, Jacksonville, FL, United States |
| Postal code | 32224 |
| Phone | (904) 683-0080 |
| Website | [https://clubchampion.com/locations/jacksonville](https://clubchampion.com/locations/jacksonville) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Jacksonville official location page](https://clubchampion.com/locations/jacksonville) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Bradenton, FL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-bradenton-fl-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Bradenton / FL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 9 |
| Proposed canonical name | Club Champion Bradenton |
| Proposed address | 5275 University Pkwy, Suite 110, Bradenton, FL, United States |
| Postal code | 34201 |
| Phone | (941) 216-1443 |
| Website | [https://clubchampion.com/locations/bradenton](https://clubchampion.com/locations/bradenton) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Bradenton official location page](https://clubchampion.com/locations/bradenton) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Sandy Springs, GA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-sandy-springs-ga-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Sandy Springs / GA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 10 |
| Proposed canonical name | Club Champion Sandy Springs |
| Proposed address | 6690 Roswell Rd, Suite 540, Sandy Springs, GA, United States |
| Postal code | 30328-3161 |
| Phone | (404) 303-8322 |
| Website | [https://clubchampion.com/locations/sandy-springs](https://clubchampion.com/locations/sandy-springs) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Sandy Springs official location page](https://clubchampion.com/locations/sandy-springs) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Willowbrook, IL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-willowbrook-il-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Willowbrook / IL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 11 |
| Proposed canonical name | Club Champion Willowbrook |
| Proposed address | 810 75th St, Willowbrook, IL, United States |
| Postal code | 60527-7582 |
| Phone | (630) 654-8887 |
| Website | [https://clubchampion.com/locations/willowbrook](https://clubchampion.com/locations/willowbrook) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Willowbrook official location page](https://clubchampion.com/locations/willowbrook) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Chicago, IL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-chicago-il-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Chicago / IL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 12 |
| Proposed canonical name | Club Champion Chicago |
| Proposed address | 216 W Ohio St, Floor 2, Chicago, IL, United States |
| Postal code | 60654-5698 |
| Phone | (312) 846-1197 |
| Website | [https://clubchampion.com/locations/chicago](https://clubchampion.com/locations/chicago) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Chicago official location page](https://clubchampion.com/locations/chicago) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Deerfield, IL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-deerfield-il-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Deerfield / IL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 13 |
| Proposed canonical name | Club Champion Deerfield |
| Proposed address | 37 Waukegan Rd, #37, Deerfield, IL, United States |
| Postal code | 60015-4901 |
| Phone | (847) 386-6820 |
| Website | [https://clubchampion.com/locations/deerfield](https://clubchampion.com/locations/deerfield) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Deerfield official location page](https://clubchampion.com/locations/deerfield) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Schaumburg, IL

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-schaumburg-il-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Schaumburg / IL / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 14 |
| Proposed canonical name | Club Champion Schaumburg |
| Proposed address | 152 E. Golf Rd, Schaumburg, IL, United States |
| Postal code | 60173 |
| Phone | (630) 635-2180 |
| Website | [https://clubchampion.com/locations/schaumburg](https://clubchampion.com/locations/schaumburg) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Schaumburg official location page](https://clubchampion.com/locations/schaumburg) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Indianapolis, IN

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-indianapolis-in-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Indianapolis / IN / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 15 |
| Proposed canonical name | Club Champion Indianapolis |
| Proposed address | 5025 E. 82nd St, Suite 1400, Indianapolis, IN, United States |
| Postal code | 46250 |
| Phone | (317) 288-7103 |
| Website | [https://clubchampion.com/locations/indianapolis](https://clubchampion.com/locations/indianapolis) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Indianapolis official location page](https://clubchampion.com/locations/indianapolis) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Overland Park, KS

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-overland-park-ks-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Overland Park / KS / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 16 |
| Proposed canonical name | Club Champion Overland Park |
| Proposed address | 7400 W. 121st Street, Overland Park, KS, United States |
| Postal code | 66213 |
| Phone | (913) 498-8580 |
| Website | [https://clubchampion.com/locations/overland-park](https://clubchampion.com/locations/overland-park) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Overland Park official location page](https://clubchampion.com/locations/overland-park) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Needham, MA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-needham-ma-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Needham / MA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 17 |
| Proposed canonical name | Club Champion Needham |
| Proposed address | 924 Great Plain Ave, Needham, MA, United States |
| Postal code | 02492-3030 |
| Phone | (781) 449-1397 |
| Website | [https://clubchampion.com/locations/needham](https://clubchampion.com/locations/needham) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Needham official location page](https://clubchampion.com/locations/needham) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Grand Rapids, MI

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-grand-rapids-mi-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Grand Rapids / MI / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 18 |
| Proposed canonical name | Club Champion Grand Rapids |
| Proposed address | 2048 E. Beltline Ave NE, Grand Rapids, MI, United States |
| Postal code | 49525 |
| Phone | (616) 278-1308 |
| Website | [https://clubchampion.com/locations/grand-rapids](https://clubchampion.com/locations/grand-rapids) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Grand Rapids official location page](https://clubchampion.com/locations/grand-rapids) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Creve Coeur, MO

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-creve-coeur-mo-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Creve Coeur / MO / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 19 |
| Proposed canonical name | Club Champion Creve Coeur |
| Proposed address | 11923 Olive Boulevard, Creve Coeur, MO, United States |
| Postal code | 63141 |
| Phone | (314) 801-7522 |
| Website | [https://clubchampion.com/locations/creve-coeur](https://clubchampion.com/locations/creve-coeur) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Creve Coeur official location page](https://clubchampion.com/locations/creve-coeur) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Charlotte, NC

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-charlotte-nc-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Charlotte / NC / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 20 |
| Proposed canonical name | Club Champion Charlotte |
| Proposed address | 3920 Sharon Rd, Suite 170, Charlotte, NC, United States |
| Postal code | 28211 |
| Phone | (980) 585-2926 |
| Website | [https://clubchampion.com/locations/charlotte](https://clubchampion.com/locations/charlotte) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Charlotte official location page](https://clubchampion.com/locations/charlotte) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Wilmington, NC

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-wilmington-nc-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Wilmington / NC / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 21 |
| Proposed canonical name | Club Champion Wilmington |
| Proposed address | 5500 Market Street, Suite 100, Wilmington, NC, United States |
| Postal code | 28405 |
| Phone | (910) 408-3369 |
| Website | [https://clubchampion.com/locations/wilmington](https://clubchampion.com/locations/wilmington) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Wilmington official location page](https://clubchampion.com/locations/wilmington) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Cherry Hill, NJ

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-cherry-hill-nj-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Cherry Hill / NJ / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 22 |
| Proposed canonical name | Club Champion Cherry Hill |
| Proposed address | 706 Haddonfield Road, Cherry Hill, NJ, United States |
| Postal code | 08002 |
| Phone | (856) 486-0150 |
| Website | [https://clubchampion.com/locations/cherry-hill](https://clubchampion.com/locations/cherry-hill) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Cherry Hill official location page](https://clubchampion.com/locations/cherry-hill) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Livingston, NJ

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-livingston-nj-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Livingston / NJ / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 23 |
| Proposed canonical name | Club Champion Livingston |
| Proposed address | 277 Eisenhower Parkway, Suite 120, Livingston, NJ, United States |
| Postal code | 07039 |
| Phone | (862) 281-6528 |
| Website | [https://clubchampion.com/locations/livingston](https://clubchampion.com/locations/livingston) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Livingston official location page](https://clubchampion.com/locations/livingston) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — West Long Branch, NJ

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-west-long-branch-nj-united-states` |
| Retailer | Club Champion |
| Original city / state / country | West Long Branch / NJ / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 24 |
| Proposed canonical name | Club Champion West Long Branch |
| Proposed address | 310 RT 36, Unit 5, West Long Branch, NJ, United States |
| Postal code | 07764 |
| Phone | (732) 419-7813 |
| Website | [https://clubchampion.com/locations/west-long-branch](https://clubchampion.com/locations/west-long-branch) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion West Long Branch official location page](https://clubchampion.com/locations/west-long-branch) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Las Vegas, NV

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-las-vegas-nv-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Las Vegas / NV / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 25 |
| Proposed canonical name | Club Champion Las Vegas |
| Proposed address | 1009 South Rampart Blvd, Las Vegas, NV, United States |
| Postal code | 89145 |
| Phone | (702) 202-3889 |
| Website | [https://clubchampion.com/locations/las-vegas](https://clubchampion.com/locations/las-vegas) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Las Vegas official location page](https://clubchampion.com/locations/las-vegas) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — New York, NY

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-new-york-ny-united-states` |
| Retailer | Club Champion |
| Original city / state / country | New York / NY / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 26 |
| Proposed canonical name | Club Champion Manhattan |
| Proposed address | 220 E 42nd Street, New York, NY, United States |
| Postal code | 10017 |
| Phone | (212) 419-3880 |
| Website | [https://clubchampion.com/locations/manhattan](https://clubchampion.com/locations/manhattan) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Manhattan official location page](https://clubchampion.com/locations/manhattan) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook uses New York; the official location name is Manhattan.

## Club Champion — White Plains, NY

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-white-plains-ny-united-states` |
| Retailer | Club Champion |
| Original city / state / country | White Plains / NY / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 27 |
| Proposed canonical name | Club Champion White Plains |
| Proposed address | 214 Main Street, White Plains, NY, United States |
| Postal code | 10601 |
| Phone | (914) 948-2651 |
| Website | [https://clubchampion.com/locations/white-plains](https://clubchampion.com/locations/white-plains) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion White Plains official location page](https://clubchampion.com/locations/white-plains) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Tigard, OR

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-tigard-or-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Tigard / OR / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 28 |
| Proposed canonical name | Club Champion Tigard |
| Proposed address | 7215 SW Hazel Fern Road, Tigard, OR, United States |
| Postal code | 97224 |
| Phone | (503) 352-4782 |
| Website | [https://clubchampion.com/locations/tigard](https://clubchampion.com/locations/tigard) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Tigard official location page](https://clubchampion.com/locations/tigard) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Pittsburgh, PA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-pittsburgh-pa-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Pittsburgh / PA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 29 |
| Proposed canonical name | Club Champion Pittsburgh |
| Proposed address | 6563 Steubenville Pike, Pittsburgh, PA, United States |
| Postal code | 15205 |
| Phone | (412) 787-0292 |
| Website | [https://clubchampion.com/locations/pittsburgh](https://clubchampion.com/locations/pittsburgh) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Pittsburgh official location page](https://clubchampion.com/locations/pittsburgh) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Wayne, PA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-wayne-pa-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Wayne / PA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 30 |
| Proposed canonical name | Club Champion Wayne |
| Proposed address | 179 East Swedesford Rd, Wayne, PA, United States |
| Postal code | 19087 |
| Phone | (610) 596-1169 |
| Website | [https://clubchampion.com/locations/wayne](https://clubchampion.com/locations/wayne) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Wayne official location page](https://clubchampion.com/locations/wayne) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Greenville, SC

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-greenville-sc-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Greenville / SC / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 31 |
| Proposed canonical name | Club Champion Greenville |
| Proposed address | 8000 Pelham Road, Greenville, SC, United States |
| Postal code | 29615 |
| Phone | (864) 239-8584 |
| Website | [https://clubchampion.com/locations/greenville](https://clubchampion.com/locations/greenville) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Greenville official location page](https://clubchampion.com/locations/greenville) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Columbia, SC

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-columbia-sc-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Columbia / SC / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 32 |
| Proposed canonical name | Club Champion Columbia |
| Proposed address | 106 Percival Road, Columbia, SC, United States |
| Postal code | 29203 |
| Phone | (803) 866-1605 |
| Website | [https://clubchampion.com/locations/columbia](https://clubchampion.com/locations/columbia) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Columbia official location page](https://clubchampion.com/locations/columbia) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Franklin, TN

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-franklin-tn-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Franklin / TN / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 33 |
| Proposed canonical name | Club Champion Franklin |
| Proposed address | 1910 Galleria Blvd, Suite 110, Franklin, TN, United States |
| Postal code | 37067 |
| Phone | (615) 778-1289 |
| Website | [https://clubchampion.com/locations/franklin](https://clubchampion.com/locations/franklin) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Franklin official location page](https://clubchampion.com/locations/franklin) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Houston, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-houston-tx-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Houston / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 34 |
| Proposed canonical name | Club Champion Houston |
| Proposed address | 10321 Katy Fwy, Suite C, Houston, TX, United States |
| Postal code | 77024-1120 |
| Phone | (713) 973-3939 |
| Website | [https://clubchampion.com/locations/houston](https://clubchampion.com/locations/houston) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Houston official location page](https://clubchampion.com/locations/houston) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Plano, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-plano-tx-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Plano / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 35 |
| Proposed canonical name | Club Champion Plano |
| Proposed address | 4701 W Park Blvd, Suite 210, Plano, TX, United States |
| Postal code | 75093-2326 |
| Phone | (972) 985-4240 |
| Website | [https://clubchampion.com/locations/plano](https://clubchampion.com/locations/plano) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Plano official location page](https://clubchampion.com/locations/plano) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Austin, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-austin-tx-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Austin / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 36 |
| Proposed canonical name | Club Champion Austin |
| Proposed address | 3801 N. Capitol of Texas Hwy, Austin, TX, United States |
| Postal code | 78746 |
| Phone | (512) 953-5900 |
| Website | [https://clubchampion.com/locations/austin](https://clubchampion.com/locations/austin) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Austin official location page](https://clubchampion.com/locations/austin) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The official page title and address identify Austin, but one duplicated on-page heading incorrectly says Agoura Hills.

## Club Champion — Dallas, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-dallas-tx-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Dallas / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 37 |
| Proposed canonical name | Club Champion Dallas |
| Proposed address | 5331 E. Mockingbird Lane, Dallas, TX, United States |
| Postal code | 75206 |
| Phone | (469) 322-0303 |
| Website | [https://clubchampion.com/locations/dallas](https://clubchampion.com/locations/dallas) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Dallas official location page](https://clubchampion.com/locations/dallas) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Shenandoah, TX

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-shenandoah-tx-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Shenandoah / TX / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 38 |
| Proposed canonical name | Club Champion Shenandoah |
| Proposed address | 19075 I-45 S, Shenandoah, TX, United States |
| Postal code | 77385 |
| Phone | (346) 413-6085 |
| Website | [https://clubchampion.com/locations/shenandoah](https://clubchampion.com/locations/shenandoah) |
| Latitude / longitude | 30.181235, -95.45104 |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Shenandoah official location page](https://clubchampion.com/locations/shenandoah) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website, latitude, longitude |

Discrepancies:

- None recorded.

## Club Champion — Fairfax, VA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-fairfax-va-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Fairfax / VA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 39 |
| Proposed canonical name | Club Champion Fairfax |
| Proposed address | 9940 Fairfax Blvd, Fairfax, VA, United States |
| Postal code | 22030 |
| Phone | (571) 459-2218 |
| Website | [https://clubchampion.com/locations/fairfax](https://clubchampion.com/locations/fairfax) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Fairfax official location page](https://clubchampion.com/locations/fairfax) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Virginia Beach, VA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-virginia-beach-va-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Virginia Beach / VA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 40 |
| Proposed canonical name | Club Champion Virginia Beach |
| Proposed address | 4625 Virginia Beach Blvd, Virginia Beach, VA, United States |
| Postal code | 23462 |
| Phone | (757) 497-4145 |
| Website | [https://clubchampion.com/locations/virginia-beach](https://clubchampion.com/locations/virginia-beach) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Virginia Beach official location page](https://clubchampion.com/locations/virginia-beach) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Richmond, VA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-richmond-va-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Richmond / VA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 41 |
| Proposed canonical name | Club Champion Richmond |
| Proposed address | 11747 W. Broad Street, Richmond, VA, United States |
| Postal code | 23233 |
| Phone | (804) 956-3209 |
| Website | [https://clubchampion.com/locations/richmond](https://clubchampion.com/locations/richmond) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Richmond official location page](https://clubchampion.com/locations/richmond) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Ashburn, VA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-ashburn-va-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Ashburn / VA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 42 |
| Proposed canonical name | Club Champion Ashburn |
| Proposed address | 44795 Dulles Overlook Drive, Suite 150, Ashburn, VA, United States |
| Postal code | 20147 |
| Phone | (571) 686-6921 |
| Website | [https://clubchampion.com/locations/ashburn](https://clubchampion.com/locations/ashburn) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Ashburn official location page](https://clubchampion.com/locations/ashburn) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Bellevue, WA

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-bellevue-wa-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Bellevue / WA / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 43 |
| Proposed canonical name | Club Champion Bellevue |
| Proposed address | 10622 NE 10th Street, Bellevue, WA, United States |
| Postal code | 98004 |
| Phone | (425) 223-5925 |
| Website | [https://clubchampion.com/locations/bellevue](https://clubchampion.com/locations/bellevue) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Bellevue official location page](https://clubchampion.com/locations/bellevue) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Brookfield, WI

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-brookfield-wi-united-states` |
| Retailer | Club Champion |
| Original city / state / country | Brookfield / WI / United States |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 44 |
| Proposed canonical name | Club Champion Brookfield |
| Proposed address | 95 N Moorland Road, Brookfield, WI, United States |
| Postal code | 53005 |
| Phone | (262) 505-6460 |
| Website | [https://clubchampion.com/locations/brookfield](https://clubchampion.com/locations/brookfield) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Brookfield official location page](https://clubchampion.com/locations/brookfield) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- None recorded.

## Club Champion — Alexandria, Australia

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-alexandria-australia` |
| Retailer | Club Champion |
| Original city / state / country | Alexandria AUS / Australia |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 46 |
| Proposed canonical name | Club Champion Sydney |
| Proposed address | 1/62-64 O'Riordan Street, Alexandria, NSW, Australia |
| Postal code | 2015 |
| Phone | +61 2 9669-3200 |
| Website | [https://clubchampion.com.au/locations/sydney](https://clubchampion.com.au/locations/sydney) |
| Latitude / longitude | -33.9149398, 151.195816 |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Sydney official location page](https://clubchampion.com.au/locations/sydney) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website, latitude, longitude |

Discrepancies:

- The workbook omits the state; the official location page identifies Alexandria, New South Wales.

## Club Champion — Basingstoke, United Kingdom

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-basingstoke-united-kingdom` |
| Retailer | Club Champion |
| Original city / state / country | Basingstoke UK / United Kingdom |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 47 |
| Proposed canonical name | Club Champion Basingstoke |
| Proposed address | Unit 7 Vickers Business Centre, Priestley Road, Basingstoke, Hampshire, United Kingdom |
| Postal code | RG24 9NP |
| Phone | 01256 359865 |
| Website | [https://clubchampiongolf.co.uk/locations/basingstoke](https://clubchampiongolf.co.uk/locations/basingstoke) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Basingstoke official location page](https://clubchampiongolf.co.uk/locations/basingstoke) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook omits the region. Some official directory snippets show RG24 9RA and spell Priestly Road; the dedicated location page and official contact address use RG24 9NP and Priestley Road.

## Club Champion — Eagle Farm, Australia

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-eagle-farm-australia` |
| Retailer | Club Champion |
| Original city / state / country | Eagle Farm AUS / Australia |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 48 |
| Proposed canonical name | Club Champion Brisbane |
| Proposed address | 39 Bunya Street, Eagle Farm, QLD, Australia |
| Postal code | 4009 |
| Phone | +61 7 2140 1520 |
| Website | [https://clubchampion.com.au/locations/brisbane](https://clubchampion.com.au/locations/brisbane) |
| Latitude / longitude | -27.4312944, 153.0835237 |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Brisbane official location page](https://clubchampion.com.au/locations/brisbane) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website, latitude, longitude |

Discrepancies:

- The workbook omits the state; the official location page identifies Eagle Farm, Queensland.

## Club Champion — Hawthorn East, Australia

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-hawthorn-east-australia` |
| Retailer | Club Champion |
| Original city / state / country | Hawthorn East AUS / Australia |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 49 |
| Proposed canonical name | Club Champion Melbourne Central |
| Proposed address | 2-3/61-63 Camberwell Road, Hawthorn East, VIC, Australia |
| Postal code | 3123 |
| Phone | +61 3 7503 0033 |
| Website | [https://clubchampion.com.au/locations/melbourne-central](https://clubchampion.com.au/locations/melbourne-central) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Melbourne Central official location page](https://clubchampion.com.au/locations/melbourne-central) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook omits the state; the official location page identifies Hawthorn East, Victoria.

## Club Champion — Heatherton, Australia

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-heatherton-australia` |
| Retailer | Club Champion |
| Original city / state / country | Heatherton AUS / Australia |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 50 |
| Proposed canonical name | Club Champion Melbourne South |
| Proposed address | 385 Centre Dandenong Road, Heatherton, VIC, Australia |
| Postal code | 3202 |
| Phone | +61 3 9583 8108 |
| Website | [https://clubchampion.com.au/locations/melbourne-south](https://clubchampion.com.au/locations/melbourne-south) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Melbourne South official location page](https://clubchampion.com.au/locations/melbourne-south) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook omits the state; the official location page identifies Heatherton, Victoria.

## Club Champion — Mississauga, Canada

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-mississauga-canada` |
| Retailer | Club Champion |
| Original city / state / country | Mississauga CAN / Canada |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 51 |
| Proposed canonical name | Club Champion Mississauga |
| Proposed address | 3105 Unity Drive, Unit 20, Mississauga, ON, Canada |
| Postal code | L5L 4L2 |
| Phone | (416) 331-9229 |
| Website | [https://clubchampion.ca/locations/mississauga](https://clubchampion.ca/locations/mississauga) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Mississauga official location page](https://clubchampion.ca/locations/mississauga) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook omits the province; the official location page identifies Mississauga, Ontario.

## Club Champion — Toronto, Canada

| Field | Value |
| --- | --- |
| Source dealer ID | `club-champion-toronto-canada` |
| Retailer | Club Champion |
| Original city / state / country | Toronto CAN / Canada |
| Original workbook provenance | MASTER RETAIL LOCATION LIST.xlsx; CLUB CHAMPION; row 52 |
| Proposed canonical name | Club Champion Toronto |
| Proposed address | 31 Scarsdale Road, Unit 3, North York, ON, Canada |
| Postal code | M3B 2R2 |
| Phone | (416) 331-9229 |
| Website | [https://clubchampion.ca/locations/toronto](https://clubchampion.ca/locations/toronto) |
| Latitude / longitude | — |
| Verification status | **verified** |
| Confidence | **high** |
| Source/reference | [Club Champion Toronto official location page](https://clubchampion.ca/locations/toronto) — retrieved 2026-08-14; fields: canonicalLocationName, addressLine1, city, stateProvince, postalCode, country, phone, website |

Discrepancies:

- The workbook uses Toronto and omits the province; the official location page uses North York, Ontario, for the postal municipality.
