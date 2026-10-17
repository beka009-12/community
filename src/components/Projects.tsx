"use client";

import { FC, useMemo, useState } from "react";
import Header from "@/src/components/projects-sections/Header";
import Grid from "@/src/components/projects-sections/Grid";
import EditorialList from "@/src/components/projects-sections/EditorialList";
import type { ProjectStatus } from "@/src/lib/api-enums";
import type { ProjectListItem } from "@/src/server/api/schemas";

const Projects: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  // null = all. Categories are free text in the API, so the tabs come
  // from the data itself.
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const categories = [...new Set(projects.map((project) => project.category))];

  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (category === null || project.category === category) &&
          (status === null || project.project_status === status),
      ),
    [projects, category, status],
  );

  return (
    <div>
      <Header
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
      />
      <Grid projects={visible} />
      <EditorialList projects={visible} />
    </div>
  );
};

export default Projects;
