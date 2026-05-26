import { checkAnon, checkUser } from "@/lib/quota";
import { AuthContext } from "./with-auth";
import { QuotaResult } from "@/lib/quota";

export async function checkQuota(auth: AuthContext): Promise<QuotaResult> {
  if (auth.user) {
    return await checkUser(auth.user.id, auth.ip, auth.plan);
  } else {
    return await checkAnon(auth.ip);
  }
}
