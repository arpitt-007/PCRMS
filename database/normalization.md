# Normalization (1NF -> 3NF)

- **1NF**: every column is atomic; no repeating groups. A case with several criminals is stored in the junction table `CriminalCase`, not as a list column. Evidence hand-overs are rows in `EvidenceCustody`.
- **2NF**: tables with a single-column PK satisfy it automatically. `CriminalCase` has the composite key (criminal_id, case_id); its only non-key attribute `role` describes the pair, so there is no partial dependency.
- **3NF**: no transitive dependencies. Station details live only in `PoliceStation` (Officer keeps `station_id`); court details only in `Court`; a case stores `officer_id`, not the officer's name or rank. Counts such as "arrests per case" are derived by views, never stored.

## Design notes / deviations from the report
- `Case` is named `Cases` (reserved SQL word); `rank` is back-tick quoted.
- Added `Complaint` (module 5), `EvidenceCustody` (chain of custody), `CaseStatusLog` (trigger audit), `AppUser` (role-based login).
- `CourtProceeding.court_id` added so Court -> CourtProceeding is a real relationship.
- `Arrest.criminal_id` added so an arrest identifies who was arrested.
- Extra attributes requested: officer badge/phone, criminal dob/gender/address, case FIR number/title/description/filed date, arrest location/charges, evidence collection date.

## Programmability (database/programmability.sql)
| Object | Purpose |
|---|---|
| `v_case_overview`, `v_wanted_criminals`, `v_station_stats` | Views feeding reports |
| `sp_register_fir` | Transactional FIR registration, links an optional complaint |
| `sp_close_case`, `sp_criminal_history` | Close a case; list a criminal's cases |
| `trg_arrest_after_insert` | Marks criminal Arrested, moves Open case to Under Investigation, links criminal to case |
| `trg_proceeding_after_insert` | Moves case to In Court |
| `trg_case_status_log` | Logs every case status change |
| `trg_evidence_custody_init` | Creates first chain-of-custody entry |
