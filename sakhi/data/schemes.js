// // data/schemes.js

// export const SCHEMES = [
//   {
//     id: "up-widow-pension",
//     name: "Vidhwa Pension Yojana (Widow Pension)",
//     nameLocal: "विधवा पेंशन योजना",
//     state: "Uttar Pradesh",
//     category: "pension",
//     description:
//       "Monthly pension for widows from economically weaker sections in Uttar Pradesh.",
//     benefitAmount: "₹1,000 / month",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "maritalStatus",
//           comparator: "eq",
//           value: "widow",
//           gapMessage: "Applicant must be a widow.",
//         },
//         {
//           field: "state",
//           comparator: "eq",
//           value: "Uttar Pradesh",
//           gapMessage: "This scheme is only for residents of Uttar Pradesh.",
//         },
//         {
//           field: "incomeAnnual",
//           comparator: "lt",
//           value: 200000,
//           gapMessage: "Annual family income must be below ₹2,00,000.",
//         },
//         {
//           field: "age",
//           comparator: "gte",
//           value: 18,
//           gapMessage: "Applicant must be at least 18 years old.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "death-cert", name: "Husband's death certificate", description: "Official death certificate of spouse" },
//       { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For pension disbursal" },
//     ],
//     applicationUrl: "https://sspy-up.gov.in",
//   },
//   {
//     id: "pmay-g",
//     name: "Pradhan Mantri Awas Yojana - Gramin",
//     nameLocal: "प्रधानमंत्री आवास योजना - ग्रामीण",
//     state: "central",
//     category: "housing",
//     description: "Financial assistance for construction of pucca house for rural homeless / kutcha house families.",
//     benefitAmount: "₹1,20,000 (plain areas) / ₹1,30,000 (hilly areas)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "incomeAnnual",
//           comparator: "lt",
//           value: 300000,
//           gapMessage: "Annual household income must be below ₹3,00,000.",
//         },
//         {
//           field: "bplCard",
//           comparator: "eq",
//           value: true,
//           gapMessage: "Applicant should be from BPL / SECC-2011 deprived household list.",
//         },
//         {
//           field: "landOwned",
//           comparator: "neq",
//           value: true,
//           gapMessage: "Scheme prioritizes landless or kutcha-house households.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "secc-proof", name: "SECC 2011 proof", description: "Socio Economic Caste Census listing" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For fund disbursal" },
//       { id: "land-doc", name: "Land ownership / allotment document", description: "If land already allotted" },
//     ],
//     applicationUrl: "https://pmayg.nic.in",
//   },
//   {
//     id: "pmjdy",
//     name: "Pradhan Mantri Jan Dhan Yojana",
//     nameLocal: "प्रधानमंत्री जन धन योजना",
//     state: "central",
//     category: "financial-inclusion",
//     description: "Zero-balance bank account with insurance and overdraft access for unbanked citizens.",
//     benefitAmount: "₹2,00,000 accident insurance + ₹10,000 overdraft",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "age",
//           comparator: "gte",
//           value: 10,
//           gapMessage: "Applicant must be at least 10 years old.",
//         },
//         {
//           field: "aadhaarLinked",
//           comparator: "exists",
//           value: true,
//           gapMessage: "Aadhaar or valid ID proof required for account opening.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "Or any valid government ID" },
//       { id: "passport-photo", name: "Passport size photo", description: "Recent photograph" },
//     ],
//     applicationUrl: "https://pmjdy.gov.in",
//   },
//   {
//     id: "ignoaps",
//     name: "Indira Gandhi National Old Age Pension Scheme",
//     nameLocal: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
//     state: "central",
//     category: "pension",
//     description:
//       "Monthly pension for senior citizens (60+) from Below Poverty Line households, under the National Social Assistance Programme (NSAP). State governments usually add a top-up over the central amount.",
//     benefitAmount:
//       "₹200/month (age 60-79) or ₹500/month (age 80+) from the Centre, plus a state top-up that varies by state",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "age",
//           comparator: "gte",
//           value: 60,
//           gapMessage: "Applicant must be at least 60 years old.",
//         },
//         {
//           field: "bplCard",
//           comparator: "eq",
//           value: true,
//           gapMessage:
//             "Applicant must belong to a Below Poverty Line (BPL) household.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "age-proof", name: "Age proof", description: "Birth certificate, school leaving certificate, voter ID, or Aadhaar showing date of birth" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for Direct Benefit Transfer (DBT)" },
//       { id: "bank-passbook", name: "Bank or post office passbook", description: "For pension disbursal via DBT" },
//     ],
//     applicationUrl: "https://nsap.nic.in",
//   },
//   {
//     id: "igndps",
//     name: "Indira Gandhi National Disability Pension Scheme",
//     nameLocal: "इंदिरा गांधी राष्ट्रीय विकलांगता पेंशन योजना",
//     state: "central",
//     category: "pension",
//     description:
//       "Monthly pension under NSAP for adults with severe disability (80% or more) from Below Poverty Line households.",
//     benefitAmount: "₹300/month from the Centre, plus a state top-up that varies by state",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "disability",
//           comparator: "eq",
//           value: true,
//           gapMessage:
//             "Applicant must have a certified severe disability (80% or more).",
//         },
//         {
//           field: "age",
//           comparator: "gte",
//           value: 18,
//           gapMessage: "Applicant must be at least 18 years old.",
//         },
//         {
//           field: "bplCard",
//           comparator: "eq",
//           value: true,
//           gapMessage:
//             "Applicant must belong to a Below Poverty Line (BPL) household.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "disability-cert", name: "Disability certificate", description: "Issued by a government medical board, showing 80%+ disability" },
//       { id: "age-proof", name: "Age proof", description: "Birth certificate, voter ID, or Aadhaar showing date of birth" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for Direct Benefit Transfer (DBT)" },
//       { id: "bank-passbook", name: "Bank or post office passbook", description: "For pension disbursal via DBT" },
//     ],
//     applicationUrl: "https://nsap.nic.in",
//   },
//   {
//     id: "pm-kisan",
//     name: "PM-KISAN Samman Nidhi",
//     nameLocal: "पीएम-किसान सम्मान निधि",
//     state: "central",
//     category: "agriculture",
//     description:
//       "Income support for landholding farmer families, paid directly to Aadhaar-linked bank accounts in three instalments a year.",
//     benefitAmount: "₹6,000/year (three instalments of ₹2,000 each)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "occupation",
//           comparator: "eq",
//           value: "farmer",
//           gapMessage: "Applicant's occupation must be recorded as farming.",
//         },
//         {
//           field: "landOwned",
//           comparator: "eq",
//           value: true,
//           gapMessage:
//             "Applicant's family must own cultivable agricultural land in official state land records.",
//         },
//         {
//           field: "aadhaarLinked",
//           comparator: "exists",
//           value: true,
//           gapMessage:
//             "Aadhaar-linked bank account is required to receive instalments.",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "land-doc", name: "Land ownership records", description: "Khatauni / land record showing cultivable land in the applicant's name" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for eKYC and registration" },
//       { id: "bank-passbook", name: "Bank passbook", description: "Aadhaar-seeded account for Direct Benefit Transfer" },
//     ],
//     applicationUrl: "https://pmkisan.gov.in",
//   },
//   {
//     id: "pmuy",
//     name: "Pradhan Mantri Ujjwala Yojana",
//     nameLocal: "प्रधानमंत्री उज्ज्वला योजना",
//     state: "central",
//     category: "household",
//     description:
//       "Free LPG gas connection for adult women from poor households who don't already have one, to replace unsafe cooking fuels like wood and coal.",
//     benefitAmount:
//       "Free LPG connection + free first refill and stove; ongoing subsidy of ₹300/cylinder (up to 9 cylinders/year)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         {
//           field: "gender",
//           comparator: "eq",
//           value: "female",
//           gapMessage: "Applicant must be a woman.",
//         },
//         {
//           field: "age",
//           comparator: "gte",
//           value: 18,
//           gapMessage: "Applicant must be at least 18 years old.",
//         },
//         {
//           field: "bplCard",
//           comparator: "eq",
//           value: true,
//           gapMessage:
//             "Applicant's household must qualify as poor (BPL card, or another accepted deprivation category).",
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card, mandatory for e-KYC" },
//       { id: "ration-card", name: "Ration card / family composition document", description: "Proof of household members" },
//       { id: "bpl-declaration", name: "Deprivation / BPL self-declaration", description: "Standard-format declaration if not already on a BPL/SECC list" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For subsidy disbursal via DBT" },
//     ],
//     applicationUrl: "https://www.pmuy.gov.in",
//   },
//   {
//     id: "ab-pmjay",
//     name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
//     nameLocal: "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
//     state: "central",
//     category: "health",
//     description:
//       "Cashless health insurance cover for hospitalisation at empanelled hospitals. Available to SECC-listed poor/vulnerable families, and separately to every citizen aged 70+ regardless of income (Ayushman Vay Vandana).",
//     benefitAmount: "₹5,00,000 per family per year, cashless at empanelled hospitals",
//     eligibility: {
//       operator: "OR",
//       rules: [
//         {
//           field: "age",
//           comparator: "gte",
//           value: 70,
//           gapMessage:
//             "Citizens aged 70 and above qualify regardless of income under Ayushman Vay Vandana — this applicant's age doesn't meet that route.",
//         },
//         {
//           operator: "AND",
//           rules: [
//             {
//               field: "bplCard",
//               comparator: "eq",
//               value: true,
//               gapMessage:
//                 "Applicant must belong to an SECC-listed poor/vulnerable household (or hold a BPL card).",
//             },
//             {
//               field: "incomeAnnual",
//               comparator: "lt",
//               value: 500000,
//               gapMessage: "Annual family income must be below ₹5,00,000.",
//             },
//           ],
//         },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and e-KYC" },
//       { id: "ration-card", name: "Ration card", description: "Helpful for SECC eligibility lookup" },
//       { id: "family-id", name: "SECC / PMJAY family ID", description: "If already listed; otherwise checked via the beneficiary portal" },
//     ],
//     applicationUrl: "https://pmjay.gov.in",
//   },
//   // Paste these objects INSIDE the existing SCHEMES array in data/schemes.js,
// // right before the closing `];` — nothing else in the codebase needs to change.

