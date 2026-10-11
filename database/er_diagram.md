# PCRMS ER Diagram (Crow's Foot notation)

```mermaid
erDiagram
  PoliceStation ||--o{ Officer : employs
  PoliceStation ||--o{ Complaint : receives
  Officer ||--o{ Cases : handles
  Officer ||--o{ Arrest : makes
  Officer ||--o{ EvidenceCustody : "holds evidence"
  Cases |o--o{ Complaint : "originates from"
  Criminal ||--o{ CriminalCase : involved_in
  Cases ||--o{ CriminalCase : involves
  Criminal ||--o{ Arrest : "is arrested in"
  Cases ||--o{ Arrest : leads_to
  Arrest ||--o{ Evidence : yields
  Evidence ||--o{ EvidenceCustody : "tracked by"
  Court ||--o{ CourtProceeding : hosts
  Cases ||--o{ CourtProceeding : tried_in
  Cases ||--o{ CaseStatusLog : "status history"
  Officer |o--o{ AppUser : "login account"

  PoliceStation { int station_id PK  string name  string address  string city  string phone }
  Officer { int officer_id PK  string badge_number UK  string name  string rank  string phone  int station_id FK }
  Criminal { int criminal_id PK  string name  date dob  string gender  string address  string status  string photo }
  Cases { int case_id PK  string fir_number UK  string title  string type  string description  date filed_date  string status  int officer_id FK }
  Complaint { int complaint_id PK  string complainant  string contact  string description  date filed_on  int station_id FK  int case_id FK }
  CriminalCase { int criminal_id PK,FK  int case_id PK,FK  string role }
  Arrest { int arrest_id PK  date date  string location  string charges  int case_id FK  int officer_id FK  int criminal_id FK }
  Evidence { int evidence_id PK  string type  string description  date collected_on  int arrest_id FK }
  EvidenceCustody { int custody_id PK  int evidence_id FK  int officer_id FK  string action  datetime logged_at }
  Court { int court_id PK  string name  string location }
  CourtProceeding { int proceeding_id PK  date date  string outcome  int case_id FK  int court_id FK }
  AppUser { int user_id PK  string username UK  string password_hash  string role  int officer_id FK }
  CaseStatusLog { int log_id PK  int case_id FK  string old_status  string new_status  datetime changed_at }
```

Cardinalities: Station 1:N Officer, Officer 1:N Cases, Criminal M:N Cases (via `CriminalCase`), Case 1:N Arrest, Arrest 1:N Evidence, Court 1:N CourtProceeding, Case 1:N CourtProceeding.
