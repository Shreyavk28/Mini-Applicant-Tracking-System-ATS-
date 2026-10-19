
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

// Validate positive integer IDs.
function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0 &&
    Number.isSafeInteger(Number(value));
}

// Read the allowed stages directly from the existing MySQL ENUM.
// This avoids assuming stage values that may differ in your database.
async function getAllowedStages() {
  const [columns] = await pool.query(
    "SHOW COLUMNS FROM applications LIKE 'stage'"
  );

  if (!columns.length) {
    throw new Error("The applications table has no stage column.");
  }

  const type = columns[0].Type;

  if (!type.startsWith("enum(")) {
    throw new Error("The applications.stage column must be an ENUM.");
  }

  return [...type.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(
    (match) => match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\")
  );
}

// Shared query: application with candidate and job details.
const applicationSelect = `
  SELECT
    a.id,
    a.candidate_id,
    a.job_id,
    a.stage,
    a.applied_at,
    c.full_name AS candidate_name,
    c.email AS candidate_email,
    j.title AS job_title,
    j.department,
    j.location,
    j.employment_type
  FROM applications a
  JOIN candidates c ON c.id = a.candidate_id
  JOIN jobs j ON j.id = a.job_id
`;

// GET /api/applications
// Optional filters: ?stage=Applied&job_id=1&candidate_id=2
router.get("/", async (req, res, next) => {
  try {
    const { stage, job_id, candidate_id } = req.query;
    const conditions = [];
    const values = [];

    if (stage !== undefined) {
      const allowedStages = await getAllowedStages();

      if (!allowedStages.includes(stage)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application stage.",
          allowedStages,
        });
      }

      conditions.push("a.stage = ?");
      values.push(stage);
    }

    for (const [field, column] of [
      ["job_id", "a.job_id"],
      ["candidate_id", "a.candidate_id"],
    ]) {
      if (req.query[field] !== undefined) {
        if (!isValidId(req.query[field])) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a positive integer.`,
          });
        }

        conditions.push(`${column} = ?`);
        values.push(Number(req.query[field]));
      }
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [applications] = await pool.execute(
      `${applicationSelect}
       ${where}
       ORDER BY a.applied_at DESC, a.id DESC`,
      values
    );

    return res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Application ID must be a positive integer.",
      });
    }

    const [rows] = await pool.execute(
      `${applicationSelect} WHERE a.id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/applications
// Body: { "candidate_id": 1, "job_id": 2 }
router.post("/", async (req, res, next) => {
  try {
    const { candidate_id, job_id } = req.body || {};

    if (!isValidId(candidate_id) || !isValidId(job_id)) {
      return res.status(400).json({
        success: false,
        message: "candidate_id and job_id must be positive integers.",
      });
    }

    // Check both references before inserting.
    const [[candidate]] = await pool.execute(
      "SELECT id FROM candidates WHERE id = ?",
      [Number(candidate_id)]
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    const [[job]] = await pool.execute(
      "SELECT id FROM jobs WHERE id = ?",
      [Number(job_id)]
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Use the database's configured default stage.
    // applied_at is also populated by the existing table default.
    const [result] = await pool.execute(
      `INSERT INTO applications (candidate_id, job_id)
       VALUES (?, ?)`,
      [Number(candidate_id), Number(job_id)]
    );

    const [rows] = await pool.execute(
      `${applicationSelect} WHERE a.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Application created successfully.",
      data: rows[0],
    });
  } catch (error) {
    // UNIQUE KEY (candidate_id, job_id)
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This candidate has already applied for this job.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "The candidate or job reference is invalid.",
      });
    }

    next(error);
  }
});

// PUT /api/applications/:id/stage
// Body: { "stage": "Screening" }
router.put("/:id/stage", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Application ID must be a positive integer.",
      });
    }

    const { stage } = req.body || {};

    if (typeof stage !== "string" || !stage.trim()) {
      return res.status(400).json({
        success: false,
        message: "A stage value is required.",
      });
    }

    const allowedStages = await getAllowedStages();

    if (!allowedStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application stage.",
        allowedStages,
      });
    }

    const id = Number(req.params.id);

    const [result] = await pool.execute(
      "UPDATE applications SET stage = ? WHERE id = ?",
      [stage, id]
    );

    if (result.affectedRows === 0) {
      const [[existing]] = await pool.execute(
        "SELECT id, stage FROM applications WHERE id = ?",
        [id]
      );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }
    }

    const [rows] = await pool.execute(
      `${applicationSelect} WHERE a.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Application stage updated successfully.",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Application ID must be a positive integer.",
      });
    }

    const [result] = await pool.execute(
      "DELETE FROM applications WHERE id = ?",
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