//   {
//     id: "apy",
//     name: "Atal Pension Yojana",
//     nameLocal: "अटल पेंशन योजना",
//     state: "central",
//     category: "pension",
//     description:
//       "Government-backed guaranteed pension scheme for workers in the unorganised sector, providing a fixed monthly pension after age 60 based on contributions made.",
//     benefitAmount: "₹1,000 to ₹5,000 / month after age 60 (based on contribution)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "age", comparator: "lt", value: 41, gapMessage: "Applicant must be under 41 years old to join." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity and account linking" },
//       { id: "bank-passbook", name: "Bank passbook", description: "Savings account for auto-debit contributions" },
//       { id: "age-proof", name: "Age proof", description: "To confirm eligibility age (18–40)" },
//     ],
//     applicationUrl: "https://www.jansuraksha.gov.in",
//   },
//   {
//     id: "pmsby",
//     name: "Pradhan Mantri Suraksha Bima Yojana",
//     nameLocal: "प्रधानमंत्री सुरक्षा बीमा योजना",
//     state: "central",
//     category: "insurance",
//     description:
//       "Low-cost accidental death and disability insurance cover, renewable annually, for bank account holders.",
//     benefitAmount: "₹2,00,000 for accidental death / full disability; ₹1,00,000 for partial disability",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "age", comparator: "lt", value: 71, gapMessage: "Applicant must be under 71 years old." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "An active bank account linked to Aadhaar is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "Active savings account for premium auto-debit" },
//     ],
//     applicationUrl: "https://www.jansuraksha.gov.in",
//   },
//   {
//     id: "pmjjby",
//     name: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
//     nameLocal: "प्रधानमंत्री जीवन ज्योति बीमा योजना",
//     state: "central",
//     category: "insurance",
//     description:
//       "Renewable term life insurance scheme offering a lump sum to the nominee in case of the account holder's death, for a low annual premium.",
//     benefitAmount: "₹2,00,000 life cover on death of the insured",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "age", comparator: "lt", value: 51, gapMessage: "Applicant must be under 51 years old to newly enrol." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "An active bank account linked to Aadhaar is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "Active savings account for premium auto-debit" },
//     ],
//     applicationUrl: "https://www.jansuraksha.gov.in",
//   },
//   {
//     id: "pmfby",
//     name: "Pradhan Mantri Fasal Bima Yojana",
//     nameLocal: "प्रधानमंत्री फसल बीमा योजना",
//     state: "central",
//     category: "agriculture",
//     description:
//       "Crop insurance scheme protecting farmers against crop loss or damage from natural calamities, pests, or disease, at a heavily subsidised premium.",
//     benefitAmount: "Full sum insured on notified crop loss (premium as low as 1.5–5% of sum insured)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "occupation", comparator: "eq", value: "farmer", gapMessage: "Applicant's occupation must be recorded as farming." },
//         { field: "landOwned", comparator: "eq", value: true, gapMessage: "Applicant must own or have tenancy rights over cultivable land." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "land-doc", name: "Land ownership / tenancy records", description: "Khatauni or land record for the insured crop area" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For claim disbursal via Direct Benefit Transfer" },
//     ],
//     applicationUrl: "https://pmfby.gov.in",
//   },
//   {
//     id: "pmmvy",
//     name: "Pradhan Mantri Matru Vandana Yojana",
//     nameLocal: "प्रधानमंत्री मातृ वंदना योजना",
//     state: "central",
//     category: "health",
//     description:
//       "Maternity benefit cash incentive for pregnant and lactating women, to compensate for wage loss and encourage health-seeking behaviour around childbirth.",
//     benefitAmount: "₹5,000 in instalments for the first live birth (additional ₹6,000 for second child if a girl, under PMMVY 2.0)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "gender", comparator: "eq", value: "female", gapMessage: "Applicant must be a woman." },
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required for disbursal." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For benefit disbursal via Direct Benefit Transfer" },
//     ],
//     applicationUrl: "https://pmmvy.nic.in",
//   },
//   {
//     id: "jsy",
//     name: "Janani Suraksha Yojana",
//     nameLocal: "जननी सुरक्षा योजना",
//     state: "central",
//     category: "health",
//     description:
//       "Cash assistance for institutional delivery to reduce maternal and infant mortality among poor and low-income pregnant women.",
//     benefitAmount: "₹1,400 (rural) / ₹1,000 (urban) for institutional delivery, varies by state",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "gender", comparator: "eq", value: "female", gapMessage: "Applicant must be a woman." },
//         { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household should belong to a poor/BPL category (relaxed in low-performing states)." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For cash assistance disbursal" },
//     ],
//     applicationUrl: "https://nhm.gov.in",
//   },
//   {
//     id: "pmay-u",
//     name: "Pradhan Mantri Awas Yojana - Urban",
//     nameLocal: "प्रधानमंत्री आवास योजना - शहरी",
//     state: "central",
//     category: "housing",
//     description:
//       "Affordable housing scheme for urban poor and middle-income households, offering interest subsidy on home loans or direct financial assistance for construction.",
//     benefitAmount: "Up to ₹2,67,000 interest subsidy (credit-linked) or direct assistance depending on income category",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "incomeAnnual", comparator: "lt", value: 1800000, gapMessage: "Annual household income must be below ₹18,00,000 (varies by income category)." },
//         { field: "landOwned", comparator: "neq", value: true, gapMessage: "Applicant or family should not already own a pucca house anywhere in India." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM, to determine income category" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For subsidy/assistance disbursal" },
//     ],
//     applicationUrl: "https://pmay-urban.gov.in",
//   },
//   {
//     id: "nfbs",
//     name: "National Family Benefit Scheme",
//     nameLocal: "राष्ट्रीय परिवार लाभ योजना",
//     state: "central",
//     category: "welfare",
//     description:
//       "One-time lump sum assistance to a Below Poverty Line household on the death of the primary breadwinner (aged 18–59), under the National Social Assistance Programme.",
//     benefitAmount: "₹20,000 one-time lump sum",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household must belong to a Below Poverty Line (BPL) household." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "death-cert", name: "Death certificate", description: "Of the primary breadwinner, aged 18–59 at time of death" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Of the applicant/claimant" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For lump sum disbursal via Direct Benefit Transfer" },
//     ],
//     applicationUrl: "https://nsap.nic.in",
//   },
//   // Paste these objects INSIDE the existing SCHEMES array in data/schemes.js,
// // right before the closing `];` — adds 14 more schemes (16 -> 30 total).

