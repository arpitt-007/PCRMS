USE pcrms;
INSERT INTO PoliceStation(name,address,city,phone) VALUES
 ('Central Station','12 MG Road','Vellore','0416-111111'),('North Station','4 Gandhi Nagar','Chennai','044-222222');
INSERT INTO Officer(badge_number,name,`rank`,phone,station_id) VALUES
 ('B1001','R. Kumar','Inspector','9000000001',1),('B1002','S. Iyer','Sub-Inspector','9000000002',1),('B2001','A. Khan','Inspector','9000000003',2);
INSERT INTO Criminal(name,dob,gender,address,status) VALUES
 ('Vikram Rao','1990-04-12','Male','Katpadi, Vellore','Wanted'),
 ('Deepak Sharma','1985-11-02','Male','T Nagar, Chennai','Wanted'),
 ('Imran Ali','1992-07-21','Male','Anna Nagar, Chennai','Convicted');
INSERT INTO Cases(fir_number,title,type,description,filed_date,officer_id) VALUES
 ('FIR/2026/001','Mobile theft at bus stand','Theft','Phone snatched','2026-08-02',1),
 ('FIR/2026/002','Online payment fraud','Fraud','UPI scam','2026-08-10',2),
 ('FIR/2026/003','Street assault','Assault','Fight outside a shop','2026-08-15',3);
INSERT INTO CriminalCase(criminal_id,case_id,role) VALUES (2,2,'Suspect'),(3,3,'Convict');
INSERT INTO Complaint(complainant,contact,description,filed_on,station_id,case_id) VALUES
 ('M. Patel','9111111111','Phone stolen at bus stand','2026-08-02',1,1),
 ('L. Das','9222222222','Online payment fraud','2026-08-10',1,2);
INSERT INTO Court(name,location) VALUES ('District Court','Vellore'),('Sessions Court','Chennai');
-- Triggers fire below: criminal -> Arrested, case status updated, custody log created
INSERT INTO Arrest(date,location,charges,case_id,officer_id,criminal_id) VALUES
 ('2026-08-05','Katpadi bus stand','Theft (IPC 379)',1,1,1);
INSERT INTO Evidence(type,description,collected_on,arrest_id) VALUES
 ('Physical','Recovered mobile phone','2026-08-05',1),('Digital','CCTV footage','2026-08-06',1);
INSERT INTO CourtProceeding(date,outcome,case_id,court_id) VALUES
 ('2026-09-01','Adjourned',1,1),('2026-11-20',NULL,1,1);
