// Lecturer Controller – Thin
import * as lecturerService from "../services/lecturerService.js";

export const getAssignedLecturers = async (req, res, next) => {
  try {
    const lecturers = await lecturerService.getAssignedLecturers(parseInt(req.params.groupId));
    res.status(200).json({ success: true, count: lecturers.length, data: lecturers });
  } catch (error) { next(error); }
};

export const assignLecturer = async (req, res, next) => {
  try {
    const assignment = await lecturerService.assignLecturer(
      parseInt(req.params.groupId), req.body.lecturer_id,
    );
    res.status(201).json({ success: true, message: "Lecturer assigned successfully", data: assignment });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const removeLecturer = async (req, res, next) => {
  try {
    await lecturerService.removeLecturer(
      parseInt(req.params.groupId), parseInt(req.params.lecturerId),
    );
    res.status(200).json({ success: true, message: "Lecturer removed from group successfully" });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
