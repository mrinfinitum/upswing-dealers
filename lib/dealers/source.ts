export type RawDealerRow = {
  sourceSheet: "PGATSS" | "SCHEELS" | "CLUB CHAMPION";
  sourceRow: number;
  city: string;
  region?: string;
};

const rows = (
  sourceSheet: RawDealerRow["sourceSheet"],
  startRow: number,
  locations: Array<[string, string?]>,
): RawDealerRow[] => locations.map(([city, region], index) => ({
  sourceSheet,
  sourceRow: startRow + index,
  city,
  region,
}));

export const rawDealerRows: RawDealerRow[] = [
  ...rows("PGATSS", 2, [
    ["Roswell", "GA"], ["Preston", "WA"], ["Southlake", "TX"],
    ["Greenwodd Village", "CO"], ["Downers Grove", "IL"], ["Paramus", "NJ"],
    ["Sandy", "UT"], ["Woodlands ", "TX"], ["Austin", "TX"],
    ["Braintree", "MA"], ["East Hanover", "NJ"], ["White Plains", "NY"],
    ["Charlotte", "NC"], ["Oklahoma City", "OK"], ["Commack", "NY"],
  ]),
  ...rows("SCHEELS", 2, [
    ["Rapid City", "SD"], ["Sioux City", "IA"], ["Meridian", "ID"],
    ["Johnstown", "CO"], ["Eden Prairie", "MN"], ["Tulsa", "OK"],
  ]),
  ...rows("CLUB CHAMPION", 2, [
    ["Santa Monica", "CA"], ["Newport Beach", "CA"], ["Del Mar", "CA"],
    ["San Carlos", "CA"], ["Highlands Ranch", "CO"], ["Orlando", "FL"],
    ["Jacksonville", "FL"], ["Bradenton", "FL"], ["Sandy Springs", "GA"],
    ["Willowbrook", "IL"], ["Chicago", "IL"], ["Deerfield", "IL"],
    ["Schaumburg", "IL"], ["Indianapolis", "IN"], ["Overland Park", "KS"],
    ["Needham", "MA"], ["Grand Rapids", "MI"], ["Creve Coeur", "MO"],
    ["Charlotte", "NC"], ["Wilmington", "NC"], ["Cherry Hill", "NJ"],
    ["Livingston", "NJ"], ["West Long Branch", "NJ"], ["Las Vegas", "NV"],
    ["New York", "NY"], ["White Plains", "NY"], ["Tigard", "OR"],
    ["Pittsburgh", "PA"], ["Wayne", "PA"], ["Greenville", "SC"],
    ["Columbia", "SC"], ["Franklin", "TN"], ["Houston", "TX"],
    ["Plano", "TX"], ["Austin", "TX"], ["Dallas", "TX"],
    ["Shenandoah", "TX"], ["Fairfax", "VA"], ["Virginia Beach", "VA"],
    ["Richmond", "VA"], ["Ashburn", "VA"], ["Bellevue", "WA"],
    ["Brookfield", "WI"],
  ]),
  ...rows("CLUB CHAMPION", 46, [
    ["Alexandria AUS"], ["Basingstoke UK"], ["Eagle Farm AUS"],
    ["Hawthorn East AUS"], ["Heatherton AUS"], ["Mississauga CAN"],
    ["Toronto CAN"],
  ]),
];
