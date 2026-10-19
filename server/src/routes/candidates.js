
const express = require("express");
const { pool } = require("../config/db");

const router = express.Router();

const allowedFields = [
  "full_name",
  "email",
  "phone",
  "skills",
  "experience_years",
];

function validateCandidate(body, isUpdate = false) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }

  const has = (field) =>
    Object.prototype.hasOwnProperty.call(body, field);

  if (isUpdate && !allowedFields.some(has)) {
    errors.push("Provide at least one valid field to update");
  }

  if (!isUpdate || has("full_name")) {
    if (
      typeof body.full_name !== "string" ||
      !body.full_name.trim() ||
      body.full_name.trim().length > 100
    ) {
      errors.push("Full name is required and must be at most 100 characters");
    }
  }

  if (!isUpdate || has("email")) {
    if (
      typeof body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
      body.email.trim().length > 150
    ) {
      errors.push("Provide a valid email address of at most 150 characters");
    }
  }

  if (has("phone")) {
    if (
      body.phone !== null &&
      (typeof body.phone !== "string" ||
        body.phone.length > 20)
    ) {
      errors.push("Phone must be a string of at most 20 characters or null");
    }
  }

  if (has("skills")) {
    if (
      body.skills !== null &&
      typeof body.skills !== "string"
    ) {
      errors.push("Skills must be a string or null");
    }
  }

  if (has("experience_years")) {
    const value = body.experience_years;

    if (
      value === null ||
      value === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0 ||
      Number(value) > 999.9
    ) {
      errors.push("Experience must be a number between 0 and 999.9");
    }
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unsupported fields: ${unknownFields.join(", ")}`);
  }

  return errors;
}

function handleDatabaseError(error, res, next) {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A candidate with this email already exists",
    });
  }

  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      success: false,
      message:
        "This candidate has applications. Remove the associated applications before deleting the candidate.",
    });
  }

  next(error);
}

// CREATE: POST /api/candidates
router.post("/", async (req, res, next) => {
  const errors = validateCandidate(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const {
    full_name,
    email,
    phone = null,
    skills = null,
    experience_years = 0,
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO candidates
        (full_name, email, phone, skills, experience_years)
       VALUES (?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        phone,
        skills,
        Number(experience_years),
      ]
    );

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, skills,
              experience_years, created_at
       FROM candidates
       WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: rows[0],
    });
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

// READ, SEARCH, FILTER AND PAGINATE:
// GET /api/candidates?q=shreya&page=1&limit=10
// GET /api/candidates?minExperience=1&maxExperience=5
router.get("/", async (req, res, next) => {
  try {
    const {
      q = "",
      minExperience,
      maxExperience,
      page = "1",
      limit = "10",
    } = req.query;

    if (
      typeof q !== "string" ||
      q.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at most 100 characters",
      });
    }

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !/^[1-9]\d*$/.test(page) ||
      !/^[1-9]\d*$/.test(limit) ||
      !Number.isSafeInteger(parsedPage) ||
      !Number.isSafeInteger(parsedLimit) ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive; limit must be between 1 and 100",
      });
    }

    const filters = [];
    const params = [];

    if (q.trim()) {
      filters.push(
        "(full_name LIKE ? OR email LIKE ? OR skills LIKE ?)"
      );

      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    for (const [field, value] of [
      ["experience_years >=", minExperience],
      ["experience_years <=", maxExperience],
    ]) {
      if (value !== undefined) {
        if (
          value === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          Number(value) > 999.9
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field.includes(">=") ? "minExperience" : "maxExperience"} value`,
          });
        }

        filters.push(`${field.split(" ")[0]} ${field.split(" ")[1]} ?`);
        params.push(Number(value));
      }
    }

    if (
      minExperience !== undefined &&
      maxExperience !== undefined &&
      Number(minExperience) > Number(maxExperience)
    ) {
      return res.status(400).json({
        success: false,
        message: "minExperience cannot exceed maxExperience",
      });
    }

    const where = filters.length
      ? `WHERE ${filters.join(" AND ")}`
      : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM candidates ${where}`,
      params
    );

    const total = countRows[0].total;
    const offset = (parsedPage - 1) * parsedLimit;

    const [candidates] = await pool.execute(
      `SELECT id, full_name, email, phone, skills,
              experience_years, created_at
       FROM candidates
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, parsedLimit, offset]
    );

    return res.json({
      success: true,
      data: candidates,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// READ ONE: GET /api/candidates/:id
router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, skills,
              experience_years, created_at
       FROM candidates
       WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
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

// UPDATE: PUT /api/candidates/:id
router.put("/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }

  const errors = validateCandidate(req.body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      let value = req.body[field];

      if (field === "full_name") value = value.trim();
      if (field === "email") value = value.trim().toLowerCase();
      if (field === "experience_years") value = Number(value);

      updates.push(`${field} = ?`);
      params.push(value);
    }
  }

  try {
    const [result] = await pool.execute(
      `UPDATE candidates
       SET ${updates.join(", ")}
       WHERE id = ?`,
      [...params, id]
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM candidates WHERE id = ?",
        [id]
      );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, skills,
              experience_years, created_at
       FROM candidates WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Candidate updated successfully",
      data: rows[0],
    });
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

// DELETE: DELETE /api/candidates/:id
router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM candidates WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

module.exports = router;
