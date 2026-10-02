import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  return <h1>Админка</h1>;
};

export default Page;
