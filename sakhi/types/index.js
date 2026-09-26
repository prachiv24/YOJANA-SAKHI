// types/index.js

/**
 * @typedef {Object} CitizenProfile
 * @property {string} [id]
 * @property {string} [name]
 * @property {number} [age]
 * @property {"male"|"female"|"other"} [gender]
 * @property {"married"|"widow"|"widower"|"divorced"|"single"} [maritalStatus]
 * @property {string} [state]
 * @property {string} [district]
 * @property {number} [incomeAnnual]
 * @property {"general"|"obc"|"sc"|"st"} [casteCategory]
 * @property {boolean} [bplCard]
 * @property {boolean} [aadhaarLinked]
 * @property {number} [dependents]
 * @property {string} [occupation]
 * @property {boolean} [disability]
 * @property {boolean} [landOwned] - for farmer schemes
 * @property {string} [rawNotes] - free text the citizen said, kept for traceability
 */

// ---- Eligibility rule schema ----
// A rule tree is either a single condition or a logical group of conditions.

/**
 * @typedef {"eq"|"neq"|"lt"|"lte"|"gt"|"gte"|"in"|"exists"} Comparator
 */

/**
 * @typedef {Object} Condition
 * @property {keyof CitizenProfile} field
 * @property {Comparator} comparator
 * @property {string|number|boolean|(string|number)[]} value
 * @property {string} gapMessage - human-readable explanation shown when this condition fails
 */

/**
 * @typedef {Object} RuleGroup
 * @property {"AND"|"OR"} operator
 * @property {(Condition|RuleGroup)[]} rules
 */

/**
 * @param {Condition|RuleGroup} node
 * @returns {node is RuleGroup}
 */
export function isRuleGroup(node) {
  return node.operator !== undefined;
}

/**
 * @typedef {Object} RequiredDocument
 * @property {string} id
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} Scheme
 * @property {string} id
 * @property {string} name
 * @property {string} [nameLocal] - e.g. Hindi name
 * @property {string} state - "central" or state name
 * @property {string} category - pension | housing | education | health | agriculture etc.
 * @property {string} description
 * @property {RuleGroup} eligibility
 * @property {RequiredDocument[]} requiredDocuments
 * @property {string} [benefitAmount]
 * @property {string} [applicationUrl]
 */

// ---- Eligibility engine output ----

/**
 * @typedef {Object} EvaluatedCondition
 * @property {string} field
 * @property {boolean} passed
 * @property {string} [gapMessage]
 */

/**
 * @typedef {Object} EligibilityResult
 * @property {string} schemeId
 * @property {string} schemeName
 * @property {boolean} eligible
 * @property {number} matchedConditions
 * @property {number} totalConditions
 * @property {EvaluatedCondition[]} conditionResults
 * @property {string[]} gaps - human-readable list of unmet conditions
 */

/**
 * @typedef {Object} ClaimReadiness
 * @property {string} schemeId
 * @property {number} score - 0-100
 * @property {number} conditionsScore
 * @property {number} documentsScore
 * @property {string[]} missingDocuments
 */

export {};
