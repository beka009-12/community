import "server-only";
import { cache } from "react";
import { publicGet } from "./client";
import { statsSchema, type Stats } from "./schemas";

export const getStats = cache((): Promise<Stats> => publicGet("/stats/", statsSchema, "stats"));
