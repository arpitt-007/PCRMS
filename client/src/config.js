// Field definitions for the generic list/form page. ref = foreign-key dropdown, show = joined column to display.
const ref = (resource, label) => ({ resource, label });

export const resources = {
  stations: { title: 'Police Stations', pk: 'station_id', fields: [
    { name: 'name', label: 'Name', required: true }, { name: 'address', label: 'Address', required: true },
    { name: 'city', label: 'City', required: true }, { name: 'phone', label: 'Phone' }] },
  officers: { title: 'Officers', pk: 'officer_id', fields: [
    { name: 'badge_number', label: 'Badge No.', required: true }, { name: 'name', label: 'Name', required: true },
    { name: 'rank', label: 'Rank', options: ['Constable', 'Head Constable', 'Sub-Inspector', 'Inspector', 'DSP', 'SP'], required: true },
    { name: 'phone', label: 'Phone' },
    { name: 'station_id', label: 'Station', ref: ref('stations', 'name'), required: true, show: 'station' }] },
  criminals: { title: 'Criminals', pk: 'criminal_id', link: (r) => `/criminals/${r.criminal_id}`, fields: [
    { name: 'name', label: 'Name', required: true }, { name: 'dob', label: 'Date of Birth', type: 'date' },
    { name: 'gender', label: 'Gender', options: ['Male', 'Female', 'Other'] }, { name: 'address', label: 'Address' },
    { name: 'status', label: 'Status', options: ['Wanted', 'Arrested', 'Convicted', 'Released'], required: true },
    { name: 'photo', label: 'Photo URL', hideInTable: true }] },
  cases: { title: 'Cases / FIR', pk: 'case_id', link: (r) => `/cases/${r.case_id}`, statusFilter: ['Open', 'Under Investigation', 'In Court', 'Closed'], fields: [
    { name: 'fir_number', label: 'FIR No.', required: true }, { name: 'title', label: 'Title', required: true },
    { name: 'type', label: 'Type', required: true }, { name: 'filed_date', label: 'Filed On', type: 'date', required: true },
    { name: 'status', label: 'Status', options: ['Open', 'Under Investigation', 'In Court', 'Closed'], required: true },
    { name: 'officer_id', label: 'Officer', ref: ref('officers', 'name'), required: true, show: 'officer' },
    { name: 'description', label: 'Description', type: 'textarea', hideInTable: true }] },
  complaints: { title: 'Complaints', pk: 'complaint_id', fields: [
    { name: 'complainant', label: 'Complainant', required: true }, { name: 'contact', label: 'Contact' },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'filed_on', label: 'Filed On', type: 'date', required: true },
    { name: 'station_id', label: 'Station', ref: ref('stations', 'name'), required: true, show: 'station' },
    { name: 'case_id', label: 'Linked Case', ref: ref('cases', 'fir_number') }] },
  arrests: { title: 'Arrests', pk: 'arrest_id', fields: [
    { name: 'date', label: 'Date', type: 'date', required: true }, { name: 'location', label: 'Location' },
    { name: 'charges', label: 'Charges' },
    { name: 'criminal_id', label: 'Criminal', ref: ref('criminals', 'name'), required: true, show: 'criminal' },
    { name: 'case_id', label: 'Case', ref: ref('cases', 'fir_number'), required: true },
    { name: 'officer_id', label: 'Officer', ref: ref('officers', 'name'), required: true, show: 'officer' }] },
  evidence: { title: 'Evidence', pk: 'evidence_id', custody: true, fields: [
    { name: 'type', label: 'Type', required: true }, { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'collected_on', label: 'Collected On', type: 'date', required: true },
    { name: 'arrest_id', label: 'Arrest #', ref: ref('arrests', 'arrest_id'), required: true }] },
  courts: { title: 'Courts', pk: 'court_id', fields: [
    { name: 'name', label: 'Name', required: true }, { name: 'location', label: 'Location', required: true }] },
  proceedings: { title: 'Court Proceedings', pk: 'proceeding_id', fields: [
    { name: 'date', label: 'Date', type: 'date', required: true }, { name: 'outcome', label: 'Outcome' },
    { name: 'case_id', label: 'Case', ref: ref('cases', 'fir_number'), required: true, show: 'fir_number' },
    { name: 'court_id', label: 'Court', ref: ref('courts', 'name'), required: true, show: 'court' }] },
};

export const nav = [
  ['/', 'Dashboard'], ['/cases', 'Cases / FIR'], ['/complaints', 'Complaints'], ['/criminals', 'Criminals'],
  ['/arrests', 'Arrests'], ['/evidence', 'Evidence'], ['/proceedings', 'Court Proceedings'],
  ['/officers', 'Officers'], ['/stations', 'Stations'], ['/courts', 'Courts'], ['/reports', 'Reports'],
];