//   {
//     id: "pm-sym",
//     name: "Pradhan Mantri Shram Yogi Maandhan",
//     nameLocal: "प्रधानमंत्री श्रम योगी मानधन",
//     state: "central",
//     category: "pension",
//     description:
//       "Voluntary contributory pension scheme for unorganised sector workers, guaranteeing ₹3,000/month pension after age 60, with matching government contribution.",
//     benefitAmount: "₹3,000/month pension after age 60",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "age", comparator: "lt", value: 41, gapMessage: "Applicant must be under 41 years old to join." },
//         { field: "incomeAnnual", comparator: "lt", value: 180000, gapMessage: "Monthly income should not exceed ₹15,000 (approx. ₹1,80,000/year)." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity and account linking" },
//       { id: "bank-passbook", name: "Bank passbook", description: "Savings account for auto-debit contributions" },
//       { id: "age-proof", name: "Age proof", description: "To confirm eligibility age (18–40)" },
//     ],
//     applicationUrl: "https://maandhan.in",
//   },
//   {
//     id: "pmvvy",
//     name: "Pradhan Mantri Vaya Vandana Yojana",
//     nameLocal: "प्रधानमंत्री वय वंदना योजना",
//     state: "central",
//     category: "pension",
//     description:
//       "Guaranteed pension scheme for senior citizens through a lump-sum investment with LIC, offering assured returns for 10 years.",
//     benefitAmount: "Guaranteed pension of 7.4% p.a., payable monthly/quarterly/annually",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 60, gapMessage: "Applicant must be at least 60 years old." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "age-proof", name: "Age proof", description: "Voter ID, Aadhaar, or PAN showing date of birth" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For pension disbursal" },
//     ],
//     applicationUrl: "https://licindia.in",
//   },
//   {
//     id: "rashtriya-vayoshri",
//     name: "Rashtriya Vayoshri Yojana",
//     nameLocal: "राष्ट्रीय वयोश्री योजना",
//     state: "central",
//     category: "welfare",
//     description:
//       "Provides free assistive devices (walking sticks, hearing aids, wheelchairs, spectacles, etc.) to senior citizens from BPL households.",
//     benefitAmount: "Free physical aids and assisted-living devices",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 60, gapMessage: "Applicant must be at least 60 years old." },
//         { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant must belong to a Below Poverty Line (BPL) household." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "age-proof", name: "Age proof", description: "Aadhaar or voter ID showing date of birth" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
//       { id: "medical-cert", name: "Medical assessment certificate", description: "Issued at the camp/assessment stage for device requirement" },
//     ],
//     applicationUrl: "https://rvy.nsap.nic.in",
//   },
//   {
//     id: "pm-svanidhi",
//     name: "PM SVANidhi",
//     nameLocal: "पीएम स्वनिधि",
//     state: "central",
//     category: "financial-inclusion",
//     description:
//       "Micro-credit facility for urban street vendors to resume livelihoods, offering small working-capital loans without collateral.",
//     benefitAmount: "₹10,000 (1st loan), ₹20,000 (2nd), ₹50,000 (3rd) — collateral-free",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "occupation", comparator: "eq", value: "street-vendor", gapMessage: "Applicant must be a certified/identified urban street vendor." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "vendor-cert", name: "Certificate of Vending / Vendor ID", description: "Issued by urban local body" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For loan disbursal" },
//     ],
//     applicationUrl: "https://pmsvanidhi.mohua.gov.in",
//   },
//   {
//     id: "stand-up-india",
//     name: "Stand Up India",
//     nameLocal: "स्टैंड अप इंडिया",
//     state: "central",
//     category: "financial-inclusion",
//     description:
//       "Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs setting up new greenfield enterprises.",
//     benefitAmount: "₹10,00,000 to ₹1,00,00,000 bank loan",
//     eligibility: {
//       operator: "OR",
//       rules: [
//         { field: "gender", comparator: "eq", value: "female", gapMessage: "Scheme is open to women entrepreneurs, or SC/ST applicants." },
//         { field: "socialCategory", comparator: "in", value: ["SC", "ST"], gapMessage: "Scheme is open to SC/ST entrepreneurs, or women applicants." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "business-plan", name: "Business project report", description: "Detailing the proposed greenfield enterprise" },
//       { id: "caste-cert", name: "Caste certificate", description: "Required if applying under SC/ST category" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For loan account and disbursal" },
//     ],
//     applicationUrl: "https://www.standupmitra.in",
//   },
//   {
//     id: "pm-mudra",
//     name: "Pradhan Mantri Mudra Yojana",
//     nameLocal: "प्रधानमंत्री मुद्रा योजना",
//     state: "central",
//     category: "financial-inclusion",
//     description:
//       "Collateral-free loans up to ₹20 lakh for non-corporate, non-farm micro and small enterprises, categorised as Shishu, Kishor, Tarun, and Tarun Plus.",
//     benefitAmount: "Up to ₹20,00,000 collateral-free loan",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "business-plan", name: "Business plan / project proposal", description: "For the micro/small enterprise" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For loan disbursal" },
//     ],
//     applicationUrl: "https://www.mudra.org.in",
//   },
//   {
//     id: "pmkvy",
//     name: "Pradhan Mantri Kaushal Vikas Yojana",
//     nameLocal: "प्रधानमंत्री कौशल विकास योजना",
//     state: "central",
//     category: "skill-development",
//     description:
//       "Free short-term skill training and certification for youth, with placement assistance, under the flagship skilling scheme of the Ministry of Skill Development.",
//     benefitAmount: "Free skill training + certification (and monetary reward on certification for some cohorts)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 15, gapMessage: "Applicant must be at least 15 years old." },
//         { field: "age", comparator: "lt", value: 45, gapMessage: "Applicant must generally be under 45 years old." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar is required for enrolment and certification." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and enrolment" },
//       { id: "education-cert", name: "Educational qualification certificate", description: "Highest qualification proof, if applicable" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For any monetary reward disbursal" },
//     ],
//     applicationUrl: "https://www.pmkvyofficial.org",
//   },
//   {
//     id: "ddu-gky",
//     name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana",
//     nameLocal: "दीन दयाल उपाध्याय ग्रामीण कौशल्य योजना",
//     state: "central",
//     category: "skill-development",
//     description:
//       "Placement-linked skill training programme for rural poor youth, part of the National Rural Livelihood Mission.",
//     benefitAmount: "Free residential skill training + guaranteed placement assistance",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 15, gapMessage: "Applicant must be at least 15 years old." },
//         { field: "age", comparator: "lt", value: 36, gapMessage: "Applicant must be under 36 years old." },
//         { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant must belong to a rural poor / BPL household." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and enrolment" },
//       { id: "bpl-card", name: "BPL / ration card", description: "Proof of rural poor household status" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For any allowance disbursal" },
//     ],
//     applicationUrl: "https://ddugky.gov.in",
//   },
//   {
//     id: "mgnrega",
//     name: "Mahatma Gandhi National Rural Employment Guarantee Act",
//     nameLocal: "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम",
//     state: "central",
//     category: "employment",
//     description:
//       "Legal guarantee of 100 days of wage employment per financial year to every rural household whose adult members volunteer for unskilled manual work.",
//     benefitAmount: "100 days/year guaranteed wage employment at notified minimum wage",
//     eligibility: 
//       operator: "AND",
//       rules: [
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "residenceType", comparator: "eq", value: "rural", gapMessage: "Applicant's household must be in a rural area." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "job-card-photo", name: "Passport size photo", description: "For issuance of Job Card" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and Job Card linking" },
//       { id: "residence-proof", name: "Residence proof", description: "To confirm rural household status" },
//     ],
//     applicationUrl: "https://nrega.nic.in",
//   },
//   {
//     id: "pm-vishwakarma",
//     name: "PM Vishwakarma Yojana",
//     nameLocal: "पीएम विश्वकर्मा योजना",
//     state: "central",
//     category: "financial-inclusion",
//     description:
//       "Support scheme for traditional artisans and craftspeople (18 trades), offering skill upgradation, toolkit incentive, and collateral-free credit.",
//     benefitAmount: "₹15,000 toolkit incentive + collateral-free loans up to ₹3,00,000",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "occupation", comparator: "eq", value: "artisan", gapMessage: "Applicant must be engaged in one of the recognised traditional trades/crafts." },
//         { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
//         { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and registration" },
//       { id: "trade-proof", name: "Proof of trade / craft", description: "Self-declaration or local body verification of traditional occupation" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For incentive and loan disbursal" },
//     ],
//     applicationUrl: "https://pmvishwakarma.gov.in",
//   },
//   {
//     id: "aay",
//     name: "Antyodaya Anna Yojana",
//     nameLocal: "अंत्योदय अन्न योजना",
//     state: "central",
//     category: "household",
//     description:
//       "Highly subsidised foodgrain scheme for the poorest of the poor households under the Public Distribution System.",
//     benefitAmount: "35 kg foodgrain/month at ₹2/kg (wheat) and ₹3/kg (rice)",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household must be identified as poorest-of-the-poor (AAY category) by the state." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "ration-card", name: "Ration card application / existing card", description: "For AAY category verification" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Of all household members" },
//       { id: "income-cert", name: "Income / poverty status document", description: "As required by state PDS authority" },
//     ],
//     applicationUrl: "https://nfsa.gov.in",
//   },
//   {
//     id: "nsp-post-matric-sc",
//     name: "Post Matric Scholarship for SC Students",
//     nameLocal: "अनुसूचित जाति के लिए पोस्ट मैट्रिक छात्रवृत्ति",
//     state: "central",
//     category: "education",
//     description:
//       "Financial assistance covering fees and maintenance allowance for SC students pursuing post-matriculation / post-secondary studies.",
//     benefitAmount: "Full course fee reimbursement + monthly maintenance allowance",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "socialCategory", comparator: "eq", value: "SC", gapMessage: "Applicant must belong to a Scheduled Caste (SC)." },
//         { field: "incomeAnnual", comparator: "lt", value: 250000, gapMessage: "Parental/family annual income must be below ₹2,50,000." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "caste-cert", name: "Caste certificate", description: "Proof of SC status" },
//       { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "admission-proof", name: "Admission / bonafide certificate", description: "From the institution currently enrolled in" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For scholarship disbursal" },
//     ],
//     applicationUrl: "https://scholarships.gov.in",
//   },
//   {
//     id: "nsp-pre-matric-st",
//     name: "Pre-Matric Scholarship for ST Students",
//     nameLocal: "अनुसूचित जनजाति के लिए प्री-मैट्रिक छात्रवृत्ति",
//     state: "central",
//     category: "education",
//     description:
//       "Scholarship support for ST students studying in classes 9 and 10, to reduce dropout at the secondary school stage.",
//     benefitAmount: "Annual scholarship for tuition, books, and maintenance allowance",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "socialCategory", comparator: "eq", value: "ST", gapMessage: "Applicant must belong to a Scheduled Tribe (ST)." },
//         { field: "incomeAnnual", comparator: "lt", value: 250000, gapMessage: "Parental/family annual income must be below ₹2,50,000." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "caste-cert", name: "Tribe certificate", description: "Proof of ST status" },
//       { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
//       { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
//       { id: "school-cert", name: "School enrolment certificate", description: "Confirming enrolment in class 9 or 10" },
//       { id: "bank-passbook", name: "Bank passbook", description: "For scholarship disbursal" },
//     ],
//     applicationUrl: "https://scholarships.gov.in",
//   },
//   {
//     id: "ssy",
//     name: "Sukanya Samriddhi Yojana",
//     nameLocal: "सुकन्या समृद्धि योजना",
//     state: "central",
//     category: "financial-inclusion",
//     description:
//       "Small savings scheme for the parents/guardians of a girl child, offering a high fixed interest rate to build a corpus for her education and marriage expenses.",
//     benefitAmount: "High government-fixed interest rate (compounded annually) on deposits until maturity",
//     eligibility: {
//       operator: "AND",
//       rules: [
//         { field: "gender", comparator: "eq", value: "female", gapMessage: "Account can only be opened for a girl child." },
//         { field: "age", comparator: "lt", value: 10, gapMessage: "The girl child must be under 10 years old at the time of account opening." },
//       ],
//     },
//     requiredDocuments: [
//       { id: "birth-cert", name: "Birth certificate", description: "Of the girl child" },
//       { id: "aadhaar", name: "Aadhaar card", description: "Of the girl child and guardian" },
//       { id: "guardian-id", name: "Guardian's ID proof", description: "Aadhaar, PAN, or other valid ID" },
//     ],
//     applicationUrl: "https://www.nsiindia.gov.in",
//   }
// ];

