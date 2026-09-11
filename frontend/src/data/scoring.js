// Static imports removed. Functions now accept appConfig dynamically.
// Static imports removed. Functions now accept appConfig dynamically.

// Icon shown next to every category-level stat/score in the UI (progress
// list, side panel, results card) so a visual is always available even for
// categories whose questions don't carry their own icon.
const SCORE_ICON = "/images/icons/bar-chart.png";
// Icon shown next to a fully completed category (checkmark).
const DONE_ICON = "/images/icons/check.png";
// Icon shown next to the category currently in progress.
const CURRENT_ICON = "/images/icons/target.png";

// Every question is answered on a 1-5 scale, so a category with `n`
// questions has a minimum possible raw total of `n * 1` and a maximum
// possible raw total of `n * 5`. These are the R_min / R_max bounds used
// by the min-max normalization formula below (handwritten reference:
// N = (R - R_min) / (R_max - R_min) x 100).
const SCALE_MIN = 1;
const SCALE_MAX = 5;

export function getCategoryIndexes(questions, cat) {
  return questions.map((q, i) => (q.category === cat ? i : -1)).filter((i) => i !== -1);
}

// Real match % for a category, computed from the answers actually given,
// using min-max normalization: N = (R - R_min) / (R_max - R_min) x 100
//   R      = raw sum of the given answers (actual score)
//   R_min  = lowest possible raw sum for that many questions (all answered 1)
//   R_max  = highest possible raw sum for that many questions (all answered 5)
// This scales the raw total into a 0-100 range instead of just dividing by
// the flat maximum, so a single low-count answer doesn't crush the score.
export function categoryScore(questions, answers, cat) {
  const idxs = getCategoryIndexes(questions, cat);
  const given = idxs.filter((i) => answers[i] !== undefined);
  if (given.length === 0) return 0;

  const R = given.reduce((acc, i) => acc + answers[i], 0); // raw score
  const R_min = given.length * SCALE_MIN; // lowest possible raw score
  const R_max = given.length * SCALE_MAX; // highest possible raw score

  // Guard: if every question could only ever score the same value
  // (R_max === R_min), avoid a divide-by-zero and treat it as a full match.
  if (R_max === R_min) return 100;

  const N = ((R - R_min) / (R_max - R_min)) * 100;
  return Math.round(N);
}

export function categoryStatsFor(appConfig, questions, answers, currentCategory, done) {
  const CATEGORY_ORDER = appConfig?.CATEGORY_ORDER || [];
  const CATEGORY_INFO = appConfig?.CATEGORY_INFO || {};

  return CATEGORY_ORDER.map((cat) => {
    const idxs = getCategoryIndexes(questions, cat);
    const answeredInCat = idxs.filter((i) => answers[i] !== undefined).length;
    const isDone = idxs.length > 0 && answeredInCat === idxs.length;
    const isCurrent = !done && cat === currentCategory;
    return {
      cat,
      info: CATEGORY_INFO[cat],
      answeredInCat,
      totalInCat: idxs.length,
      isDone,
      isCurrent,
      // Icon reference for this category's row: checkmark once complete,
      // target while in progress, otherwise the generic score icon.
      icon: isDone ? DONE_ICON : isCurrent ? CURRENT_ICON : SCORE_ICON,
    };
  });
}

// Builds a personalized summary of *why* someone scored the way they did on
// a trait, based on the specific questions they rated highest/lowest —
// instead of always showing the same static blurb regardless of answers.
export function buildAnswerSummary(appConfig, questions, answers, cat) {
  const CATEGORY_INFO = appConfig?.CATEGORY_INFO || {};

  const idxs = getCategoryIndexes(questions, cat);
  const answered = idxs
    .filter((i) => answers[i] !== undefined)
    .map((i) => ({ index: i, question: questions[i], value: answers[i] }));

  const strong = answered
    .filter((a) => a.value >= 4)
    .sort((a, b) => b.value - a.value)
    .map((a) => ({
      // Falls back to the shared score icon if a question has no visual set,
      // so the summary list is never missing an icon.
      icon: a.question.visual || SCORE_ICON,
      text: a.question.text,
      pickedLabel: a.question.options?.find((o) => o.value === a.value)?.label || String(a.value),
    }));

  const weak = answered
    .filter((a) => a.value <= 2)
    .sort((a, b) => a.value - b.value)
    .map((a) => ({
      icon: a.question.visual || SCORE_ICON,
      text: a.question.text,
      pickedLabel: a.question.options?.find((o) => o.value === a.value)?.label,
    }));

  // Category-level icon (from CATEGORY_INFO if present, else the shared
  // fallback) so the summary header always has something to render too.
  const categoryIcon = CATEGORY_INFO[cat]?.emoji || SCORE_ICON;

  return { strong, weak, answeredCount: answered.length, categoryIcon };
}
