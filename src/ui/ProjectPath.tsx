import { FC, Fragment } from "react";
import type { ProjectStatus } from "@/src/lib/api-enums";
import { PROJECT_STATUS_LABELS } from "@/src/lib/api-labels";
import { projectPath } from "@/src/lib/project-path";
import scss from "./ProjectPath.module.scss";

interface ProjectPathProps {
  status: ProjectStatus;
  className?: string;
}

// Status as the project's path — В планах → В разработке → Готово — with
// the current stage lit, instead of a coloured pill. Screen readers get the
// status as one phrase; the path itself is visual.
const ProjectPath: FC<ProjectPathProps> = ({ status, className }) => {
  const stages = projectPath(status);

  return (
    <span className={`${scss.path} ${className ?? ""}`}>
      <span className={scss.srOnly}>Статус: {PROJECT_STATUS_LABELS[status]}</span>
      <span className={scss.path__stages} aria-hidden="true">
        {stages ? (
          stages.map((stage, index) => (
            <Fragment key={stage.status}>
              {index > 0 && <span className={scss.link} data-state={stage.state} />}
              <span className={scss.stage} data-state={stage.state} data-status={stage.status}>
                {stage.label}
              </span>
            </Fragment>
          ))
        ) : (
          <span className={scss.paused}>{PROJECT_STATUS_LABELS[status]}</span>
        )}
      </span>
    </span>
  );
};

export default ProjectPath;
