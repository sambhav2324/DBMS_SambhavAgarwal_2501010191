import React, { useEffect, useMemo, useState } from "react";

const defaultApiUrl = import.meta.env.PROD
  ? "https://internship-placement-system-mprk.vercel.app"
  : "http://localhost:5001";
const API = `${import.meta.env.VITE_API_URL || defaultApiUrl}/api`;

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export default function App() {
  const [page, setPage] = useState("internships");
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [dashboard, setDashboard] = useState({
    students: 0,
    companies: 0,
    internships: 0,
    applications: 0
  });

  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    branch: "CSE",
    semester: "3",
    cgpa: "8.0"
  });

  const [applyForm, setApplyForm] = useState({
    student_id: "",
    internship_id: ""
  });

  const [internshipForm, setInternshipForm] = useState({
    company_id: "",
    title: "",
    description: "",
    stipend: "8000",
    location: "",
    deadline: "",
    eligibility_cgpa: "7"
  });

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadData() {
    setLoading(true);

    try {
      const [
        internshipData,
        applicationData,
        companyData,
        dashboardData
      ] = await Promise.all([
        request(`/internships?search=${encodeURIComponent(search)}`),
        request("/applications"),
        request("/companies"),
        request("/dashboard")
      ]);

      setInternships(internshipData);
      setApplications(applicationData);
      setCompanies(companyData);
      setDashboard(dashboardData);

      setInternshipForm((current) => ({
        ...current,
        company_id:
          current.company_id || String(companyData[0]?.company_id || "")
      }));
    } catch (error) {
      setNotice(
        `${error.message}. Check that the backend and MySQL are running.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredInternships = useMemo(
    () => internships,
    [internships]
  );

  async function submitStudent(event) {
    event.preventDefault();

    try {
      const result = await request("/students", {
        method: "POST",
        body: JSON.stringify({
          ...studentForm,
          semester: Number(studentForm.semester),
          cgpa:
            studentForm.cgpa === ""
              ? null
              : Number(studentForm.cgpa)
        })
      });

      setNotice(
        `${result.message}. Your student ID is ${result.student_id}. Use this ID when applying.`
      );

      setStudentForm({
        name: "",
        email: "",
        branch: "CSE",
        semester: "3",
        cgpa: "8.0"
      });

      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function submitApplication(event) {
    event.preventDefault();

    try {
      const result = await request("/applications", {
        method: "POST",
        body: JSON.stringify({
          student_id: Number(applyForm.student_id),
          internship_id: Number(applyForm.internship_id)
        })
      });

      setNotice(
        `${result.message}. Application ID: ${result.application_id}`
      );

      setApplyForm({
        student_id: "",
        internship_id: ""
      });

      await loadData();
      setPage("applications");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function submitInternship(event) {
    event.preventDefault();

    try {
      const result = await request("/internships", {
        method: "POST",
        body: JSON.stringify({
          ...internshipForm,
          company_id: Number(internshipForm.company_id),
          stipend: Number(internshipForm.stipend),
          eligibility_cgpa: Number(internshipForm.eligibility_cgpa),
          deadline: internshipForm.deadline || null
        })
      });

      setNotice(`${result.message}.`);

      setInternshipForm((current) => ({
        ...current,
        title: "",
        description: "",
        location: "",
        deadline: ""
      }));

      await loadData();
      setPage("internships");
    } catch (error) {
      setNotice(error.message);
    }
  }

  const navItems = [
    ["internships", "Find Internships"],
    ["applications", "Applications"],
    ["student", "Register Student"],
    ["post", "Post Internship"]
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <div>
            <strong>CampusConnect</strong>
            <span>Career portal</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        {navItems.map(([key, label]) => (
          <button
            key={key}
            className={`nav-link ${page === key ? "active" : ""}`}
            onClick={() => {
              setPage(key);
              setNotice("");
            }}
          >
            <span className="nav-dot" />
            {label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="avatar">ST</div>
          <div>
            <strong>Student Portal</strong>
            <span>Internship & placement</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">CAREER DEVELOPMENT</span>
            <h1>Internship & Placement Management</h1>
          </div>

          <button
           className="outline-button"
           onClick={loadData}
           disabled={loading}
          >
           {loading ? "Refreshing..." : "↻ Refresh data"}
         </button>
        </header>

        <section className="welcome">
          <div>
            <span className="welcome-tag">
              YOUR NEXT OPPORTUNITY STARTS HERE
            </span>
            <h2>Build your future, one opportunity at a time.</h2>
            <p>
              Discover internships, manage applications and take the next
              step in your career.
            </p>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-circle">↗</div>
            <div className="art-card">
              Career
              <br />
              <b>growth</b>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <Stat
            label="Registered students"
            value={dashboard.students}
            icon="♙"
            tone="purple"
          />

          <Stat
            label="Partner companies"
            value={dashboard.companies}
            icon="▦"
            tone="blue"
          />

          <Stat
            label="Open internships"
            value={dashboard.internships}
            icon="▣"
            tone="green"
          />

          <Stat
            label="Applications"
            value={dashboard.applications}
            icon="↗"
            tone="orange"
          />
        </section>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {page === "internships" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">EXPLORE OPPORTUNITIES</span>
                <h2>Latest internships</h2>
                <p>
                  Find a role that matches your skills and goals.
                </p>
              </div>

              <span className="count-pill">
                {filteredInternships.length} opportunities
              </span>
            </div>

            <div className="search-row">
              <span>⌕</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadData();
                }}
                placeholder="Search by role, company or location..."
              />

              <button className="primary-button" onClick={loadData}>
                Search
              </button>
            </div>

            {loading ? (
              <p className="empty-state">Loading internships...</p>
            ) : filteredInternships.length === 0 ? (
              <p className="empty-state">
                No internships found. Add a company and internship in MySQL
                or use the Post Internship page.
              </p>
            ) : (
              <div className="internship-grid">
                {filteredInternships.map((item) => (
                  <article
                    className="internship-card"
                    key={item.internship_id}
                  >
                    <div className="card-top">
                      <div className="company-logo">
                        {item.company_name?.slice(0, 1).toUpperCase()}
                      </div>

                      <span className="status-chip">Open</span>
                    </div>

                    <h3>{item.title}</h3>

                    <p className="company-name">
                      {item.company_name}
                    </p>

                    <p className="description">
                      {item.description ||
                        "Explore this internship opportunity and develop practical skills."}
                    </p>

                    <div className="job-meta">
                      <span>
                        ⌖ {item.location || "Location not specified"}
                      </span>

                      <span>
                        ◷ {item.deadline || "Flexible deadline"}
                      </span>
                    </div>

                    <div className="card-footer">
                      <div>
                        <span className="muted-label">
                          MONTHLY STIPEND
                        </span>

                        <strong>{money(item.stipend)}</strong>
                      </div>

                      <button
                        className="apply-button"
                        onClick={() => {
                          setApplyForm({
                            student_id: "",
                            internship_id: String(item.internship_id)
                          });

                          setPage("applications");
                        }}
                      >
                        Apply now <span>→</span>
                      </button>
                    </div>

                    <div className="eligibility">
                      Minimum CGPA: {item.eligibility_cgpa}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {page === "applications" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">APPLICATION TRACKER</span>
                <h2>Applications</h2>
                <p>
                  Submit a new application or review submitted applications.
                </p>
              </div>
            </div>

            <form
              className="form-panel compact-form"
              onSubmit={submitApplication}
            >
              <h3>Apply for an internship</h3>

              <div className="form-grid">
                <Field
                  label="Student ID"
                  type="number"
                  value={applyForm.student_id}
                  onChange={(value) =>
                    setApplyForm({
                      ...applyForm,
                      student_id: value
                    })
                  }
                  placeholder="Register first to get an ID"
                  required
                />

                <label className="field">
                  <span>Internship</span>

                  <select
                    required
                    value={applyForm.internship_id}
                    onChange={(e) =>
                      setApplyForm({
                        ...applyForm,
                        internship_id: e.target.value
                      })
                    }
                  >
                    <option value="">Select internship</option>

                    {internships.map((item) => (
                      <option
                        key={item.internship_id}
                        value={item.internship_id}
                      >
                        {item.title} — {item.company_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button className="primary-button" type="submit">
                Submit application
              </button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Internship</th>
                    <th>Company</th>
                    <th>Applied on</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td>
                        <strong>{application.student_name}</strong>
                        <small>{application.email}</small>
                      </td>

                      <td>{application.internship_title}</td>

                      <td>{application.company_name}</td>

                      <td>
                        {new Date(
                          application.applied_on
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span
                          className={`table-status ${
                            (application.status || "Applied").toLowerCase()
                          }`}
                        >
                          {application.status || "Applied"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No applications yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "student" && (
          <section className="content-section narrow-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">STUDENT PROFILE</span>
                <h2>Register a student</h2>
                <p>
                  Create a student record before applying to an internship.
                </p>
              </div>
            </div>

            <form className="form-panel" onSubmit={submitStudent}>
              <div className="form-grid">
                <Field
                  label="Full name"
                  value={studentForm.name}
                  onChange={(value) =>
                    setStudentForm({
                      ...studentForm,
                      name: value
                    })
                  }
                  placeholder="e.g. Aarav Sharma"
                  required
                />

                <Field
                  label="College email"
                  type="email"
                  value={studentForm.email}
                  onChange={(value) =>
                    setStudentForm({
                      ...studentForm,
                      email: value
                    })
                  }
                  placeholder="you@example.com"
                  required
                />

                <label className="field">
                  <span>Branch</span>

                  <select
                    value={studentForm.branch}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        branch: e.target.value
                      })
                    }
                  >
                    <option>CSE</option>
                    <option>IT</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>Mechanical</option>
                    <option>Civil</option>
                    <option>Other</option>
                  </select>
                </label>

                <Field
                  label="Semester"
                  type="number"
                  value={studentForm.semester}
                  onChange={(value) =>
                    setStudentForm({
                      ...studentForm,
                      semester: value
                    })
                  }
                  min="1"
                  max="8"
                  required
                />

                <Field
                  label="CGPA (out of 10)"
                  type="number"
                  value={studentForm.cgpa}
                  onChange={(value) =>
                    setStudentForm({
                      ...studentForm,
                      cgpa: value
                    })
                  }
                  min="0"
                  max="10"
                  step="0.01"
                />
              </div>

              <button className="primary-button" type="submit">
                Register student
              </button>
            </form>
          </section>
        )}

        {page === "post" && (
          <section className="content-section narrow-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">COMPANY WORKSPACE</span>
                <h2>Post an internship</h2>
                <p>
                  Publish an opportunity for students to discover.
                </p>
              </div>
            </div>

            {companies.length === 0 ? (
              <div className="notice">
                Add a company in MySQL first, then post an internship.
              </div>
            ) : (
              <form
                className="form-panel"
                onSubmit={submitInternship}
              >
                <div className="form-grid">
                  <label className="field">
                    <span>Company</span>

                    <select
                      required
                      value={internshipForm.company_id}
                      onChange={(e) =>
                        setInternshipForm({
                          ...internshipForm,
                          company_id: e.target.value
                        })
                      }
                    >
                      {companies.map((company) => (
                        <option
                          key={company.company_id}
                          value={company.company_id}
                        >
                          {company.company_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Field
                    label="Internship title"
                    value={internshipForm.title}
                    onChange={(value) =>
                      setInternshipForm({
                        ...internshipForm,
                        title: value
                      })
                    }
                    placeholder="e.g. React Developer Intern"
                    required
                  />

                  <Field
                    label="Monthly stipend (₹)"
                    type="number"
                    value={internshipForm.stipend}
                    onChange={(value) =>
                      setInternshipForm({
                        ...internshipForm,
                        stipend: value
                      })
                    }
                    min="0"
                    required
                  />

                  <Field
                    label="Location"
                    value={internshipForm.location}
                    onChange={(value) =>
                      setInternshipForm({
                        ...internshipForm,
                        location: value
                      })
                    }
                    placeholder="e.g. Gurugram / Remote"
                  />

                  <Field
                    label="Application deadline"
                    type="date"
                    value={internshipForm.deadline}
                    onChange={(value) =>
                      setInternshipForm({
                        ...internshipForm,
                        deadline: value
                      })
                    }
                  />

                  <Field
                    label="Minimum CGPA"
                    type="number"
                    value={internshipForm.eligibility_cgpa}
                    onChange={(value) =>
                      setInternshipForm({
                        ...internshipForm,
                        eligibility_cgpa: value
                      })
                    }
                    min="0"
                    max="10"
                    step="0.01"
                  />
                </div>

                <label className="field">
                  <span>Description</span>

                  <textarea
                    rows="4"
                    value={internshipForm.description}
                    onChange={(e) =>
                      setInternshipForm({
                        ...internshipForm,
                        description: e.target.value
                      })
                    }
                    placeholder="Describe the role, responsibilities and skills..."
                  />
                </label>

                <button className="primary-button" type="submit">
                  Publish internship
                </button>
              </form>
            )}
          </section>
        )}

        <footer className="footer">
          <span>CampusConnect</span>
          <span>
            Internship & Placement Management System · DBMS Project
          </span>
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value, icon, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <span className="stat-arrow">↗</span>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  min,
  max,
  step
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}
