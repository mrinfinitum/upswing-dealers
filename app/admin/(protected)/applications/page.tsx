import Link from "next/link";
import { listDealerApplications, type DealerApplicationRow } from "@/lib/admin/applications";

const statusLabels: Record<DealerApplicationRow["verification_status"], string> = {
  "needs-review": "New",
  verified: "Approved",
  rejected: "Rejected",
  unverified: "Unverified",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

export default async function DealerApplicationsPage() {
  const applications = await listDealerApplications();
  const pending = applications.filter((application) => application.verification_status === "needs-review").length;

  return (
    <div className="admin-page">
      <Link className="admin-back-link" href="/admin">← Administration</Link>
      <header className="admin-page__heading"><div><p className="eyebrow">Dealer network</p><h1>Dealer applications</h1><p>Submissions from the public <a href="/become-a-dealer" target="_blank" rel="noreferrer">Become a dealer</a> form. They stay off the locator until you approve them.</p></div></header>
      <p className="admin-notice">{pending} new {pending === 1 ? "application" : "applications"}. To approve, open one, confirm the address, set the status to <strong>Verified</strong>, tick <strong>Active</strong>, and save. To decline, set the status to <strong>Rejected</strong>.</p>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Business</th><th>Location</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {applications.map((application) => <tr key={application.id}>
          <td><strong>{application.name}</strong>{application.notes ? <p className="admin-application-notes">{application.notes.split("\n").slice(1, 4).join("\n")}</p> : null}</td>
          <td>{application.city}{application.state_province ? `, ${application.state_province}` : ""}<span>{application.country}</span></td>
          <td>{dateFormat.format(new Date(application.created_at))}</td>
          <td><span className={`admin-status admin-status--${application.verification_status}`}>{statusLabels[application.verification_status]}{application.verification_status === "verified" && !application.active ? " · inactive" : ""}</span></td>
          <td><Link href={`/admin/locations/${encodeURIComponent(application.id)}?returnTo=${encodeURIComponent("/admin/applications")}`}>Review →</Link></td>
        </tr>)}
      </tbody></table>{applications.length === 0 ? <p className="admin-empty">No applications yet.</p> : null}</div>
    </div>
  );
}
