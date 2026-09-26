// // agents/planner.js

// import { GoogleGenAI } from "@google/genai";
// import { TOOLS } from "./tools.js";
// import { PLANNER_SYSTEM_PROMPT } from "./system-prompt.js";
// import { executeTool } from "./tool-executor.js";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const PRIMARY_MODEL = "gemini-3.8-flash";
// const FALLBACK_MODEL = "gemini-3.5-flash-lite";

// const MAX_TOOL_LOOP_ITERATIONS = 6;
// const MAX_RETRIES = 4;
// const DEFAULT_RETRY_DELAY_MS = 4000;
// const MAX_RETRY_DELAY_MS = 15000;

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function getSuggestedDelayMs(error) {
//   const retryInfo = error?.errorDetails?.find(
//     (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
//   );

//   const raw = retryInfo?.retryDelay;
//   if (!raw) return DEFAULT_RETRY_DELAY_MS;

//   const seconds = parseFloat(raw);
//   if (!Number.isFinite(seconds)) return DEFAULT_RETRY_DELAY_MS;
//   return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
// }

// function isRetryable(error) {
//   return error?.status === 429 || error?.status === 503;
// }

// async function withRetry(fn) {
//   let lastError;

//   for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       lastError = error;

//       if (!isRetryable(error) || attempt === MAX_RETRIES) {
//         throw error;
//       }

//       const delay = getSuggestedDelayMs(error);
//       console.warn(
//         `[planner] Gemini ${error.status} — retrying in ${Math.round(
//           delay / 1000
//         )}s (attempt ${attempt + 1}/${MAX_RETRIES})`
//       );
//       await sleep(delay);
//     }
//   }

//   throw lastError;
// }

// const GEMINI_TOOLS = [
//   {
//     functionDeclarations: TOOLS.map((tool) => ({
//       name: tool.name,
//       description: tool.description,
//       parametersJsonSchema: tool.input_schema,
//     })),
//   },
// ];

// export async function runPlannerTurn(sessionId, history, userMessage) {
//   const contents = [];

//   // Filter history items and trim leading assistant messages
//   const trimmedHistory = [...history];
//   while (trimmedHistory.length && trimmedHistory[0].role === "assistant") {
//     trimmedHistory.shift();
//   }

//   for (const m of trimmedHistory) {
//     if (m.content && m.content.toString().trim() !== "") {
//       contents.push({
//         role: m.role === "assistant" ? "model" : "user",
//         parts: [{ text: m.content.toString() }],
//       });
//     }
//   }

//   // Append user message
//   const safeUserMsg =
//     userMessage && userMessage.toString().trim() !== ""
//       ? userMessage.toString()
//       : " ";

//   contents.push({
//     role: "user",
//     parts: [{ text: safeUserMsg }],
//   });

//   let currentModel = PRIMARY_MODEL;
//   let usingFallback = false;
//   const toolCallsExecuted = [];

//   async function generate(model, contentsPayload) {
//     return ai.models.generateContent({
//       model,
//       contents: contentsPayload,
//       config: {
//         systemInstruction: PLANNER_SYSTEM_PROMPT,
//         tools: GEMINI_TOOLS,
//       },
//     });
//   }

//   let response;

//   // First Attempt with Primary Model
//   try {
//     response = await withRetry(() => generate(currentModel, contents));
//   } catch (error) {
//     if (error?.status !== 503 && error?.status !== 429) throw error;

//     console.warn(
//       `[planner] ${PRIMARY_MODEL} returned ${error.status} — switching fallback to ${FALLBACK_MODEL}`
//     );
//     usingFallback = true;
//     currentModel = FALLBACK_MODEL;
//     response = await withRetry(() => generate(currentModel, contents));
//   }

//   // Tool Call Loop
//   for (let i = 0; i < MAX_TOOL_LOOP_ITERATIONS; i++) {
//     const calls = response.functionCalls ?? [];
//     if (!calls.length) break;

//     // Retain exact model content parts (including thought_signature) returned by Gemini
//     const modelParts = response.candidates?.[0]?.content?.parts ?? calls.map((c) => ({
//       functionCall: {
//         name: c.name,
//         args: c.args ?? {},
//       },
//     }));

//     contents.push({ role: "model", parts: modelParts });

//     // Execute tools and build user responses
//     const functionResponseParts = [];

//     for (const call of calls) {
//       const rawResult = await executeTool(sessionId, call.name, call.args ?? {});

//       const sanitizedResult =
//         rawResult !== undefined && rawResult !== null
//           ? rawResult
//           : { status: "completed" };

//       toolCallsExecuted.push({
//         name: call.name,
//         input: call.args,
//         result: sanitizedResult,
//       });

//       functionResponseParts.push({
//         functionResponse: {
//           name: call.name,
//           response:
//             typeof sanitizedResult === "object"
//               ? sanitizedResult
//               : { result: sanitizedResult },
//         },
//       });
//     }

//     // Append tool execution results as user turn
//     contents.push({
//       role: "user",
//       parts: functionResponseParts,
//     });

//     // Request next response with updated contents payload
//     response = await withRetry(() => generate(currentModel, contents));
//   }

//   const finalText = response.text || "";

//   const messages = [
//     ...history,
//     { role: "user", content: userMessage },
//     { role: "assistant", content: finalText },
//   ];

//   return {
//     messages,
//     finalText,
//     toolCallsExecuted,
//     usedFallbackModel: usingFallback,
//   };
// }
// agents/planner.js

import { GoogleGenAI } from "@google/genai";
import { TOOLS } from "./tools.js";
import { PLANNER_SYSTEM_PROMPT } from "./system-prompt.js";
import { executeTool } from "./tool-executor.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const MAX_TOOL_LOOP_ITERATIONS = 6;
const MAX_RETRIES = 4;
const DEFAULT_RETRY_DELAY_MS = 4000;
const MAX_RETRY_DELAY_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSuggestedDelayMs(error) {
  const retryInfo = error?.errorDetails?.find(
    (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
  );

  const raw = retryInfo?.retryDelay;
  if (!raw) return DEFAULT_RETRY_DELAY_MS;

  const seconds = parseFloat(raw);
  if (!Number.isFinite(seconds)) return DEFAULT_RETRY_DELAY_MS;
  return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
}

function isRetryable(error) {
  return error?.status === 429 || error?.status === 503;
}

async function withRetry(fn) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delay = getSuggestedDelayMs(error);
      console.warn(
        `[planner] Gemini ${error.status} — retrying in ${Math.round(
          delay / 1000
        )}s (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.input_schema,
    })),
  },
];

export async function runPlannerTurn(sessionId, history, userMessage) {
  const contents = [];

  // Filter history items and trim leading assistant messages
  const trimmedHistory = [...history];
  while (trimmedHistory.length && trimmedHistory[0].role === "assistant") {
    trimmedHistory.shift();
  }

  for (const m of trimmedHistory) {
    if (m.content && m.content.toString().trim() !== "") {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.toString() }],
      });
    }
  }

  // Append user message
  const safeUserMsg =
    userMessage && userMessage.toString().trim() !== ""
      ? userMessage.toString()
      : " ";

  contents.push({
    role: "user",
    parts: [{ text: safeUserMsg }],
  });

  let currentModel = PRIMARY_MODEL;
  let usingFallback = false;
  const toolCallsExecuted = [];

  async function generate(model, contentsPayload) {
    return ai.models.generateContent({
      model,
      contents: contentsPayload,
      config: {
        systemInstruction: PLANNER_SYSTEM_PROMPT,
        tools: GEMINI_TOOLS,
      },
    });
  }

  let response;

  // First Attempt with Primary Model
  try {
    response = await withRetry(() => generate(currentModel, contents));
  } catch (error) {
    if (error?.status !== 503 && error?.status !== 429) throw error;

    console.warn(
      `[planner] ${PRIMARY_MODEL} returned ${error.status} — switching fallback to ${FALLBACK_MODEL}`
    );
    usingFallback = true;
    currentModel = FALLBACK_MODEL;
    response = await withRetry(() => generate(currentModel, contents));
  }

  // Tool Call Loop
  for (let i = 0; i < MAX_TOOL_LOOP_ITERATIONS; i++) {
    const calls = response.functionCalls ?? [];
    if (!calls.length) break;

    // Retain exact model content parts (including thought_signature) returned by Gemini
    const modelParts = response.candidates?.[0]?.content?.parts ?? calls.map((c) => ({
      functionCall: {
        name: c.name,
        args: c.args ?? {},
      },
    }));

    contents.push({ role: "model", parts: modelParts });

    // Execute tools and build user responses
    const functionResponseParts = [];

    for (const call of calls) {
      const rawResult = await executeTool(sessionId, call.name, call.args ?? {});

      const sanitizedResult =
        rawResult !== undefined && rawResult !== null
          ? rawResult
          : { status: "completed" };

      toolCallsExecuted.push({
        name: call.name,
        input: call.args,
        result: sanitizedResult,
      });

      functionResponseParts.push({
        functionResponse: {
          name: call.name,
          response:
            typeof sanitizedResult === "object"
              ? sanitizedResult
              : { result: sanitizedResult },
        },
      });
    }

    // Append tool execution results as user turn
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });

    // Request next response with updated contents payload
    response = await withRetry(() => generate(currentModel, contents));
  }

  const finalText = response.text || "";

  const messages = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: finalText },
  ];

  return {
    messages,
    finalText,
    toolCallsExecuted,
    usedFallbackModel: usingFallback,
  };
}