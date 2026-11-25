
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5001);
const SHORTLIST_SCORE = 70;

app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("CampusConnect backend is running!");
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

// Dashboard statistics
app.get("/api/dashboard", async (req, res) => {
  try {
    const [[students]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Students"
    );

    const [[companies]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Companies"
    );

    const [[internships]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Internships"
    );

    const [[applications]] = await pool.query(
      "SELECT COUNT(*) AS total FROM Applications"
    );

    res.json({
      students: students.total,
      companies: companies.total,
      internships: internships.total,
      applications: applications.total
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);

    res.status(500).json({
      message: "Could not load dashboard data"
    });
  }
});

// Get internships
app.get("/api/internships", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const like = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT i.internship_id,
              i.title,
              i.description,
              i.stipend,
              i.location,
              i.deadline,
              i.eligibility_cgpa,
              c.company_name
       FROM Internships i
       JOIN Companies c
         ON c.company_id = i.company_id
       WHERE i.title LIKE ?
          OR c.company_name LIKE ?
          OR i.location LIKE ?
       ORDER BY i.created_at DESC`,
      [like, like, like]
    );

    res.json(rows);
  } catch (error) {
    console.error("Internships error:", error.message);

    res.status(500).json({
      message: "Could not fetch internships"
    });
  }
});

// Add an internship
app.post("/api/internships", async (req, res) => {
  const {
    company_id,
    title,
    description = "",
    stipend = 0,
    location = "",
    deadline = null,
    eligibility_cgpa = 0
  } = req.body;

  if (!company_id || !String(title || "").trim()) {
    return res.status(400).json({
      message: "Company ID and internship title are required"
    });
  }

  const companyId = Number(company_id);
  const stipendValue = Number(stipend);
  const cgpaValue = Number(eligibility_cgpa);

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0 ||
    !Number.isFinite(stipendValue) ||
    stipendValue < 0 ||
    !Number.isFinite(cgpaValue) ||
    cgpaValue < 0 ||
    cgpaValue > 10
  ) {
    return res.status(400).json({
      message: "Enter a valid company ID, stipend and CGPA between 0 and 10"
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Internships
       (company_id, title, description, stipend, location,
        deadline, eligibility_cgpa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        String(title).trim(),
        description,
        stipendValue,
        location,
        deadline || null,
        cgpaValue
      ]
    );

    res.status(201).json({
      message: "Internship created successfully",
      internship_id: result.insertId
    });
  } catch (error) {
    console.error("Create internship error:", error.message);

    res.status(400).json({
      message: "Could not create internship. Check the company ID and input values."
    });
  }
});

// Get companies
app.get("/api/companies", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT company_id, company_name, email, location
       FROM Companies
       ORDER BY company_name`
    );

    res.json(rows);
  } catch (error) {
    console.error("Companies error:", error.message);

    res.status(500).json({
      message: "Could not fetch companies"
    });
  }
});

// Register a student
app.post("/api/students", async (req, res) => {
  const { name, email, branch, semester, cgpa = null } = req.body;

  if (
    !String(name || "").trim() ||
    !String(email || "").trim() ||
    !String(branch || "").trim() ||
    semester === undefined ||
    semester === null ||
    semester === ""
  ) {
    return res.status(400).json({
      message: "Name, email, branch and semester are required"
    });
  }

  const semesterValue = Number(semester);
  const cgpaValue =
    cgpa === null || cgpa === "" ? null : Number(cgpa);

  if (
    !Number.isInteger(semesterValue) ||
    semesterValue < 1 ||
    semesterValue > 8 ||
    (cgpaValue !== null &&
      (!Number.isFinite(cgpaValue) ||
        cgpaValue < 0 ||
        cgpaValue > 10))
  ) {
    return res.status(400).json({
      message: "Enter a valid semester between 1 and 8 and CGPA between 0 and 10"
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Students
       (name, email, branch, semester, cgpa)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        String(email).trim(),
        String(branch).trim(),
        semesterValue,
        cgpaValue
      ]
    );

    res.status(201).json({
      message: "Student registered successfully",
      student_id: result.insertId
    });
  } catch (error) {
    console.error("Register student error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    res.status(400).json({
      message: "Could not register student"
    });
  }
});

