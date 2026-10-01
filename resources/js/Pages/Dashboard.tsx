import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canSee, directoryNavigation, managementNavigation } from "@/navigation";
import type { SharedProps } from "@/types";

const descriptions: Record<string, string> = {
  "/accounts": "Create and update user accounts.",
  "/personnel": "Open the personnel register.",
  "/missions": "Manage Gambian missions.",
  "/leave": "Review leave applications.",
  "/vacation-notifications": "Open vacation notifications.",
  "/correspondence": "Open correspondence for your mission.",
  "/foreign-missions": "Open the foreign diplomatic registry.",
};

export default function Dashboard() {
  const { auth } = usePage<SharedProps>().props;
  const role = auth?.user?.role;
  const personnelId = auth?.user?.personnelId;
  const links = [
    ...(role === "foreign_service_officer" && personnelId
      ? [{ label: "My record", href: `/personnel/${personnelId}`, description: "Open your personnel record." }]
      : []),
    ...[...managementNavigation, ...directoryNavigation]
      .filter((item) => canSee(item, role))
      .map((item) => ({
        label: item.label,
        href: item.href,
        description: descriptions[item.href] ?? "Open this section.",
      })),
  ];

  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard" />
      <PageHeader
        title={`Welcome back${auth?.user?.name ? `, ${auth.user.name}` : ""}`}
        description="Use the sections available to your role. Access is still decided on the server."
      />
      {links.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No assigned sections</CardTitle>
            <CardDescription>Your account can open the dashboard and profile.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Card key={link.href}>
              <CardHeader>
                <CardTitle>{link.label}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={link.href} className="text-sm font-medium text-primary hover:underline">
                  Open {link.label.toLowerCase()}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
