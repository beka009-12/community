import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { ApiError } from "@/src/server/api/errors";
import {
  createCertificateAction,
  createWorkAction,
  deleteLanguageAction,
  updateEducationAction,
} from "./resume";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/src/server/auth/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/src/server/api/account", () => {
  const resource = () => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() });
  return {
    workResource: resource(),
    educationResource: resource(),
    languageResource: resource(),
    certificateResource: resource(),
  };
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("résumé actions", () => {
  it("creates a work row from the form and refreshes the cabinet", async () => {
    const state = await createWorkAction(
      {},
      form({
        company: "Motion",
        position: "Frontend",
        start_time: "2024-01-15",
        end_time: "",
        working_format: "remote",
        achievements: "Сделал CRM.",
      }),
    );
    expect(state.ok).toBe(true);
    expect(workResource.create).toHaveBeenCalledWith({
      company: "Motion",
      position: "Frontend",
      start_time: "2024-01-15",
      end_time: null,
      working_format: "remote",
      achievements: "Сделал CRM.",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account", "layout");
  });

  it("updates the bound education row", async () => {
    await updateEducationAction(
      9,
      {},
      form({
        educational_institution: "КГТУ",
        specialization: "ПИ",
        start_year: "2021-09-01",
        end_year: "",
        studying_now: "on",
        responsibilities: "Учёба",
      }),
    );
    expect(educationResource.update).toHaveBeenCalledWith(9, expect.objectContaining({ studying_now: true, end_year: null }));
  });

  it("keeps an invalid certificate on the form without calling the API", async () => {
    const state = await createCertificateAction({}, form({ title: "", organization: "Meta", given_date: "", text: "" }));
    expect(Object.keys(state.fieldErrors ?? {}).sort()).toEqual(["given_date", "text", "title"]);
    expect(certificateResource.create).not.toHaveBeenCalled();
  });

  it("deletes a language and explains a refusal", async () => {
    vi.mocked(languageResource.remove).mockResolvedValueOnce(undefined);
    await expect(deleteLanguageAction(3)).resolves.toEqual({});
    expect(languageResource.remove).toHaveBeenCalledWith(3);

    vi.mocked(languageResource.remove).mockRejectedValueOnce(new ApiError("forbidden", 403, "x"));
    await expect(deleteLanguageAction(3)).resolves.toEqual({ error: "Недостаточно прав для этого действия." });
  });
});
