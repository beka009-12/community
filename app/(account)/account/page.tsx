import AccountPlaceholder from "@/src/components/AccountPlaceholder";
import { fullName } from "@/src/lib/people";
import { getMyAccount } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const account = await getMyAccount();
  return <AccountPlaceholder name={fullName(account, account.login)} />;
};

export default Page;
