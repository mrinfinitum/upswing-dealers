import { DealerPortalShell } from "@/components/portal/dealer-portal-shell";

export default function DealerPortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DealerPortalShell>{children}</DealerPortalShell>;
}
