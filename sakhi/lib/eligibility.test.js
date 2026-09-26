// lib/eligibility.test.js
// Run with: npx vitest run lib/eligibility.test.js

import { describe, it, expect } from "vitest";
import { evaluateEligibility, evaluateAllSchemes, computeClaimReadiness } from "./eligibility.js";
import { SCHEMES } from "../data/schemes.js";

describe("evaluateEligibility — Sunita persona (widow, UP, low income)", () => {
  const sunita = {
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
  };

  it("is eligible for the UP widow pension scheme", () => {
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const result = evaluateEligibility(sunita, widowScheme);

    expect(result.eligible).toBe(true);
    expect(result.gaps.length).toBe(0);
    expect(result.matchedConditions).toBe(result.totalConditions);
  });

  it("is eligible for PMAY-G (housing) due to BPL + landless + low income", () => {
    const pmay = SCHEMES.find((s) => s.id === "pmay-g");
    const result = evaluateEligibility(sunita, pmay);

    expect(result.eligible).toBe(true);
  });

  it("is eligible for PMJDY (bank account) since Aadhaar-linked and over 10", () => {
    const pmjdy = SCHEMES.find((s) => s.id === "pmjdy");
    const result = evaluateEligibility(sunita, pmjdy);

    expect(result.eligible).toBe(true);
  });

  it("is eligible for PMUY (LPG connection) as a woman 18+ from a BPL household", () => {
    const pmuy = SCHEMES.find((s) => s.id === "pmuy");
    const result = evaluateEligibility(sunita, pmuy);

    expect(result.eligible).toBe(true);
  });

  it("is eligible for AB-PMJAY via the BPL + low-income branch (not the 70+ branch)", () => {
    const abPmjay = SCHEMES.find((s) => s.id === "ab-pmjay");
    const result = evaluateEligibility(sunita, abPmjay);

    expect(result.eligible).toBe(true);
  });

  it("is NOT eligible for IGNOAPS (too young) or PM-KISAN (not a farmer)", () => {
    const ignoaps = SCHEMES.find((s) => s.id === "ignoaps");
    const pmKisan = SCHEMES.find((s) => s.id === "pm-kisan");

    expect(evaluateEligibility(sunita, ignoaps).eligible).toBe(false);
    expect(evaluateEligibility(sunita, pmKisan).eligible).toBe(false);
  });

  it("evaluateAllSchemes finds Sunita eligible for the expected schemes out of the full dataset", () => {
    const results = evaluateAllSchemes(sunita, SCHEMES);
    const eligibleIds = results.filter((r) => r.eligible).map((r) => r.schemeKey);

    // NOTE: this dataset has grown since this test was first written (was 8
    // schemes, is 30 as of this fix) — asserting an exact SCHEMES.length here
    // would make this test fail every time a scheme is added, for no useful
    // reason. What actually matters for this test is that Sunita's 5
    // "signature" schemes are still all correctly eligible; we don't assert
    // the full list is *exactly* these 5, since new schemes may legitimately
    // also match her profile (BPL + widow + low-income + UP resident) as the
    // dataset grows.
    expect(eligibleIds).toEqual(
      expect.arrayContaining(["ab-pmjay", "pmay-g", "pmjdy", "pmuy", "up-widow-pension"])
    );
  });
});

describe("AB-PMJAY — OR / nested-AND eligibility logic", () => {
  it("is eligible via the age-70+ branch even with high income and no BPL card", () => {
    const wealthySenior = {
      age: 72,
      incomeAnnual: 2000000,
      bplCard: false,
    };
    const abPmjay = SCHEMES.find((s) => s.id === "ab-pmjay");
    const result = evaluateEligibility(wealthySenior, abPmjay);

    expect(result.eligible).toBe(true);
  });

  it("is eligible via the BPL + low-income branch even when under 70", () => {
    const poorAdult = {
      age: 35,
      incomeAnnual: 150000,
      bplCard: true,
    };
    const abPmjay = SCHEMES.find((s) => s.id === "ab-pmjay");
    const result = evaluateEligibility(poorAdult, abPmjay);

    expect(result.eligible).toBe(true);
  });

  it("is NOT eligible when under 70, not BPL, and above the income threshold", () => {
    const ineligible = {
      age: 40,
      incomeAnnual: 800000,
      bplCard: false,
    };
    const abPmjay = SCHEMES.find((s) => s.id === "ab-pmjay");
    const result = evaluateEligibility(ineligible, abPmjay);

    expect(result.eligible).toBe(false);
  });
});