// data/schemes.js

export const SCHEMES = [
  {
    id: "up-widow-pension",
    name: "Vidhwa Pension Yojana (Widow Pension)",
    nameLocal: "विधवा पेंशन योजना",
    state: "Uttar Pradesh",
    category: "pension",
    description:
      "Monthly pension for widows from economically weaker sections in Uttar Pradesh.",
    benefitAmount: "₹1,000 / month",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "maritalStatus",
          comparator: "eq",
          value: "widow",
          gapMessage: "Applicant must be a widow.",
        },
        {
          field: "state",
          comparator: "eq",
          value: "Uttar Pradesh",
          gapMessage: "This scheme is only for residents of Uttar Pradesh.",
        },
        {
          field: "incomeAnnual",
          comparator: "lt",
          value: 200000,
          gapMessage: "Annual family income must be below ₹2,00,000.",
        },
        {
          field: "age",
          comparator: "gte",
          value: 18,
          gapMessage: "Applicant must be at least 18 years old.",
        },
      ],
    },
    requiredDocuments: [
      { id: "death-cert", name: "Husband's death certificate", description: "Official death certificate of spouse" },
      { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
      { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card" },
      { id: "bank-passbook", name: "Bank passbook", description: "For pension disbursal" },
    ],
    applicationUrl: "https://sspy-up.gov.in",
  },
  {
    id: "pmay-g",
    name: "Pradhan Mantri Awas Yojana - Gramin",
    nameLocal: "प्रधानमंत्री आवास योजना - ग्रामीण",
    state: "central",
    category: "housing",
    description: "Financial assistance for construction of pucca house for rural homeless / kutcha house families.",
    benefitAmount: "₹1,20,000 (plain areas) / ₹1,30,000 (hilly areas)",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "incomeAnnual",
          comparator: "lt",
          value: 300000,
          gapMessage: "Annual household income must be below ₹3,00,000.",
        },
        {
          field: "bplCard",
          comparator: "eq",
          value: true,
          gapMessage: "Applicant should be from BPL / SECC-2011 deprived household list.",
        },
        {
          field: "landOwned",
          comparator: "neq",
          value: true,
          gapMessage: "Scheme prioritizes landless or kutcha-house households.",
        },
      ],
    },
    requiredDocuments: [
      { id: "secc-proof", name: "SECC 2011 proof", description: "Socio Economic Caste Census listing" },
      { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card" },
      { id: "bank-passbook", name: "Bank passbook", description: "For fund disbursal" },
      { id: "land-doc", name: "Land ownership / allotment document", description: "If land already allotted" },
    ],
    applicationUrl: "https://pmayg.dord.gov.in",
  },
  {
    id: "pmjdy",
    name: "Pradhan Mantri Jan Dhan Yojana",
    nameLocal: "प्रधानमंत्री जन धन योजना",
    state: "central",
    category: "financial-inclusion",
    description: "Zero-balance bank account with insurance and overdraft access for unbanked citizens.",
    benefitAmount: "₹2,00,000 accident insurance + ₹10,000 overdraft",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "age",
          comparator: "gte",
          value: 10,
          gapMessage: "Applicant must be at least 10 years old.",
        },
        {
          field: "aadhaarLinked",
          comparator: "exists",
          value: true,
          gapMessage: "Aadhaar or valid ID proof required for account opening.",
        },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "Or any valid government ID" },
      { id: "passport-photo", name: "Passport size photo", description: "Recent photograph" },
    ],
    applicationUrl: "https://pmjdy.gov.in",
  },
  {
    id: "ignoaps",
    name: "Indira Gandhi National Old Age Pension Scheme",
    nameLocal: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
    state: "central",
    category: "pension",
    description:
      "Monthly pension for senior citizens (60+) from Below Poverty Line households, under the National Social Assistance Programme (NSAP). State governments usually add a top-up over the central amount.",
    benefitAmount:
      "₹200/month (age 60-79) or ₹500/month (age 80+) from the Centre, plus a state top-up that varies by state",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "age",
          comparator: "gte",
          value: 60,
          gapMessage: "Applicant must be at least 60 years old.",
        },
        {
          field: "bplCard",
          comparator: "eq",
          value: true,
          gapMessage:
            "Applicant must belong to a Below Poverty Line (BPL) household.",
        },
      ],
    },
    requiredDocuments: [
      { id: "age-proof", name: "Age proof", description: "Birth certificate, school leaving certificate, voter ID, or Aadhaar showing date of birth" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
      { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for Direct Benefit Transfer (DBT)" },
      { id: "bank-passbook", name: "Bank or post office passbook", description: "For pension disbursal via DBT" },
    ],
    applicationUrl: "https://nsap.nic.in",
  },
  {
    id: "igndps",
    name: "Indira Gandhi National Disability Pension Scheme",
    nameLocal: "इंदिरा गांधी राष्ट्रीय विकलांगता पेंशन योजना",
    state: "central",
    category: "pension",
    description:
      "Monthly pension under NSAP for adults with severe disability (80% or more) from Below Poverty Line households.",
    benefitAmount: "₹300/month from the Centre, plus a state top-up that varies by state",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "disability",
          comparator: "eq",
          value: true,
          gapMessage:
            "Applicant must have a certified severe disability (80% or more).",
        },
        {
          field: "age",
          comparator: "gte",
          value: 18,
          gapMessage: "Applicant must be at least 18 years old.",
        },
        {
          field: "bplCard",
          comparator: "eq",
          value: true,
          gapMessage:
            "Applicant must belong to a Below Poverty Line (BPL) household.",
        },
      ],
    },
    requiredDocuments: [
      { id: "disability-cert", name: "Disability certificate", description: "Issued by a government medical board, showing 80%+ disability" },
      { id: "age-proof", name: "Age proof", description: "Birth certificate, voter ID, or Aadhaar showing date of birth" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
      { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for Direct Benefit Transfer (DBT)" },
      { id: "bank-passbook", name: "Bank or post office passbook", description: "For pension disbursal via DBT" },
    ],
    applicationUrl: "https://nsap.nic.in",
  },
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    nameLocal: "पीएम-किसान सम्मान निधि",
    state: "central",
    category: "agriculture",
    description:
      "Income support for landholding farmer families, paid directly to Aadhaar-linked bank accounts in three instalments a year.",
    benefitAmount: "₹6,000/year (three instalments of ₹2,000 each)",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "occupation",
          comparator: "eq",
          value: "farmer",
          gapMessage: "Applicant's occupation must be recorded as farming.",
        },
        {
          field: "landOwned",
          comparator: "eq",
          value: true,
          gapMessage:
            "Applicant's family must own cultivable agricultural land in official state land records.",
        },
        {
          field: "aadhaarLinked",
          comparator: "exists",
          value: true,
          gapMessage:
            "Aadhaar-linked bank account is required to receive instalments.",
        },
      ],
    },
    requiredDocuments: [
      { id: "land-doc", name: "Land ownership records", description: "Khatauni / land record showing cultivable land in the applicant's name" },
      { id: "aadhaar", name: "Aadhaar card", description: "Mandatory for eKYC and registration" },
      { id: "bank-passbook", name: "Bank passbook", description: "Aadhaar-seeded account for Direct Benefit Transfer" },
    ],
    applicationUrl: "https://pmkisan.gov.in",
  },
  {
    id: "pmuy",
    name: "Pradhan Mantri Ujjwala Yojana",
    nameLocal: "प्रधानमंत्री उज्ज्वला योजना",
    state: "central",
    category: "household",
    description:
      "Free LPG gas connection for adult women from poor households who don't already have one, to replace unsafe cooking fuels like wood and coal.",
    benefitAmount:
      "Free LPG connection + free first refill and stove; ongoing subsidy of ₹300/cylinder (up to 9 cylinders/year)",
    eligibility: {
      operator: "AND",
      rules: [
        {
          field: "gender",
          comparator: "eq",
          value: "female",
          gapMessage: "Applicant must be a woman.",
        },
        {
          field: "age",
          comparator: "gte",
          value: 18,
          gapMessage: "Applicant must be at least 18 years old.",
        },
        {
          field: "bplCard",
          comparator: "eq",
          value: true,
          gapMessage:
            "Applicant's household must qualify as poor (BPL card, or another accepted deprivation category).",
        },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "Applicant's Aadhaar card, mandatory for e-KYC" },
      { id: "ration-card", name: "Ration card / family composition document", description: "Proof of household members" },
      { id: "bpl-declaration", name: "Deprivation / BPL self-declaration", description: "Standard-format declaration if not already on a BPL/SECC list" },
      { id: "bank-passbook", name: "Bank passbook", description: "For subsidy disbursal via DBT" },
    ],
    applicationUrl: "https://www.pmuy.gov.in",
  },
  {
    id: "ab-pmjay",
    name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
    nameLocal: "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
    state: "central",
    category: "health",
    description:
      "Cashless health insurance cover for hospitalisation at empanelled hospitals. Available to SECC-listed poor/vulnerable families, and separately to every citizen aged 70+ regardless of income (Ayushman Vay Vandana).",
    benefitAmount: "₹5,00,000 per family per year, cashless at empanelled hospitals",
    eligibility: {
      operator: "OR",
      rules: [
        {
          field: "age",
          comparator: "gte",
          value: 70,
          gapMessage:
            "Citizens aged 70 and above qualify regardless of income under Ayushman Vay Vandana — this applicant's age doesn't meet that route.",
        },
        {
          operator: "AND",
          rules: [
            {
              field: "bplCard",
              comparator: "eq",
              value: true,
              gapMessage:
                "Applicant must belong to an SECC-listed poor/vulnerable household (or hold a BPL card).",
            },
            {
              field: "incomeAnnual",
              comparator: "lt",
              value: 500000,
              gapMessage: "Annual family income must be below ₹5,00,000.",
            },
          ],
        },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and e-KYC" },
      { id: "ration-card", name: "Ration card", description: "Helpful for SECC eligibility lookup" },
      { id: "family-id", name: "SECC / PMJAY family ID", description: "If already listed; otherwise checked via the beneficiary portal" },
    ],
    applicationUrl: "https://pmjay.gov.in",
  },
  {
    id: "apy",
    name: "Atal Pension Yojana",
    nameLocal: "अटल पेंशन योजना",
    state: "central",
    category: "pension",
    description:
      "Government-backed guaranteed pension scheme for workers in the unorganised sector, providing a fixed monthly pension after age 60 based on contributions made.",
    benefitAmount: "₹1,000 to ₹5,000 / month after age 60 (based on contribution)",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "age", comparator: "lt", value: 41, gapMessage: "Applicant must be under 41 years old to join." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity and account linking" },
      { id: "bank-passbook", name: "Bank passbook", description: "Savings account for auto-debit contributions" },
      { id: "age-proof", name: "Age proof", description: "To confirm eligibility age (18–40)" },
    ],
    applicationUrl: "https://www.jansuraksha.gov.in",
  },
  {
    id: "pmsby",
    name: "Pradhan Mantri Suraksha Bima Yojana",
    nameLocal: "प्रधानमंत्री सुरक्षा बीमा योजना",
    state: "central",
    category: "insurance",
    description:
      "Low-cost accidental death and disability insurance cover, renewable annually, for bank account holders.",
    benefitAmount: "₹2,00,000 for accidental death / full disability; ₹1,00,000 for partial disability",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "age", comparator: "lt", value: 71, gapMessage: "Applicant must be under 71 years old." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "An active bank account linked to Aadhaar is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "Active savings account for premium auto-debit" },
    ],
    applicationUrl: "https://www.jansuraksha.gov.in",
  },
  {
    id: "pmjjby",
    name: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
    nameLocal: "प्रधानमंत्री जीवन ज्योति बीमा योजना",
    state: "central",
    category: "insurance",
    description:
      "Renewable term life insurance scheme offering a lump sum to the nominee in case of the account holder's death, for a low annual premium.",
    benefitAmount: "₹2,00,000 life cover on death of the insured",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "age", comparator: "lt", value: 51, gapMessage: "Applicant must be under 51 years old to newly enrol." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "An active bank account linked to Aadhaar is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "Active savings account for premium auto-debit" },
    ],
    applicationUrl: "https://www.jansuraksha.gov.in",
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana",
    nameLocal: "प्रधानमंत्री फसल बीमा योजना",
    state: "central",
    category: "agriculture",
    description:
      "Crop insurance scheme protecting farmers against crop loss or damage from natural calamities, pests, or disease, at a heavily subsidised premium.",
    benefitAmount: "Full sum insured on notified crop loss (premium as low as 1.5–5% of sum insured)",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "occupation", comparator: "eq", value: "farmer", gapMessage: "Applicant's occupation must be recorded as farming." },
        { field: "landOwned", comparator: "eq", value: true, gapMessage: "Applicant must own or have tenancy rights over cultivable land." },
      ],
    },
    requiredDocuments: [
      { id: "land-doc", name: "Land ownership / tenancy records", description: "Khatauni or land record for the insured crop area" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "For claim disbursal via Direct Benefit Transfer" },
    ],
    applicationUrl: "https://pmfby.gov.in",
  },
  {
    id: "pmmvy",
    name: "Pradhan Mantri Matru Vandana Yojana",
    nameLocal: "प्रधानमंत्री मातृ वंदना योजना",
    state: "central",
    category: "health",
    description:
      "Maternity benefit cash incentive for pregnant and lactating women, to compensate for wage loss and encourage health-seeking behaviour around childbirth.",
    benefitAmount: "₹5,000 in instalments for the first live birth (additional ₹6,000 for second child if a girl, under PMMVY 2.0)",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "gender", comparator: "eq", value: "female", gapMessage: "Applicant must be a woman." },
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required for disbursal." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "For benefit disbursal via Direct Benefit Transfer" },
    ],
    applicationUrl: "https://pmmvy.wcd.gov.in",
  },
  {
    id: "jsy",
    name: "Janani Suraksha Yojana",
    nameLocal: "जननी सुरक्षा योजना",
    state: "central",
    category: "health",
    description:
      "Cash assistance for institutional delivery to reduce maternal and infant mortality among poor and low-income pregnant women.",
    benefitAmount: "₹1,400 (rural) / ₹1,000 (urban) for institutional delivery, varies by state",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "gender", comparator: "eq", value: "female", gapMessage: "Applicant must be a woman." },
        { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household should belong to a poor/BPL category (relaxed in low-performing states)." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
      { id: "bank-passbook", name: "Bank passbook", description: "For cash assistance disbursal" },
    ],
    applicationUrl: "https://nhm.gov.in",
  },
  {
    id: "pmay-u",
    name: "Pradhan Mantri Awas Yojana - Urban",
    nameLocal: "प्रधानमंत्री आवास योजना - शहरी",
    state: "central",
    category: "housing",
    description:
      "Affordable housing scheme for urban poor and middle-income households, offering interest subsidy on home loans or direct financial assistance for construction.",
    benefitAmount: "Up to ₹2,67,000 interest subsidy (credit-linked) or direct assistance depending on income category",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "incomeAnnual", comparator: "lt", value: 1800000, gapMessage: "Annual household income must be below ₹18,00,000 (varies by income category)." },
        { field: "landOwned", comparator: "neq", value: true, gapMessage: "Applicant or family should not already own a pucca house anywhere in India." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM, to determine income category" },
      { id: "bank-passbook", name: "Bank passbook", description: "For subsidy/assistance disbursal" },
    ],
    applicationUrl: "https://pmay-urban.gov.in",
  },
  {
    id: "nfbs",
    name: "National Family Benefit Scheme",
    nameLocal: "राष्ट्रीय परिवार लाभ योजना",
    state: "central",
    category: "welfare",
    description:
      "One-time lump sum assistance to a Below Poverty Line household on the death of the primary breadwinner (aged 18–59), under the National Social Assistance Programme.",
    benefitAmount: "₹20,000 one-time lump sum",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household must belong to a Below Poverty Line (BPL) household." },
      ],
    },
    requiredDocuments: [
      { id: "death-cert", name: "Death certificate", description: "Of the primary breadwinner, aged 18–59 at time of death" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
      { id: "aadhaar", name: "Aadhaar card", description: "Of the applicant/claimant" },
      { id: "bank-passbook", name: "Bank passbook", description: "For lump sum disbursal via Direct Benefit Transfer" },
    ],
    applicationUrl: "https://nsap.nic.in",
  },
  {
    id: "pm-sym",
    name: "Pradhan Mantri Shram Yogi Maandhan",
    nameLocal: "प्रधानमंत्री श्रम योगी मानधन",
    state: "central",
    category: "pension",
    description:
      "Voluntary contributory pension scheme for unorganised sector workers, guaranteeing ₹3,000/month pension after age 60, with matching government contribution.",
    benefitAmount: "₹3,000/month pension after age 60",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "age", comparator: "lt", value: 41, gapMessage: "Applicant must be under 41 years old to join." },
        { field: "incomeAnnual", comparator: "lt", value: 180000, gapMessage: "Monthly income should not exceed ₹15,000 (approx. ₹1,80,000/year)." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity and account linking" },
      { id: "bank-passbook", name: "Bank passbook", description: "Savings account for auto-debit contributions" },
      { id: "age-proof", name: "Age proof", description: "To confirm eligibility age (18–40)" },
    ],
    applicationUrl: "https://maandhan.in",
  },
  {
    id: "pmvvy",
    name: "Pradhan Mantri Vaya Vandana Yojana",
    nameLocal: "प्रधानमंत्री वय वंदना योजना",
    state: "central",
    category: "pension",
    description:
      "Guaranteed pension scheme for senior citizens through a lump-sum investment with LIC, offering assured returns for 10 years. Note: closed for new subscriptions since 31 March 2023 — only existing policyholders can manage policies via LIC.",
    benefitAmount: "Guaranteed pension of 7.4% p.a., payable monthly/quarterly/annually",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 60, gapMessage: "Applicant must be at least 60 years old." },
      ],
    },
    requiredDocuments: [
      { id: "age-proof", name: "Age proof", description: "Voter ID, Aadhaar, or PAN showing date of birth" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "For pension disbursal" },
    ],
    applicationUrl: "https://licindia.in",
  },
  {
    id: "rashtriya-vayoshri",
    name: "Rashtriya Vayoshri Yojana",
    nameLocal: "राष्ट्रीय वयोश्री योजना",
    state: "central",
    category: "welfare",
    description:
      "Provides free assistive devices (walking sticks, hearing aids, wheelchairs, spectacles, etc.) to senior citizens from BPL households.",
    benefitAmount: "Free physical aids and assisted-living devices",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 60, gapMessage: "Applicant must be at least 60 years old." },
        { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant must belong to a Below Poverty Line (BPL) household." },
      ],
    },
    requiredDocuments: [
      { id: "age-proof", name: "Age proof", description: "Aadhaar or voter ID showing date of birth" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of Below Poverty Line household status" },
      { id: "medical-cert", name: "Medical assessment certificate", description: "Issued at the camp/assessment stage for device requirement" },
    ],
    applicationUrl: "https://scw.dosje.gov.in/rashtriya-vayoshri-yojana",
  },
  {
    id: "pm-svanidhi",
    name: "PM SVANidhi",
    nameLocal: "पीएम स्वनिधि",
    state: "central",
    category: "financial-inclusion",
    description:
      "Micro-credit facility for urban street vendors to resume livelihoods, offering small working-capital loans without collateral.",
    benefitAmount: "₹10,000 (1st loan), ₹20,000 (2nd), ₹50,000 (3rd) — collateral-free",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "occupation", comparator: "eq", value: "street-vendor", gapMessage: "Applicant must be a certified/identified urban street vendor." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
      ],
    },
    requiredDocuments: [
      { id: "vendor-cert", name: "Certificate of Vending / Vendor ID", description: "Issued by urban local body" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "bank-passbook", name: "Bank passbook", description: "For loan disbursal" },
    ],
    applicationUrl: "https://pmsvanidhi.mohua.gov.in",
  },
  {
    id: "stand-up-india",
    name: "Stand Up India",
    nameLocal: "स्टैंड अप इंडिया",
    state: "central",
    category: "financial-inclusion",
    description:
      "Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs setting up new greenfield enterprises.",
    benefitAmount: "₹10,00,000 to ₹1,00,00,000 bank loan",
    eligibility: {
      operator: "OR",
      rules: [
        { field: "gender", comparator: "eq", value: "female", gapMessage: "Scheme is open to women entrepreneurs, or SC/ST applicants." },
        { field: "socialCategory", comparator: "in", value: ["SC", "ST"], gapMessage: "Scheme is open to SC/ST entrepreneurs, or women applicants." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "business-plan", name: "Business project report", description: "Detailing the proposed greenfield enterprise" },
      { id: "caste-cert", name: "Caste certificate", description: "Required if applying under SC/ST category" },
      { id: "bank-passbook", name: "Bank passbook", description: "For loan account and disbursal" },
    ],
    applicationUrl: "https://www.standupmitra.in",
  },
  {
    id: "pm-mudra",
    name: "Pradhan Mantri Mudra Yojana",
    nameLocal: "प्रधानमंत्री मुद्रा योजना",
    state: "central",
    category: "financial-inclusion",
    description:
      "Collateral-free loans up to ₹20 lakh for non-corporate, non-farm micro and small enterprises, categorised as Shishu, Kishor, Tarun, and Tarun Plus.",
    benefitAmount: "Up to ₹20,00,000 collateral-free loan",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "business-plan", name: "Business plan / project proposal", description: "For the micro/small enterprise" },
      { id: "bank-passbook", name: "Bank passbook", description: "For loan disbursal" },
    ],
    applicationUrl: "https://www.mudra.org.in",
  },
  {
    id: "pmkvy",
    name: "Pradhan Mantri Kaushal Vikas Yojana",
    nameLocal: "प्रधानमंत्री कौशल विकास योजना",
    state: "central",
    category: "skill-development",
    description:
      "Free short-term skill training and certification for youth, with placement assistance, under the flagship skilling scheme of the Ministry of Skill Development.",
    benefitAmount: "Free skill training + certification (and monetary reward on certification for some cohorts)",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 15, gapMessage: "Applicant must be at least 15 years old." },
        { field: "age", comparator: "lt", value: 45, gapMessage: "Applicant must generally be under 45 years old." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar is required for enrolment and certification." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and enrolment" },
      { id: "education-cert", name: "Educational qualification certificate", description: "Highest qualification proof, if applicable" },
      { id: "bank-passbook", name: "Bank passbook", description: "For any monetary reward disbursal" },
    ],
    applicationUrl: "https://www.pmkvyofficial.org",
  },
  {
    id: "ddu-gky",
    name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana",
    nameLocal: "दीन दयाल उपाध्याय ग्रामीण कौशल्य योजना",
    state: "central",
    category: "skill-development",
    description:
      "Placement-linked skill training programme for rural poor youth, part of the National Rural Livelihood Mission.",
    benefitAmount: "Free residential skill training + guaranteed placement assistance",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 15, gapMessage: "Applicant must be at least 15 years old." },
        { field: "age", comparator: "lt", value: 36, gapMessage: "Applicant must be under 36 years old." },
        { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant must belong to a rural poor / BPL household." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and enrolment" },
      { id: "bpl-card", name: "BPL / ration card", description: "Proof of rural poor household status" },
      { id: "bank-passbook", name: "Bank passbook", description: "For any allowance disbursal" },
    ],
    applicationUrl: "https://ddugky.gov.in",
  },
  {
    id: "mgnrega",
    name: "Mahatma Gandhi National Rural Employment Guarantee Act",
    nameLocal: "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम",
    state: "central",
    category: "employment",
    description:
      "Legal guarantee of 100 days of wage employment per financial year to every rural household whose adult members volunteer for unskilled manual work.",
    benefitAmount: "100 days/year guaranteed wage employment at notified minimum wage",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "residenceType", comparator: "eq", value: "rural", gapMessage: "Applicant's household must be in a rural area." },
      ],
    },
    requiredDocuments: [
      { id: "job-card-photo", name: "Passport size photo", description: "For issuance of Job Card" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and Job Card linking" },
      { id: "residence-proof", name: "Residence proof", description: "To confirm rural household status" },
    ],
    applicationUrl: "https://nrega.nic.in",
  },
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma Yojana",
    nameLocal: "पीएम विश्वकर्मा योजना",
    state: "central",
    category: "financial-inclusion",
    description:
      "Support scheme for traditional artisans and craftspeople (18 trades), offering skill upgradation, toolkit incentive, and collateral-free credit.",
    benefitAmount: "₹15,000 toolkit incentive + collateral-free loans up to ₹3,00,000",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "occupation", comparator: "eq", value: "artisan", gapMessage: "Applicant must be engaged in one of the recognised traditional trades/crafts." },
        { field: "age", comparator: "gte", value: 18, gapMessage: "Applicant must be at least 18 years old." },
        { field: "aadhaarLinked", comparator: "exists", value: true, gapMessage: "Aadhaar-linked bank account is required." },
      ],
    },
    requiredDocuments: [
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification and registration" },
      { id: "trade-proof", name: "Proof of trade / craft", description: "Self-declaration or local body verification of traditional occupation" },
      { id: "bank-passbook", name: "Bank passbook", description: "For incentive and loan disbursal" },
    ],
    applicationUrl: "https://pmvishwakarma.gov.in",
  },
  {
    id: "aay",
    name: "Antyodaya Anna Yojana",
    nameLocal: "अंत्योदय अन्न योजना",
    state: "central",
    category: "household",
    description:
      "Highly subsidised foodgrain scheme for the poorest of the poor households under the Public Distribution System.",
    benefitAmount: "35 kg foodgrain/month at ₹2/kg (wheat) and ₹3/kg (rice)",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "bplCard", comparator: "eq", value: true, gapMessage: "Applicant's household must be identified as poorest-of-the-poor (AAY category) by the state." },
      ],
    },
    requiredDocuments: [
      { id: "ration-card", name: "Ration card application / existing card", description: "For AAY category verification" },
      { id: "aadhaar", name: "Aadhaar card", description: "Of all household members" },
      { id: "income-cert", name: "Income / poverty status document", description: "As required by state PDS authority" },
    ],
    applicationUrl: "https://nfsa.gov.in",
  },
  {
    id: "nsp-post-matric-sc",
    name: "Post Matric Scholarship for SC Students",
    nameLocal: "अनुसूचित जाति के लिए पोस्ट मैट्रिक छात्रवृत्ति",
    state: "central",
    category: "education",
    description:
      "Financial assistance covering fees and maintenance allowance for SC students pursuing post-matriculation / post-secondary studies.",
    benefitAmount: "Full course fee reimbursement + monthly maintenance allowance",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "socialCategory", comparator: "eq", value: "SC", gapMessage: "Applicant must belong to a Scheduled Caste (SC)." },
        { field: "incomeAnnual", comparator: "lt", value: 250000, gapMessage: "Parental/family annual income must be below ₹2,50,000." },
      ],
    },
    requiredDocuments: [
      { id: "caste-cert", name: "Caste certificate", description: "Proof of SC status" },
      { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "admission-proof", name: "Admission / bonafide certificate", description: "From the institution currently enrolled in" },
      { id: "bank-passbook", name: "Bank passbook", description: "For scholarship disbursal" },
    ],
    applicationUrl: "https://scholarships.gov.in",
  },
  {
    id: "nsp-pre-matric-st",
    name: "Pre-Matric Scholarship for ST Students",
    nameLocal: "अनुसूचित जनजाति के लिए प्री-मैट्रिक छात्रवृत्ति",
    state: "central",
    category: "education",
    description:
      "Scholarship support for ST students studying in classes 9 and 10, to reduce dropout at the secondary school stage.",
    benefitAmount: "Annual scholarship for tuition, books, and maintenance allowance",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "socialCategory", comparator: "eq", value: "ST", gapMessage: "Applicant must belong to a Scheduled Tribe (ST)." },
        { field: "incomeAnnual", comparator: "lt", value: 250000, gapMessage: "Parental/family annual income must be below ₹2,50,000." },
      ],
    },
    requiredDocuments: [
      { id: "caste-cert", name: "Tribe certificate", description: "Proof of ST status" },
      { id: "income-cert", name: "Income certificate", description: "Issued by Tehsildar / SDM" },
      { id: "aadhaar", name: "Aadhaar card", description: "For identity verification" },
      { id: "school-cert", name: "School enrolment certificate", description: "Confirming enrolment in class 9 or 10" },
      { id: "bank-passbook", name: "Bank passbook", description: "For scholarship disbursal" },
    ],
    applicationUrl: "https://scholarships.gov.in",
  },
  {
    id: "ssy",
    name: "Sukanya Samriddhi Yojana",
    nameLocal: "सुकन्या समृद्धि योजना",
    state: "central",
    category: "financial-inclusion",
    description:
      "Small savings scheme for the parents/guardians of a girl child, offering a high fixed interest rate to build a corpus for her education and marriage expenses.",
    benefitAmount: "High government-fixed interest rate (compounded annually) on deposits until maturity",
    eligibility: {
      operator: "AND",
      rules: [
        { field: "gender", comparator: "eq", value: "female", gapMessage: "Account can only be opened for a girl child." },
        { field: "age", comparator: "lt", value: 10, gapMessage: "The girl child must be under 10 years old at the time of account opening." },
      ],
    },
    requiredDocuments: [
      { id: "birth-cert", name: "Birth certificate", description: "Of the girl child" },
      { id: "aadhaar", name: "Aadhaar card", description: "Of the girl child and guardian" },
      { id: "guardian-id", name: "Guardian's ID proof", description: "Aadhaar, PAN, or other valid ID" },
    ],
    applicationUrl: "https://www.nsiindia.gov.in",
  }
];