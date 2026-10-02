import PageHeader from "@/src/components/admin/ui/PageHeader";
import EmptyState from "@/src/components/admin/ui/EmptyState";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Настройки" />
      <EmptyState title="Настройки появятся позже" />
    </>
  );
};

export default Page;
