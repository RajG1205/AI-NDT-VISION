import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type Project,
} from "@/lib/projectDrive";

export type ProjectInput = Pick<Project, "name" | "code" | "description">;

export const projectService = {
  list: listProjects,
  get: getProject,
  create: createProject,
  update: updateProject,
  remove: deleteProject,
};
