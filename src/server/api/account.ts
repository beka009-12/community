import "server-only";
import { cache } from "react";
import { authedGet } from "./client";
import { accountSchema, type Account } from "./schemas";

// The signed-in user's own profile. Spec 2 adds the résumé sections here.
export const getMyAccount = cache((): Promise<Account> => authedGet("/personal-account/", accountSchema));
