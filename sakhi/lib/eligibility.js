import { isRuleGroup } from "../types/index.js";

/**
 * Evaluates a single condition against a citizen profile.
 */
function evaluateCondition(citizen, cond) {
  const fieldValue = citizen[cond.field];

  switch (cond.comparator) {
    case "exists":
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

    case "eq":
      return fieldValue === cond.value;

    case "neq":
      return fieldValue !== cond.value;

    case "lt":
      return typeof fieldValue === "number" && fieldValue < cond.value;

    case "lte":
      return typeof fieldValue === "number" && fieldValue <= cond.value;

    case "gt":
      return typeof fieldValue === "number" && fieldValue > cond.value;

    case "gte":
      return typeof fieldValue === "number" && fieldValue >= cond.value;

    case "in":
      return Array.isArray(cond.value)
        ? cond.value.includes(fieldValue)
        : false;

    default:
      return false;
  }
}

/**
 * Recursively evaluates rule tree
 */
function walkRules(citizen, node, collected) {
  if (isRuleGroup(node)) {
    const results = node.rules.map((child) =>
      walkRules(citizen, child, collected)
    );

    return node.operator === "AND"
      ? results.every(Boolean)
      : results.some(Boolean);
  }

  const passed = evaluateCondition(citizen, node);

  collected.push({
    field: String(node.field),
    passed,
    gapMessage: passed ? undefined : node.gapMessage,
  });

  return passed;
}

/**
 * Evaluate single scheme
 */
export function evaluateEligibility(citizen, scheme) {
  const conditionResults = [];

  const eligible = walkRules(citizen, scheme.eligibility, conditionResults);

  const matchedConditions = conditionResults.filter((c) => c.passed).length;
  const totalConditions = conditionResults.length;

  const gaps = conditionResults
    .filter((c) => !c.passed && c.gapMessage)
    .map((c) => c.gapMessage);

  return {
    schemeKey: scheme.id,
    schemeName: scheme.name,
    eligible,
    matchedConditions,
    totalConditions,
    conditionResults,
    gaps,
  };
}

/**
 * Evaluate all schemes
 */
export function evaluateAllSchemes(citizen, schemes) {
  return schemes
    .map((scheme) => evaluateEligibility(citizen, scheme))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;

      const ratioA = a.matchedConditions / (a.totalConditions || 1);
      const ratioB = b.matchedConditions / (b.totalConditions || 1);

      return ratioB - ratioA;
    });
}

/**
 * Claim readiness score
 */
export function computeClaimReadiness(
  eligibilityResult,
  scheme,
  verifiedDocumentIds
) {
  const conditionsScore =
    eligibilityResult.totalConditions === 0
      ? 0
      : (eligibilityResult.matchedConditions /
          eligibilityResult.totalConditions) *
        100;

  const totalDocs = scheme.requiredDocuments?.length || 0;

  const verifiedCount =
    scheme.requiredDocuments?.filter((doc) =>
      verifiedDocumentIds.includes(doc.id)
    ).length || 0;

  const documentsScore =
    totalDocs === 0 ? 100 : (verifiedCount / totalDocs) * 100;

  const missingDocuments =
    scheme.requiredDocuments
      ?.filter((doc) => !verifiedDocumentIds.includes(doc.id))
      .map((doc) => doc.name) || [];

  const score = Math.round(conditionsScore * 0.6 + documentsScore * 0.4);

  return {
    schemeKey: scheme.id,
    score,
    conditionsScore: Math.round(conditionsScore),
    documentsScore: Math.round(documentsScore),
    missingDocuments,
  };
}