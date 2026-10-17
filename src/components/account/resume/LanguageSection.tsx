import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createLanguageAction,
  deleteLanguageAction,
  updateLanguageAction,
} from "@/src/actions/account/resume";
import type { Language } from "@/src/server/api/schemas";
import LanguageDialog from "./LanguageForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_LANGUAGE, languageValues } from "./resume-values";

const LanguageSection: FC<{ rows: Language[] }> = ({ rows }) => (
  <ResumeSection
    title="Языки"
    isEmpty={rows.length === 0}
    add={
      <LanguageDialog
        triggerLabel="Добавить язык"
        title="Новый язык"
        primary
        action={createLanguageAction}
        initial={EMPTY_LANGUAGE}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.languages} — ${row.Level ?? "уровень не указан"}`}
        meta={[]}
        actions={
          <>
            <LanguageDialog
              triggerLabel="Изменить"
              title="Язык"
              action={updateLanguageAction.bind(null, row.id)}
              initial={languageValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteLanguageAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default LanguageSection;
