// eval/personas.js
//
// A small, fixed set of citizen personas for the BTP's comparative
// evaluation (scripts/evaluate.js). Deliberately covers different states,
// ages, occupations, and scheme categories so the eligible/ineligible split
// computed against data/schemes.js isn't dominated by one scheme type.
//
// IMPORTANT for your BTP write-up: 4 personas is enough to prove the
// evaluation methodology works end-to-end, but it is NOT a statistically
// rigorous sample size. For a defensible accuracy/reliability claim in your
// report, expand this file to at least 15-20 personas (vary state, income
// band, social category, disability status, occupation) before treating the
// output numbers as a real result rather than a pilot run.

export const PERSONAS = [
  {
    id: "sunita",
    label: "Sunita — widow, Uttar Pradesh, low income",
    profile: {
      name: "Sunita",
      age: 31,
      gender: "female",
      maritalStatus: "widow",
      state: "Uttar Pradesh",
      incomeAnnual: 80000,
      bplCard: true,
      aadhaarLinked: true,
      dependents: 2,
      landOwned: false,
      occupation: "unemployed",
      socialCategory: "OBC",
      disability: false,
      residenceType: "rural",
    },
  },
  {
    id: "ramesh",
    label: "Ramesh — senior farmer, Maharashtra",
    profile: {
      name: "Ramesh",
      age: 66,
      gender: "male",
      maritalStatus: "married",
      state: "Maharashtra",
      incomeAnnual: 150000,
      bplCard: false,
      aadhaarLinked: true,
      dependents: 1,
      landOwned: true,
      occupation: "farmer",
      socialCategory: "general",
      disability: false,
      residenceType: "rural",
    },
  },
  {
    id: "fatima",
    label: "Fatima — young, unemployed, Bihar, SC category",
    profile: {
      name: "Fatima",
      age: 22,
      gender: "female",
      maritalStatus: "unmarried",
      state: "Bihar",
      incomeAnnual: 60000,
      bplCard: true,
      aadhaarLinked: true,
      dependents: 0,
      landOwned: false,
      occupation: "unemployed",
      socialCategory: "SC",
      disability: false,
      residenceType: "rural",
    },
  },
  {
    id: "arjun",
    label: "Arjun — disabled, urban, Odisha",
    profile: {
      name: "Arjun",
      age: 45,
      gender: "male",
      maritalStatus: "married",
      state: "Odisha",
      incomeAnnual: 100000,
      bplCard: true,
      aadhaarLinked: true,
      dependents: 3,
      landOwned: false,
      occupation: "artisan",
      socialCategory: "general",
      disability: true,
      residenceType: "urban",
    },
  },
];

/**
 * Renders a persona's profile fields as a single self-contained natural
 * language sentence. Used as-is for V1/V2 (which have no structured
 * profile storage) and also given to V3 (so all three architectures get
 * the exact same stimulus — a fair, controlled comparison of "given
 * identical information, which one answers correctly" rather than
 * conflating that with "which one is better at extracting facts from
 * prose").
 */
export function personaToSentence(profile) {
  const bits = [
    `I am ${profile.age} years old`,
    profile.gender,
    profile.maritalStatus,
    `living in ${profile.state}`,
    `My annual family income is ₹${profile.incomeAnnual}`,
    profile.bplCard ? "I have a BPL card" : "I do not have a BPL card",
    profile.aadhaarLinked ? "my Aadhaar is linked to my bank account" : "my Aadhaar is not linked to a bank account",
    `I have ${profile.dependents} dependents`,
    profile.landOwned ? "I own agricultural land" : "I do not own any land",
    `my occupation is ${profile.occupation}`,
    `my social category is ${profile.socialCategory}`,
    profile.disability ? "I have a disability" : "I do not have a disability",
    `I live in a ${profile.residenceType} area`,
  ];

  return bits.join(", ") + ".";
}
