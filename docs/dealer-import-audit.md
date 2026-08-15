# Dealer workbook import audit

Source: `MASTER RETAIL LOCATION LIST.xlsx`.

## Workbook structure

| Sheet | Usable rows | Source columns | Notes |
| --- | ---: | --- | --- |
| PGATSS | 15 | City, state abbreviation | Heading row identifies the dealer chain. |
| SCHEELS | 6 | City, state abbreviation | Heading row identifies the dealer chain. |
| CLUB CHAMPION | 50 | City, state abbreviation or city + country shorthand | Seven international entries do not have a region column. Row 45 is blank. |
| GOLFTEC | 0 | None | Heading only; no dealer records to import. |

Total imported: **71**. Rejected: **0**.

The workbook does not provide formal column headers beyond each sheet’s title. For populated rows, column A is the city/location label and column B is the US state abbreviation. International country shorthand (`AUS`, `CAN`, `UK`) is embedded in column A.

## Normalization decisions

- Dealer identity is derived from the sheet: `PGATSS` → `PGA TOUR Superstore`, `SCHEELS` → `SCHEELS`, and `CLUB CHAMPION` → `Club Champion`.
- Recognized US state abbreviations imply `United States`.
- International suffixes are separated into city and country. No missing province/state is invented.
- Leading/trailing whitespace is trimmed. The source value remains available in each record’s `source` provenance object.
- `Greenwodd Village` is normalized to `Greenwood Village`. The original spelling is retained in provenance and the adjustment is recorded in `notes`.
- The empty GOLFTEC sheet and Club Champion row 45 are documented rather than treated as rejected dealer records.

## Data concerns

- All 71 rows lack street address, postal code, latitude, longitude, phone, email, website, dealer type, and explicit active status.
- Seven Club Champion rows have country but no state/province: Alexandria, Basingstoke, Eagle Farm, Hawthorn East, Heatherton, Mississauga, and Toronto.
- “Woodlands” is trimmed but not changed to “The Woodlands,” because the source does not support that inference.
- Location names alone are not sufficient for authoritative map pins, distance sorting, guaranteed postal-code matching, or street-level directions.

The normalizer emits eight warnings: seven missing international regions and one corrected city typo. It emits no errors and silently discards no source dealer row.
