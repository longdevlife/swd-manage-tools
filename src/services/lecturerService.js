// Lecturer Service – Business logic
import * as lecturerRepo from "../repositories/lecturerRepository.js";

export const getAssignedLecturers = (groupId) =>
  lecturerRepo.findAssignmentsByGroup(groupId);

export const assignLecturer = async (groupId, lecturerId) => {
  if (!lecturerId) {
    const err = new Error("lecturer_id is required");
    err.statusCode = 400;
    throw err;
  }

  const group = await lecturerRepo.findGroupById(groupId);
  if (!group) { const err = new Error("Group not found"); err.statusCode = 404; throw err; }

  const lecturer = await lecturerRepo.findUserWithRoles(parseInt(lecturerId));
  if (!lecturer) { const err = new Error("Lecturer not found"); err.statusCode = 404; throw err; }

  const isLecturer = lecturer.user_roles.some((ur) => ur.role.role_name === "LECTURER");
  if (!isLecturer) {
    const err = new Error("User does not have LECTURER role");
    err.statusCode = 400;
    throw err;
  }

  const existing = await lecturerRepo.findAssignment(parseInt(lecturerId), groupId);
  if (existing) {
    const err = new Error("Lecturer is already assigned to this group");
    err.statusCode = 400;
    throw err;
  }

  return lecturerRepo.createAssignment(parseInt(lecturerId), groupId);
};

export const removeLecturer = async (groupId, lecturerId) => {
  const existing = await lecturerRepo.findAssignment(lecturerId, groupId);
  if (!existing) {
    const err = new Error("Lecturer assignment not found");
    err.statusCode = 404;
    throw err;
  }
  await lecturerRepo.deleteAssignment(lecturerId, groupId);
};