// Apply for an internship
app.post("/api/applications", async (req, res) => {
  const { student_id, internship_id } = req.body;

  const studentId = Number(student_id);
  const internshipId = Number(internship_id);

  if (
    !Number.isInteger(studentId) ||
    studentId <= 0 ||
    !Number.isInteger(internshipId) ||
    internshipId <= 0
  ) {
    return res.status(400).json({
      message: "Valid student ID and internship ID are required"
    });
  }

  try {
    const [[student]] = await pool.query(
      `SELECT student_id, cgpa
       FROM Students
       WHERE student_id = ?`,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const [[internship]] = await pool.query(
      `SELECT internship_id, eligibility_cgpa, deadline
       FROM Internships
       WHERE internship_id = ?`,
      [internshipId]
    );

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found"
      });
    }

    if (
      student.cgpa === null ||
      Number(student.cgpa) < Number(internship.eligibility_cgpa)
    ) {
      return res.status(400).json({
        message: "You do not meet the CGPA eligibility criteria"
      });
    }

    if (internship.deadline) {
      const deadlineDate = new Date(internship.deadline);
      const today = new Date();

      deadlineDate.setHours(23, 59, 59, 999);
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        return res.status(400).json({
          message: "The application deadline has passed"
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO Applications
       (student_id, internship_id, status)
       VALUES (?, ?, 'Applied')`,
      [studentId, internshipId]
    );

    res.status(201).json({
      message: "Application submitted successfully",
      application_id: result.insertId,
      status: "Applied"
    });
  } catch (error) {
    console.error("Application error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You have already applied for this internship"
      });
    }

    res.status(400).json({
      message: "Application failed. Check the student and internship details."
    });
  }
});

// Get applications, including their latest interview score
app.get("/api/applications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.application_id,
              s.student_id,
              s.name AS student_name,
              s.email,
              i.internship_id,
              i.title AS internship_title,
              c.company_name,
              a.applied_on,
              a.status,
              iv.interview_id,
              iv.interview_date,
              iv.score AS interview_score,
              iv.result AS interview_result,
              iv.notes AS interview_notes
       FROM Applications a
       JOIN Students s
         ON s.student_id = a.student_id
       JOIN Internships i
         ON i.internship_id = a.internship_id
       JOIN Companies c
         ON c.company_id = i.company_id
       LEFT JOIN (
         SELECT Interviews.*,
                ROW_NUMBER() OVER (
                  PARTITION BY application_id
                  ORDER BY interview_date DESC, interview_id DESC
                ) AS interview_rank
         FROM Interviews
       ) iv
         ON iv.application_id = a.application_id AND iv.interview_rank = 1
       ORDER BY a.applied_on DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Applications error:", error.message);

    res.status(500).json({
      message: "Could not fetch applications"
    });
  }
});

// Record an interview score and apply the shortlisting rule
app.post("/api/interviews", async (req, res) => {
  const {
    application_id,
    interview_date,
    score,
    notes = ""
  } = req.body;

  const applicationId = Number(application_id);
  const scoreValue = Number(score);
  const interviewDate = new Date(interview_date);

  if (
    !Number.isInteger(applicationId) ||
    applicationId <= 0 ||
    !interview_date ||
    Number.isNaN(interviewDate.getTime()) ||
    score === undefined ||
    score === null ||
    score === "" ||
    !Number.isFinite(scoreValue) ||
    scoreValue < 0 ||
    scoreValue > 100
  ) {
    return res.status(400).json({
      message: "Provide a valid application ID, interview date and score between 0 and 100"
    });
  }

  try {
    const [[application]] = await pool.query(
      `SELECT a.application_id,
              a.status,
              s.cgpa,
              i.eligibility_cgpa
       FROM Applications a
       JOIN Students s
         ON s.student_id = a.student_id
       JOIN Internships i
         ON i.internship_id = a.internship_id
       WHERE a.application_id = ?`,
      [applicationId]
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    if (["Selected", "Rejected"].includes(application.status)) {
      return res.status(409).json({
        message: "This application already has a final decision. The interview score was not saved."
      });
    }

    const interviewResult =
      scoreValue >= SHORTLIST_SCORE ? "Passed" : "Failed";

    const [result] = await pool.query(
      `INSERT INTO Interviews
       (application_id, interview_date, result, notes, score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        applicationId,
        interviewDate,
        interviewResult,
        String(notes).trim() || null,
        scoreValue
      ]
    );

    let newStatus = application.status;
    let message;

    if (
      scoreValue >= SHORTLIST_SCORE &&
      application.cgpa !== null &&
      Number(application.cgpa) >= Number(application.eligibility_cgpa)
    ) {
      if (application.status === "Applied") {
        await pool.query(
          `UPDATE Applications
           SET status = 'Shortlisted'
           WHERE application_id = ?
             AND status = 'Applied'`,
          [applicationId]
        );

        newStatus = "Shortlisted";
      } else {
        newStatus = application.status;
      }

      message =
        "Interview score recorded. The application qualifies for shortlisting. Final selection still requires a recruiter decision.";
    } else if (scoreValue < SHORTLIST_SCORE) {
      message =
        "Interview score recorded. The score is below the shortlisting cutoff. The application has not been automatically rejected.";
    } else {
      message =
        "Interview score recorded, but the student does not currently meet the CGPA requirement for shortlisting.";
    }

    res.status(201).json({
      message,
      interview_id: result.insertId,
      application_id: applicationId,
      score: scoreValue,
      shortlist_cutoff: SHORTLIST_SCORE,
      result: interviewResult,
      status: newStatus
    });
  } catch (error) {
    console.error("Record interview error:", error.message);

    res.status(500).json({
      message: "Could not record the interview. Check the application ID and database connection."
    });
  }
});

