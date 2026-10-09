import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import { createWorkAction, deleteWorkAction, updateWorkAction } from "@/src/actions/account/resume";
import { WORKING_FORMAT_LABELS } from "@/src/lib/api-labels";
import { formatPeriod } from "@/src/lib/resume-format";
import type { Work } from "@/src/server/api/schemas";
import WorkDialog from "./WorkForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_WORK, workValues } from "./resume-values";

const WorkSection: FC<{ rows: Work[] }> = ({ rows }) => (
  <ResumeSection
    title="Опыт работы"
    isEmpty={rows.length === 0}
    add={
      <WorkDialog
        triggerLabel="Добавить опыт"
        title="Новое место работы"
        primary
        action={createWorkAction}
        initial={EMPTY_WORK}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.position} · ${row.company}`}
        meta={[
          formatPeriod(row.start_time, row.end_time),
          ...(row.working_format ? [WORKING_FORMAT_LABELS[row.working_format]] : []),
        ]}
        text={row.achievements}
        actions={
          <>
            <WorkDialog
              triggerLabel="Изменить"
              title="Место работы"
              action={updateWorkAction.bind(null, row.id)}
              initial={workValues(row)}
            />
            <ConfirmButton label="Удалить" confirmLabel="Да, удалить" danger onConfirm={deleteWorkAction.bind(null, row.id)} />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default WorkSection;
