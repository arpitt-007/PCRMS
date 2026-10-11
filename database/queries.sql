-- Demonstration queries (joins, aggregates, subqueries, procedures). Run after setup.
USE pcrms;

-- 1. Cases with handling officer and station (3-table join)
SELECT c.fir_number, c.title, o.name AS officer, ps.name AS station
FROM Cases c JOIN Officer o ON o.officer_id=c.officer_id JOIN PoliceStation ps ON ps.station_id=o.station_id;

-- 2. Criminals involved in more than one case (M:N + GROUP BY/HAVING)
SELECT cr.name, COUNT(*) AS cases FROM Criminal cr JOIN CriminalCase cc ON cc.criminal_id=cr.criminal_id
GROUP BY cr.criminal_id, cr.name HAVING COUNT(*) > 1;

-- 3. Officers with no cases (LEFT JOIN anti-join)
SELECT o.name FROM Officer o LEFT JOIN Cases c ON c.officer_id=o.officer_id WHERE c.case_id IS NULL;

-- 4. Cases that have evidence (subquery)
SELECT fir_number, title FROM Cases WHERE case_id IN
  (SELECT a.case_id FROM Arrest a JOIN Evidence e ON e.arrest_id=a.arrest_id);

-- 5. Cases per type and status
SELECT type, status, COUNT(*) AS total FROM Cases GROUP BY type, status ORDER BY type;

-- 6. Upcoming hearings
SELECT p.date, c.name AS court, cs.fir_number FROM CourtProceeding p
JOIN Court c ON c.court_id=p.court_id JOIN Cases cs ON cs.case_id=p.case_id WHERE p.date >= CURDATE() ORDER BY p.date;

-- 7. Views and procedures
SELECT * FROM v_case_overview;
SELECT * FROM v_wanted_criminals;
CALL sp_criminal_history(1);
-- CALL sp_register_fir('FIR/2026/099','Test burglary','Burglary','Back door forced',1,NULL);
-- CALL sp_close_case(2);
