import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function Unbuilt() {
  const page = usePage();

  return (
    <AppLayout title="Not built yet">
      <Head title="Not built yet" />
      <p className="text-sm text-muted-foreground">
        The route for {page.component} is already registered. This screen has not been built yet.
      </p>
    </AppLayout>
  );
}
