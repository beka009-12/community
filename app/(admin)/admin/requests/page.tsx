import PageHeader from "@/src/components/admin/ui/PageHeader";
import RequestBoard from "@/src/components/admin/requests/RequestBoard";
import { requireAdmin } from "@/src/server/auth/dal";
import { listClientRequests } from "@/src/server/repositories/requests";

const Page = async () => {
  await requireAdmin();
  const requests = await listClientRequests();
  return (
    <>
      <PageHeader title="Заявки" description="Заявки клиентов с формы на странице «Контакты»." />
      <RequestBoard requests={requests} />
    </>
  );
};

export default Page;
