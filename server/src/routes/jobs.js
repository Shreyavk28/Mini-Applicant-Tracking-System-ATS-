
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

// Fields allowed for creating and updating jobs
const ALLOWED_EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

function validateJob(body) {
  const { title, department, location, employment_type } = body;

  if (
    !title?.trim() ||
    !department?.trim() ||
    !location?.trim() ||
    !employment_type
  ) {
    return "Title, department, location, and employment type are required.";
  }

  if (!ALLOWED_EMPLOYMENT_TYPES.includes(employment_type)) {
    return `Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(", ")}.`;
  }

  return null;
}

// GET /api/jobs — list jobs
router.get("/", async (req, res, next) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT id, title, department, location,
              employment_type, created_at
       FROM jobs
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id — get one job
router.get("/:id", async (req, res, next) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT id, title, department, location,
              employment_type, created_at
       FROM jobs
       WHERE id = ?`,
      [req.params.id]
    );

    if (!jobs.length) {
      return res.status(404).json({ message: "Job not found." });
    }

    res.json({ success: true, data: jobs[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs — create a job
router.post("/", async (req, res, next) => {
  try {
    const validationError = validateJob(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, department, location, employment_type } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO jobs (title, department, location, employment_type)
       VALUES (?, ?, ?, ?)`,
      [
        title.trim(),
        department.trim(),
        location.trim(),
        employment_type,
      ]
    );

    const [jobs] = await pool.execute(
      `SELECT id, title, department, location,
              employment_type, created_at
       FROM jobs WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Job created successfully.",
      data: jobs[0],
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/jobs/:id — update a job
router.put("/:id", async (req, res, next) => {
  try {
    const validationError = validateJob(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, department, location, employment_type } = req.body;

    const [result] = await pool.execute(
      `UPDATE jobs
       SET title = ?, department = ?, location = ?, employment_type = ?
       WHERE id = ?`,
      [
        title.trim(),
        department.trim(),
        location.trim(),
        employment_type,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM jobs WHERE id = ?",
        [req.params.id]
      );

      if (!existing.length) {
        return res.status(404).json({ message: "Job not found." });
      }
    }

    const [jobs] = await pool.execute(
      `SELECT id, title, department, location,
              employment_type, created_at
       FROM jobs WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Job updated successfully.",
      data: jobs[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:id — delete a job
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM jobs WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found." });
    }

    res.json({
      success: true,
      message: "Job deleted successfully.",
    });
  } catch (error) {
    // A database foreign-key constraint may prevent deleting
    // a job that still has applications linked to it.
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "This job has linked applications. Remove or reassign those applications before deleting the job.",
      });
    }

    next(error);
  }
});

module.exports = router;
