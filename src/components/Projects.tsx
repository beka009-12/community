"use client";

import { FC, useMemo, useState } from "react";
import Header, {
  type FilterKey,
  type StatusFilterKey,
} from "@/src/components/projects-sections/Header";
import Grid from "@/src/components/projects-sections/Grid";
import EditorialList from "@/src/components/projects-sections/EditorialList";
import { PROJECTS } from "@/src/data/projects";

const Projects: FC = () => {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");

  const visible = useMemo(
    () =>
      PROJECTS.filter((project) => {
        const matchesOrigin = filter === "all" || project.origin === filter;
        const matchesStatus =
          statusFilter === "all" || project.status === statusFilter;
        return matchesOrigin && matchesStatus;
      }),
    [filter, statusFilter],
  );

  return (
    <div>
      <Header
        filter={filter}
        onFilterChange={setFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <Grid projects={visible} />
      <EditorialList projects={visible} />
    </div>
  );
};

export default Projects;
