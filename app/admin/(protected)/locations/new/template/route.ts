import { requireAdmin } from "@/lib/admin/auth";

const headers = ["dealer_name", "location_name", "address_line_1", "address_line_2", "city", "state_province", "postal_code", "country", "phone", "website", "email", "active", "notes"];
const example = ["Example Golf Retailer", "Downtown", "123 Main Street", "Suite 100", "Tulsa", "OK", "74103", "United States", "+1 918 555 0100", "https://example.com/tulsa", "tulsa@example.com", "Retail", "true", "Replace this example row"];
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

export async function GET() {
  await requireAdmin();
  const csv = `${headers.map(csvCell).join(",")}\r\n${example.map(csvCell).join(",")}\r\n`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="upswing-dealer-locations-template.csv"', "Cache-Control": "private, no-store" } });
}
