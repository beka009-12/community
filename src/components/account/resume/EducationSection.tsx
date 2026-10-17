import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createEducationAction,
  deleteEducationAction,
  updateEducationAction,
} from "@/src/actions/account/resume";
import { formatYears } from "@/src/lib/resume-format";
import type { Education } from "@/src/server/api/schemas";
import EducationDialog from "./EducationForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_EDUCATION, educationValues } from "./resume-values";

const EducationSection: FC<{ rows: Education[] }> = ({ rows }) => (
  <ResumeSection
    title="Образование"
    isEmpty={rows.length === 0}
    add={
      <EducationDialog
        triggerLabel="Добавить образование"
        title="Новое образование"
        primary
        action={createEducationAction}
        initial={EMPTY_EDUCATION}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.specialization} · ${row.educational_institution}`}
        meta={[formatYears(row.start_year, row.end_year, row.studying_now)]}
        text={row.responsibilities}
        actions={
          <>
            <EducationDialog
              triggerLabel="Изменить"
              title="Образование"
              action={updateEducationAction.bind(null, row.id)}
              initial={educationValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteEducationAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default EducationSection;
