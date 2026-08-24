// Seeded RNG so the mock data is stable across reloads (ported from mock_dashboard.html)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    ;[a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pool(entries) {
  const out = [];
  entries.forEach(([v, n]) => { for (let i = 0; i < n; i++) out.push(v); });
  return shuffle(out);
}

// Distributions modeled on the real export's column value counts
export const TOTAL = 42;

const stages = pool([
  ["Closed Lost", 18], ["Initial Engagement", 12], ["Closed Won", 3],
  ["Center Tour", 3], ["State Review", 2], ["Home Visit - Clinical (ERN)", 2],
  ["Follow-up Assessments", 1], ["Home Visit - Non Clinical", 1],
]);
const locations = pool([["Sacramento, CA", 25], ["South LA, CA", 17]]);
const reasons = pool([
  ["Nursing home diversion", 15], ["Complex care", 11],
  ["Caregiver support", 9], ["PACE eligibility", 7],
]);
const interests = pool([["Closed", 21], ["Hot", 15], ["Cold", 5], ["Warm", 1]]);
const enrollmentStatuses = pool([
  ["Engaged in enrollment process", 13], ["Attempting to contact", 9],
  ["Not likely eligible at this time", 5], ["Not interested in proceeding", 4],
  ["Withdrew before assessment", 3], ["Withdrew after assessment", 3],
  ["Currently enrolled", 3], ["Withdrew after state approval", 2],
]);

// [first, last] pairs in the exact order they appear in the xlsx (row 15 = index 0)
const patients = [
  ["Amara", "Pettigrew"], ["Curtis", "Dunmore"], ["Franklin", "Jandali"], ["Tomas", "Halvorsen"],
  ["Reuben", "Tanaka"], ["Dwayne", "Whitaker"], ["Amara", "Lindqvist"], ["Beatriz", "Castellanos"],
  ["Marisol", "Farooqi"], ["Estelle", "Vasquez"], ["Abel", "Quintero"], ["Reuben", "Grimaldi"],
  ["Consuelo", "Chukwu"], ["Wallace", "Tanaka"], ["Roland", "Whitaker"], ["Alton", "Grimaldi"],
  ["Sylvester", "Ellison"], ["Ingrid", "Tanaka"], ["Salim", "Delacroix"], ["Josephine", "Rasmussen"],
  ["Sylvester", "Castellanos"], ["Franklin", "Grimaldi"], ["Chang", "Ashford"], ["Fatima", "Zabala"],
  ["Amara", "Ashford"], ["Lucille", "Xiong"], ["Bernadette", "Ellison"], ["Yolanda", "Dunmore"],
  ["Lorraine", "Dunmore"], ["Otis", "Kowalczyk"], ["Renata", "Lindqvist"], ["Bianca", "Pettigrew"],
  ["Reuben", "Mbeki"], ["Franklin", "Iverson"], ["Sylvester", "Sorensen"], ["Hyun", "Okonkwo"],
  ["Amara", "Delacroix"], ["Marisol", "Chukwu"], ["Reuben", "Ellison"], ["Kiet", "Delacroix"],
  ["Hector", "Boudreaux"], ["Marisol", "Sorensen"],
];

const orgs = ["Ahmanson Senior Citizen Center", "Habitat Health - SAC", "Habitat Health - SLA", "Kaiser Permanente",
  "Ken Nakaoka Community Center (Gardena Senior Center)", "South Bay Retirement Residence", "TENA"];
const contacts = ["Abadir, Erik (R.N.)", "Abadir, George (R.N.)", "Bassett, Erik (R.N.)", "Bassett, Linh (R.N.)",
  "Bassett, Wei (R.N.)", "Chen, Carmen (R.N.)", "Chen, David (R.N.)", "Chen, George (R.N.)", "Johansson, Carmen (R.N.)",
  "Johansson, Erik (R.N.)", "Johansson, George (R.N.)", "Johansson, Linh (R.N.)", "Johansson, Maria (R.N.)",
  "Johansson, Samuel (R.N.)", "Johansson, Theresa (R.N.)", "Moreno, George (R.N.)", "Moreno, Linh (R.N.)",
  "Nguyen, Carmen (R.N.)", "Nguyen, Linh (R.N.)", "Nguyen, Theresa (R.N.)", "Nguyen, Wei (R.N.)", "Okafor, Maria (R.N.)",
  "Okafor, Samuel (R.N.)", "Okafor, Theresa (R.N.)", "Oyelaran, Anita (R.N.)", "Oyelaran, Carmen (R.N.)",
  "Oyelaran, Erik (R.N.)", "Oyelaran, George (R.N.)", "Oyelaran, Linh (R.N.)", "Patel, George (R.N.)",
  "Patel, Maria (R.N.)", "Patel, Samuel (R.N.)", "Reyes, David (R.N.)", "Reyes, Erik (R.N.)", "Steinberg, Erik (R.N.)",
  "Steinberg, George (R.N.)", "Whitfield, Wei (R.N.)"];

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function randomDateWithinDays(days) {
  const now = new Date("2026-08-24");
  const offset = Math.floor(rand() * days);
  const d = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const rows = [];
for (let i = 0; i < TOTAL; i++) {
  rows.push({
    first: patients[i][0],
    last: patients[i][1],
    stage: stages[i],
    reason: reasons[i],
    org: orgs[i % orgs.length],
    contact: contacts[i % contacts.length],
    location: locations[i],
    referralDate: randomDateWithinDays(120),
    interest: interests[i],
    enrollmentStatus: enrollmentStatuses[i],
  });
}

export function countBy(list) {
  const m = {};
  list.forEach((v) => (m[v] = (m[v] || 0) + 1));
  return m;
}
