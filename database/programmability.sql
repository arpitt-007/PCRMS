-- Views, stored procedures and triggers. Statements are separated by a line containing only $$
USE pcrms;

CREATE OR REPLACE VIEW v_case_overview AS
SELECT c.case_id, c.fir_number, c.title, c.type, c.status, c.filed_date,
       o.name AS officer, ps.name AS station,
       (SELECT COUNT(*) FROM CriminalCase cc WHERE cc.case_id=c.case_id) AS criminals,
       (SELECT COUNT(*) FROM Arrest a WHERE a.case_id=c.case_id) AS arrests,
       (SELECT COUNT(*) FROM Evidence e JOIN Arrest a ON a.arrest_id=e.arrest_id WHERE a.case_id=c.case_id) AS evidence_items
FROM Cases c JOIN Officer o ON o.officer_id=c.officer_id
JOIN PoliceStation ps ON ps.station_id=o.station_id;
$$
CREATE OR REPLACE VIEW v_wanted_criminals AS
SELECT criminal_id, name, dob, gender, address, photo FROM Criminal WHERE status='Wanted';
$$
CREATE OR REPLACE VIEW v_station_stats AS
SELECT ps.station_id, ps.name, ps.city,
       COUNT(DISTINCT o.officer_id) AS officers,
       COUNT(DISTINCT c.case_id) AS cases_handled
FROM PoliceStation ps LEFT JOIN Officer o ON o.station_id=ps.station_id
LEFT JOIN Cases c ON c.officer_id=o.officer_id GROUP BY ps.station_id, ps.name, ps.city;
$$
CREATE PROCEDURE sp_register_fir(IN p_fir VARCHAR(30), IN p_title VARCHAR(150), IN p_type VARCHAR(60),
  IN p_desc TEXT, IN p_officer INT, IN p_complaint INT)
BEGIN
  DECLARE new_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  INSERT INTO Cases(fir_number,title,type,description,filed_date,officer_id)
    VALUES (p_fir,p_title,p_type,p_desc,CURDATE(),p_officer);
  SET new_id = LAST_INSERT_ID();
  IF p_complaint IS NOT NULL THEN
    UPDATE Complaint SET case_id=new_id WHERE complaint_id=p_complaint;
  END IF;
  COMMIT;
  SELECT new_id AS case_id;
END
$$
CREATE PROCEDURE sp_close_case(IN p_case INT)
BEGIN
  UPDATE Cases SET status='Closed' WHERE case_id=p_case;
END
$$
CREATE PROCEDURE sp_criminal_history(IN p_criminal INT)
BEGIN
  SELECT c.case_id, c.fir_number, c.title, c.type, c.status, cc.role
  FROM CriminalCase cc JOIN Cases c ON c.case_id=cc.case_id
  WHERE cc.criminal_id=p_criminal ORDER BY c.filed_date DESC;
END
$$
CREATE TRIGGER trg_arrest_after_insert AFTER INSERT ON Arrest FOR EACH ROW
BEGIN
  UPDATE Criminal SET status='Arrested' WHERE criminal_id=NEW.criminal_id;
  UPDATE Cases SET status='Under Investigation' WHERE case_id=NEW.case_id AND status='Open';
  INSERT IGNORE INTO CriminalCase(criminal_id,case_id) VALUES (NEW.criminal_id,NEW.case_id);
END
$$
CREATE TRIGGER trg_proceeding_after_insert AFTER INSERT ON CourtProceeding FOR EACH ROW
BEGIN
  UPDATE Cases SET status='In Court' WHERE case_id=NEW.case_id AND status IN ('Open','Under Investigation');
END
$$
CREATE TRIGGER trg_case_status_log AFTER UPDATE ON Cases FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO CaseStatusLog(case_id,old_status,new_status) VALUES (NEW.case_id,OLD.status,NEW.status);
  END IF;
END
$$
CREATE TRIGGER trg_evidence_custody_init AFTER INSERT ON Evidence FOR EACH ROW
BEGIN
  INSERT INTO EvidenceCustody(evidence_id,officer_id,action)
  SELECT NEW.evidence_id, a.officer_id, 'Collected and logged'
  FROM Arrest a WHERE a.arrest_id=NEW.arrest_id;
END
$$
