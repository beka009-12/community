import PageHeader from "@/src/components/admin/ui/PageHeader";
import RequestBoard from "@/src/components/admin/requests/RequestBoard";
import { getClientRequests } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const requests = await getClientRequests();
  return (
    <>
      <PageHeader title="Заявки" description="Заявки клиентов с формы на странице «Контакты»." />
      <RequestBoard requests={requests} />
    </>
  );
};

export default Page;
