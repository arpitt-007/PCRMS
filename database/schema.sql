-- PCRMS: Police Records & Criminal Management System (MySQL 8+)
DROP DATABASE IF EXISTS pcrms;
CREATE DATABASE pcrms CHARACTER SET utf8mb4;
USE pcrms;

CREATE TABLE PoliceStation (
  station_id INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  address    VARCHAR(255) NOT NULL,
  city       VARCHAR(80)  NOT NULL,
  phone      VARCHAR(20)  NULL,
  UNIQUE (name, city)
);

CREATE TABLE Officer (
  officer_id   INT AUTO_INCREMENT PRIMARY KEY,
  badge_number VARCHAR(20) NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  `rank`       ENUM('Constable','Head Constable','Sub-Inspector','Inspector','DSP','SP') NOT NULL,
  phone        VARCHAR(20) NULL,
  station_id   INT NOT NULL,
  FOREIGN KEY (station_id) REFERENCES PoliceStation(station_id) ON UPDATE CASCADE
);

CREATE TABLE Criminal (
  criminal_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  dob         DATE NULL,
  gender      ENUM('Male','Female','Other') NULL,
  address     VARCHAR(255) NULL,
  status      ENUM('Wanted','Arrested','Convicted','Released') NOT NULL DEFAULT 'Wanted',
  photo       VARCHAR(255) NULL
);

-- "Case" is a reserved SQL word, so the table is named Cases.
CREATE TABLE Cases (
  case_id     INT AUTO_INCREMENT PRIMARY KEY,
  fir_number  VARCHAR(30) NOT NULL UNIQUE,
  title       VARCHAR(150) NOT NULL,
  type        VARCHAR(60) NOT NULL,
  description TEXT NULL,
  filed_date  DATE NOT NULL,
  status      ENUM('Open','Under Investigation','In Court','Closed') NOT NULL DEFAULT 'Open',
  officer_id  INT NOT NULL,
  FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON UPDATE CASCADE
);

CREATE TABLE Complaint (
  complaint_id INT AUTO_INCREMENT PRIMARY KEY,
  complainant  VARCHAR(100) NOT NULL,
  contact      VARCHAR(40) NULL,
  description  TEXT NOT NULL,
  filed_on     DATE NOT NULL,
  station_id   INT NOT NULL,
  case_id      INT NULL,
  FOREIGN KEY (station_id) REFERENCES PoliceStation(station_id),
  FOREIGN KEY (case_id)    REFERENCES Cases(case_id) ON DELETE SET NULL
);

CREATE TABLE CriminalCase (
  criminal_id INT NOT NULL,
  case_id     INT NOT NULL,
  role        ENUM('Accused','Suspect','Convict') NOT NULL DEFAULT 'Accused',
  PRIMARY KEY (criminal_id, case_id),
  FOREIGN KEY (criminal_id) REFERENCES Criminal(criminal_id) ON DELETE CASCADE,
  FOREIGN KEY (case_id)     REFERENCES Cases(case_id)        ON DELETE CASCADE
);

CREATE TABLE Arrest (
  arrest_id   INT AUTO_INCREMENT PRIMARY KEY,
  date        DATE NOT NULL,
  location    VARCHAR(150) NULL,
  charges     VARCHAR(255) NULL,
  case_id     INT NOT NULL,
  officer_id  INT NOT NULL,
  criminal_id INT NOT NULL,
  FOREIGN KEY (case_id)     REFERENCES Cases(case_id),
  FOREIGN KEY (officer_id)  REFERENCES Officer(officer_id),
  FOREIGN KEY (criminal_id) REFERENCES Criminal(criminal_id)
);

CREATE TABLE Evidence (
  evidence_id  INT AUTO_INCREMENT PRIMARY KEY,
  type         VARCHAR(60) NOT NULL,
  description  TEXT NULL,
  collected_on DATE NOT NULL,
  arrest_id    INT NOT NULL,
  FOREIGN KEY (arrest_id) REFERENCES Arrest(arrest_id) ON DELETE CASCADE
);

-- Chain of custody: every hand-over of an evidence item
CREATE TABLE EvidenceCustody (
  custody_id  INT AUTO_INCREMENT PRIMARY KEY,
  evidence_id INT NOT NULL,
  officer_id  INT NOT NULL,
  action      VARCHAR(100) NOT NULL,
  logged_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evidence_id) REFERENCES Evidence(evidence_id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id)  REFERENCES Officer(officer_id)
);

CREATE TABLE Court (
  court_id INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL
);

CREATE TABLE CourtProceeding (
  proceeding_id INT AUTO_INCREMENT PRIMARY KEY,
  date          DATE NOT NULL,
  outcome       VARCHAR(255) NULL,
  case_id       INT NOT NULL,
  court_id      INT NOT NULL,
  FOREIGN KEY (case_id)  REFERENCES Cases(case_id),
  FOREIGN KEY (court_id) REFERENCES Court(court_id)
);

-- Application login (role-based access)
CREATE TABLE AppUser (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('admin','officer','viewer') NOT NULL,
  officer_id    INT NULL,
  FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON DELETE SET NULL
);

-- Filled by trigger when a case status changes
CREATE TABLE CaseStatusLog (
  log_id     INT AUTO_INCREMENT PRIMARY KEY,
  case_id    INT NOT NULL,
  old_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES Cases(case_id) ON DELETE CASCADE
);

CREATE INDEX idx_cases_status ON Cases(status);
CREATE INDEX idx_criminal_name ON Criminal(name);
CREATE INDEX idx_officer_station ON Officer(station_id);
CREATE INDEX idx_arrest_criminal ON Arrest(criminal_id);