describe("IGNOAPS — old age pension", () => {
  it("is eligible for a 65-year-old BPL applicant", () => {
    const elder = { age: 65, bplCard: true };
    const ignoaps = SCHEMES.find((s) => s.id === "ignoaps");
    const result = evaluateEligibility(elder, ignoaps);

    expect(result.eligible).toBe(true);
  });

  it("is NOT eligible for a 65-year-old who is not BPL", () => {
    const elder = { age: 65, bplCard: false };
    const ignoaps = SCHEMES.find((s) => s.id === "ignoaps");
    const result = evaluateEligibility(elder, ignoaps);

    expect(result.eligible).toBe(false);
    expect(result.gaps).toContain(
      "Applicant must belong to a Below Poverty Line (BPL) household."
    );
  });
});

describe("IGNDPS — disability pension", () => {
  it("is eligible for a BPL adult with a certified disability", () => {
    const applicant = { age: 30, disability: true, bplCard: true };
    const igndps = SCHEMES.find((s) => s.id === "igndps");
    const result = evaluateEligibility(applicant, igndps);

    expect(result.eligible).toBe(true);
  });

  it("is NOT eligible without a certified disability", () => {
    const applicant = { age: 30, disability: false, bplCard: true };
    const igndps = SCHEMES.find((s) => s.id === "igndps");
    const result = evaluateEligibility(applicant, igndps);

    expect(result.eligible).toBe(false);
  });
});

describe("PM-KISAN — farmer income support", () => {
  it("is eligible for a landowning farmer with Aadhaar-linked account", () => {
    const farmer = {
      occupation: "farmer",
      landOwned: true,
      aadhaarLinked: true,
    };
    const pmKisan = SCHEMES.find((s) => s.id === "pm-kisan");
    const result = evaluateEligibility(farmer, pmKisan);

    expect(result.eligible).toBe(true);
  });

  it("is NOT eligible for a farmer without owned land", () => {
    const farmer = {
      occupation: "farmer",
      landOwned: false,
      aadhaarLinked: true,
    };
    const pmKisan = SCHEMES.find((s) => s.id === "pm-kisan");
    const result = evaluateEligibility(farmer, pmKisan);

    expect(result.eligible).toBe(false);
    expect(result.gaps).toContain(
      "Applicant's family must own cultivable agricultural land in official state land records."
    );
  });
});


describe("evaluateEligibility — gap detection (income too high)", () => {
  const richWidow = {
    name: "Kamla",
    age: 45,
    maritalStatus: "widow",
    state: "Uttar Pradesh",
    incomeAnnual: 500000, // exceeds threshold
  };

  it("is NOT eligible and returns a specific gap message", () => {
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const result = evaluateEligibility(richWidow, widowScheme);

    expect(result.eligible).toBe(false);
    expect(result.gaps).toContain("Annual family income must be below ₹2,00,000.");
  });
});

describe("evaluateEligibility — wrong state", () => {
  const widowOtherState = {
    maritalStatus: "widow",
    state: "Bihar",
    incomeAnnual: 50000,
  };

  it("fails the state condition with correct gap message", () => {
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const result = evaluateEligibility(widowOtherState, widowScheme);

    expect(result.eligible).toBe(false);
    expect(result.gaps).toContain(
      "This scheme is only for residents of Uttar Pradesh."
    );
  });
});

describe("evaluateEligibility — partial/missing data", () => {
  it("does not crash when fields are undefined, just fails those conditions", () => {
    const incompleteProfile = { name: "Unknown" };
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const result = evaluateEligibility(incompleteProfile, widowScheme);

    expect(result.eligible).toBe(false);
    expect(result.gaps.length).toBeGreaterThan(0);
  });
});

describe("computeClaimReadiness", () => {
  const sunita = {
    maritalStatus: "widow",
    state: "Uttar Pradesh",
    incomeAnnual: 80000,
    age: 31,
  };

  it("scores 100 when all conditions met and all docs verified", () => {
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const eligibility = evaluateEligibility(sunita, widowScheme);
    const allDocIds = widowScheme.requiredDocuments.map((d) => d.id);

    const readiness = computeClaimReadiness(eligibility, widowScheme, allDocIds);
    expect(readiness.score).toBe(100);
    expect(readiness.missingDocuments.length).toBe(0);
  });

  it("scores lower when documents are missing despite full eligibility", () => {
    const widowScheme = SCHEMES.find((s) => s.id === "up-widow-pension");
    const eligibility = evaluateEligibility(sunita, widowScheme);

    // Only 1 of 4 documents verified
    const readiness = computeClaimReadiness(eligibility, widowScheme, ["aadhaar"]);
    expect(readiness.score).toBeLessThan(100);
    expect(readiness.missingDocuments.length).toBe(3);
  });
});