// Get interview records
app.get("/api/interviews", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT iv.interview_id,
              iv.application_id,
              s.name AS student_name,
              i.title AS internship_title,
              c.company_name,
              iv.interview_date,
              iv.score,
              iv.result,
              iv.notes,
              a.status AS application_status
       FROM Interviews iv
       JOIN Applications a
         ON a.application_id = iv.application_id
       JOIN Students s
         ON s.student_id = a.student_id
       JOIN Internships i
         ON i.internship_id = a.internship_id
       JOIN Companies c
         ON c.company_id = i.company_id
       ORDER BY iv.interview_date DESC, iv.interview_id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Interviews error:", error.message);

    res.status(500).json({
      message: "Could not fetch interviews"
    });
  }
});

// Recruiter decision: select or reject an application
app.patch("/api/applications/:applicationId/decision", async (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const { status } = req.body;

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({
      message: "A valid application ID is required"
    });
  }

  if (!["Selected", "Rejected"].includes(status)) {
    return res.status(400).json({
      message: "Decision must be Selected or Rejected"
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT application_id, status
       FROM Applications
       WHERE application_id = ?
       FOR UPDATE`,
      [applicationId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Application not found"
      });
    }

    await connection.query(
      `UPDATE Applications
       SET status = ?
       WHERE application_id = ?`,
      [status, applicationId]
    );

    if (status === "Selected") {
      await connection.query(
        `INSERT INTO Selections (application_id, offer_status)
         VALUES (?, 'Offered')
         ON DUPLICATE KEY UPDATE offer_status = 'Offered'`,
        [applicationId]
      );
    } else {
      await connection.query(
        `DELETE FROM Selections
         WHERE application_id = ?`,
        [applicationId]
      );
    }

    await connection.commit();

    res.json({
      message: `Recruiter decision saved: ${status}`,
      application_id: applicationId,
      status
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Recruiter decision error:", error.message);

    res.status(500).json({
      message: "Could not save the recruiter decision"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Placement report
app.get("/api/reports/placements", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.company_name,
              i.title AS internship_title,
              COUNT(a.application_id) AS total_applications,
              SUM(
                CASE
                  WHEN a.status = 'Selected' THEN 1
                  ELSE 0
                END
              ) AS selected_students
       FROM Internships i
       JOIN Companies c
         ON c.company_id = i.company_id
       LEFT JOIN Applications a
         ON a.internship_id = i.internship_id
       GROUP BY i.internship_id, c.company_name, i.title
       ORDER BY selected_students DESC, total_applications DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Placement report error:", error.message);

    res.status(500).json({
      message: "Could not generate placement report"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
