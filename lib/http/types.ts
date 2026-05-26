import { NextRequest } from "next/server";
import { AuthContext } from "./with-auth";
import { QuotaResult } from "@/lib/quota";

export type ApiContext = {
  auth: AuthContext;
  quota: QuotaResult;
};

export type UrlApiContext = ApiContext & {
  url: string;
  platform: any; // Type from platform detector
  body: Record<string, unknown>;
};
