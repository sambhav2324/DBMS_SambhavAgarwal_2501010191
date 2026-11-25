
CREATE DATABASE IF NOT EXISTS internship_placement_db;
USE internship_placement_db;

CREATE TABLE IF NOT EXISTS Students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    branch VARCHAR(60) NOT NULL,
    semester INT NOT NULL,
    cgpa DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (semester BETWEEN 1 AND 8),
    CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10)
);

CREATE TABLE IF NOT EXISTS StudentSkills (
    student_id INT NOT NULL,
    skill_name VARCHAR(60) NOT NULL,
    PRIMARY KEY (student_id, skill_name),
    CONSTRAINT fk_student_skills_student
        FOREIGN KEY (student_id)
        REFERENCES Students(student_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    location VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Internships (
    internship_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    stipend DECIMAL(10,2) NOT NULL DEFAULT 0,
    location VARCHAR(120),
    deadline DATE,
    eligibility_cgpa DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_internships_company
        FOREIGN KEY (company_id)
        REFERENCES Companies(company_id)
        ON DELETE RESTRICT,
    CHECK (stipend >= 0),
    CHECK (eligibility_cgpa BETWEEN 0 AND 10)
);

CREATE TABLE IF NOT EXISTS InternshipSkills (
    internship_id INT NOT NULL,
    skill_name VARCHAR(60) NOT NULL,
    PRIMARY KEY (internship_id, skill_name),
    CONSTRAINT fk_internship_skills_internship
        FOREIGN KEY (internship_id)
        REFERENCES Internships(internship_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    internship_id INT NOT NULL,
    applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Applied', 'Shortlisted', 'Rejected', 'Selected')
        NOT NULL DEFAULT 'Applied',
    UNIQUE KEY uq_student_internship (student_id, internship_id),
    CONSTRAINT fk_applications_student
        FOREIGN KEY (student_id)
        REFERENCES Students(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_applications_internship
        FOREIGN KEY (internship_id)
        REFERENCES Internships(internship_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Interviews (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    interview_date DATETIME NOT NULL,
    result ENUM('Pending', 'Passed', 'Failed')
        NOT NULL DEFAULT 'Pending',
    notes VARCHAR(500),
    score DECIMAL(5,2) NULL,
    CONSTRAINT fk_interviews_application
        FOREIGN KEY (application_id)
        REFERENCES Applications(application_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Selections (
    selection_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    offer_status ENUM('Offered', 'Accepted', 'Declined')
        NOT NULL DEFAULT 'Offered',
    joining_date DATE,
    CONSTRAINT fk_selections_application
        FOREIGN KEY (application_id)
        REFERENCES Applications(application_id)
        ON DELETE CASCADE
);


USE internship_placement_db;

INSERT INTO Companies (company_name, email, location)
VALUES
(1,'Tech Solutions', 'hr@techsolutions.com', 'Gurugram'),
(2,'Web Innovators', 'hr@webinnovators.com', 'Delhi'),
(3,'CodeCraft Technologies', 'hr@codecraft.com', 'Noida'),
(4,'DataSphere Analytics', 'hr@datasphere.com', 'Bengaluru'),
(5,'CloudNova Solutions', 'hr@cloudnova.com', 'Hyderabad'),
(6,'PixelWorks Studio', 'hr@pixelworks.com', 'Pune'),
(7,'SecureNet Systems', 'hr@securenet.com', 'Mumbai'),
(8, 'AI Future Labs', 'hr@aifuturelabs.com', 'Chennai'),
(9, 'AppSphere Technologies', 'hr@appsphere.com', 'Jaipur'),
(10,'NextGen Software', 'hr@nextgensoftware.com', 'Noida'),
(11, 'BrightTech Solutions', 'hr@brighttech.com', 'Delhi'),
(12, 'InnovateSoft Technologies', 'hr@innovatesoft.com', 'Noida'),
(13, 'NextWave Systems', 'hr@nextwave.com', 'Gurugram'),
(14, 'DigitalEdge Technologies', 'hr@digitaledge.com', 'Bengaluru'),
(15, 'SmartCode Solutions', 'hr@smartcode.com', 'Hyderabad'),
(16, 'FutureTech Innovations', 'hr@futuretech.com', 'Pune'),
(17, 'WebSpark Technologies', 'hr@webspark.com', 'Mumbai'),
(18, 'CloudBridge Solutions', 'hr@cloudbridge.com', 'Chennai'),
(19, 'DataVision Technologies', 'hr@datavision.com', 'Jaipur'),
(20, 'TechOrbit Systems', 'hr@techorbit.com', 'Noida');


INSERT IGNORE INTO Internships
(company_id, title, description, stipend, location, deadline, eligibility_cgpa)
VALUES
(1, 'Python Developer Intern', 'Work on Python development.', 10000, 'Gurugram', '2026-12-15', 7.00),
(2, 'Frontend Developer Intern', 'Build interfaces using React and JavaScript.', 8000, 'Delhi', '2026-12-20', 7.50),
(3, 'Java Developer Intern', 'Work on Java and backend development.', 12000, 'Bengaluru', '2026-12-10', 7.00),
(4, 'Data Analyst Intern', 'Analyze data using SQL and Python.', 10000, 'Hyderabad', '2026-12-12', 6.50),
(5, 'Cloud Computing Intern', 'Learn cloud infrastructure and deployment.', 15000, 'Pune', '2026-12-18', 7.50),
(6, 'UI/UX Design Intern', 'Design interfaces and prototypes.', 8000, 'Noida', '2026-12-20', 6.00),
(7, 'Cybersecurity Intern', 'Learn network security.', 12000, 'Delhi', '2026-12-22', 7.00),
(8, 'Machine Learning Intern', 'Build machine learning models using Python.', 18000, 'Gurugram', '2026-12-25', 8.00),
(9, 'Android App Developer Intern', 'Develop Android applications.', 11000, 'Mumbai', '2026-12-28', 6.50),
(10, 'Full Stack Developer Intern', 'Work with React, Node.js and MySQL.', 16000, 'Chennai', '2026-12-30', 7.50);

SELECT * FROM Companies;
SELECT * FROM Internships;


