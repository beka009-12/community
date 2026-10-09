import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createCertificateAction,
  deleteCertificateAction,
  updateCertificateAction,
} from "@/src/actions/account/resume";
import { formatDay } from "@/src/lib/resume-format";
import type { Certificate } from "@/src/server/api/schemas";
import CertificateDialog from "./CertificateForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_CERTIFICATE, certificateValues } from "./resume-values";

const CertificateSection: FC<{ rows: Certificate[] }> = ({ rows }) => (
  <ResumeSection
    title="Сертификаты"
    isEmpty={rows.length === 0}
    add={
      <CertificateDialog
        triggerLabel="Добавить сертификат"
        title="Новый сертификат"
        primary
        action={createCertificateAction}
        initial={EMPTY_CERTIFICATE}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.title} · ${row.organization}`}
        meta={[formatDay(row.given_date)]}
        text={row.text}
        actions={
          <>
            <CertificateDialog
              triggerLabel="Изменить"
              title="Сертификат"
              action={updateCertificateAction.bind(null, row.id)}
              initial={certificateValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteCertificateAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default CertificateSection;
