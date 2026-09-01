/**
 * Simple, transparent, rule-based lead scoring (0-100). Deliberately not an
 * AI/ML model — every point is traceable to a specific, explainable signal,
 * which matters when a counsellor asks "why is this lead hot?"
 */
const HIGH_VALUE_SOURCES = ['referral', 'school_partnership', 'walk_in'];

const scoreLead = (student) => {
  let score = 0;

  // Contactability
  if (student.email) score += 10;
  if (student.phone) score += 10;

  // Intent signals
  if (student.intendedProgram && student.intendedProgram !== 'General Inquiry') score += 10;
  if (student.preferredProvince) score += 5;
  if (student.message && student.message.trim().length > 20) score += 10;

  // Qualification signals
  const education = (student.education || '').toLowerCase();
  if (education.includes('master')) score += 20;
  else if (education.includes('bachelor')) score += 15;
  else if (education) score += 5;

  if (Array.isArray(student.workExperience) && student.workExperience.length > 0) score += 10;

  const scores = student.testScores || {};
  const hasTestScore = ['ielts', 'pte', 'celpip', 'toefl'].some((k) => scores[k]?.overall);
  if (hasTestScore) score += 15;

  if (student.financialProfile?.budgetAmount) score += 10;

  // Source quality
  if (HIGH_VALUE_SOURCES.includes(student.leadSource)) score += 10;

  return Math.max(0, Math.min(100, score));
};

module.exports = { scoreLead };
