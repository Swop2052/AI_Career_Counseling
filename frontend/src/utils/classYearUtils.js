// frontend/src/utils/classYearUtils.js - Authoritative Class/Year dropdown options and validation

export const CLASS_YEAR_GROUPS = [
  {
    group: "School",
    options: [
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th"
    ]
  },
  {
    group: "Undergraduate",
    options: [
      "Undergraduate — 1st Year",
      "Undergraduate — 2nd Year",
      "Undergraduate — 3rd Year",
      "Undergraduate — 4th Year"
    ]
  },
  {
    group: "Postgraduate",
    options: [
      "Postgraduate — 1st Year",
      "Postgraduate — 2nd Year"
    ]
  },
  {
    group: "Other",
    options: [
      "Diploma",
      "Other"
    ]
  }
];

export const ALL_CLASS_YEAR_OPTIONS = CLASS_YEAR_GROUPS.flatMap(g => g.options);

export const isValidClassYear = (val) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return ALL_CLASS_YEAR_OPTIONS.includes(trimmed);
};
