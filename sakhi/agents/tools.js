// agents/tools.js
// Tool definitions Claude can call. Each tool maps to a pure backend function.

export const TOOLS = [
  {
    name: "save_citizen_profile",
    description:
      "Save or update fields on the citizen's profile based on what they've told you so far. Call this whenever you learn a new fact (age, marital status, state, income, dependents, etc). You can call it multiple times as the conversation progresses — it merges with existing data.",
    input_schema: {
      type: "object",
      properties: {
        age: { type: "number" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        maritalStatus: {
          type: "string",
          enum: ["married", "widow", "widower", "divorced", "single"],
        },
        state: { type: "string" },
        district: { type: "string" },
        incomeAnnual: { type: "number" },
        casteCategory: { type: "string", enum: ["general", "obc", "sc", "st"] },
        bplCard: { type: "boolean" },
        aadhaarLinked: { type: "boolean" },
        dependents: { type: "number" },
        occupation: { type: "string" },
        disability: { type: "boolean" },
        landOwned: { type: "boolean" },
      },
    },
  },

  {
    name: "check_eligibility",
    description:
      "Run the citizen's current saved profile against all welfare schemes and return which ones they qualify for, partially qualify for, or are missing requirements for. Call this once you have enough profile fields.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  {
    name: "get_document_checklist",
    description:
      "Get required documents for a scheme and identify missing ones for this citizen.",
    input_schema: {
      type: "object",
      properties: {
        schemeId: {
          type: "string",
          description:
            "The exact scheme 'id' value from a prior check_eligibility result (e.g. 'up-widow-pension'), not the scheme's display name.",
        },
      },
      required: ["schemeId"],
    },
  },

  {
    name: "get_claim_readiness",
    description:
      "Calculate claim readiness score (0-100) for a scheme.",
    input_schema: {
      type: "object",
      properties: {
        schemeId: {
          type: "string",
          description:
            "The exact scheme 'id' value from a prior check_eligibility result (e.g. 'up-widow-pension'), not the scheme's display name.",
        },
      },
      required: ["schemeId"],
    },
  },

  {
    name: "search_schemes",
    description:
      "Semantic search over the full scheme corpus (much larger than the ~30 schemes check_eligibility knows structured rules for). Use this for general, free-text questions about scheme details, coverage, or 'is there a scheme for X' — NOT for eligibility decisions. This is retrieval, not a verdict: never tell a citizen they qualify based on a search_schemes result alone, always call check_eligibility for that.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The citizen's question or topic, in plain English (e.g. 'scholarships for disabled students in Bihar').",
        },
        state: {
          type: "string",
          description: "Optional. Restrict results to a specific state (plus central schemes). Omit to search all states.",
        },
      },
      required: ["query"],
    },
  },
];

// Note: Supabase persistence happens automatically and transparently
// inside save_citizen_profile / check_eligibility (see agents/tool-executor.js
// and lib/supabase.js) — the planner model never needs to call Supabase
// directly, so no supabase_* tools are exposed here.