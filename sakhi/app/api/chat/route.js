// // // app/api/chat/route.js
// // import { NextResponse } from "next/server";
// // import { runPlannerTurn } from "../../../agents/planner.js"; // V3 — multi-agent, tool-calling
// // import { runPlannerTurnV1 } from "../../../agents/plannerV1.js"; // single-shot, no tools/retrieval
// // import { runPlannerTurnV2 } from "../../../agents/plannerV2.js"; // single-shot + RAG, no tool loop

// // const PLANNERS = {
// //   v1: runPlannerTurnV1,
// //   v2: runPlannerTurnV2,
// //   v3: runPlannerTurn,
// // };

// // /**
// //  * @typedef {Object} ChatRequestBody
// //  * @property {string} sessionId
// //  * @property {string} message
// //  * @property {import('../../../agents/planner.js').ChatMessage[]} [history]
// //  * @property {"v1"|"v2"|"v3"} [mode] - which architecture to run. Defaults to "v3" (the
// //  *   production app's behavior) so existing callers/UI are unaffected. "v1"/"v2" exist for the
// //  *   BTP's comparative evaluation (see scripts/evaluate.js) and for manually poking at them via
// //  *   curl/Postman; the citizen-facing UI has no mode switcher and always gets "v3".
// //  */

// // /**
// //  * @param {Request} req
// //  */
// // export async function POST(req) {
// //   try {
// //     /** @type {ChatRequestBody} */
// //     const body = await req.json();
// //     const { sessionId, message, history = [], mode = "v3" } = body;

// //     if (!sessionId || !message) {
// //       return NextResponse.json(
// //         { error: "sessionId and message are required" },
// //         { status: 400 }
// //       );
// //     }

// //     const runTurn = PLANNERS[mode];
// //     if (!runTurn) {
// //       return NextResponse.json(
// //         { error: `Unknown mode "${mode}" — expected one of: ${Object.keys(PLANNERS).join(", ")}` },
// //         { status: 400 }
// //       );
// //     }

// //     const result = await runTurn(sessionId, history, message);

// //     return NextResponse.json({
// //       reply: result.finalText,
// //       history: result.messages,
// //       toolCalls: result.toolCallsExecuted, // useful for debugging in dev, hide in prod UI
// //     });
// //   } catch (err) {
// //     console.error("Planner error:", err);

// //     if (err?.status === 429) {
// //       return NextResponse.json(
// //         {
// //           error:
// //             "Gemini is rate-limited right now (free tier request limit hit). Please wait a bit and try again.",
// //         },
// //         { status: 429 }
// //       );
// //     }

// //     if (err?.status === 503) {
// //       return NextResponse.json(
// //         {
// //           error:
// //             "Gemini's servers are temporarily overloaded. Please try again in a few seconds.",
// //         },
// //         { status: 503 }
// //       );
// //     }

// //     return NextResponse.json(
// //       { error: "Something went wrong processing your request." },
// //       { status: 500 }
// //     );
// //   }
// // }
// // app/api/chat/route.js
// import { NextResponse } from "next/server";
// import { runPlannerTurn } from "../../../agents/planner.js";
// import { runPlannerTurnV1 } from "../../../agents/plannerV1.js";
// import { runPlannerTurnV2 } from "../../../agents/plannerV2.js";

// const PLANNERS = {
//   v1: runPlannerTurnV1,
//   v2: runPlannerTurnV2,
//   v3: runPlannerTurn,
// };

// /**
//  * @typedef {Object} ChatRequestBody
//  * @property {string} sessionId
//  * @property {string} message
//  * @property {import('../../../agents/planner.js').ChatMessage[]} [history]
//  * @property {"v1"|"v2"|"v3"} [mode]
//  * @property {"text"|"voice"} [inputMode]
//  */

// /**
//  * @param {Request} req
//  */
// export async function POST(req) {
//   try {
//     /** @type {ChatRequestBody} */
//     const body = await req.json();
//     const { sessionId, message, history = [], mode = "v3", inputMode = "text" } = body;

//     if (!sessionId || !message) {
//       return NextResponse.json(
//         { error: "sessionId and message are required" },
//         { status: 400 }
//       );
//     }

//     const runTurn = PLANNERS[mode];
//     if (!runTurn) {
//       return NextResponse.json(
//         { error: `Unknown mode "${mode}" — expected one of: ${Object.keys(PLANNERS).join(", ")}` },
//         { status: 400 }
//       );
//     }

//     const result = await runTurn(sessionId, history, message);

//     return NextResponse.json({
//       reply: result.finalText,
//       history: result.messages,
//       toolCalls: result.toolCallsExecuted,
//       inputMode, // Echoed back to caller
//     });
//   } catch (err) {
//     console.error("Planner error:", err);

//     if (err?.status === 429) {
//       return NextResponse.json(
//         {
//           error:
//             "Gemini is rate-limited right now (free tier request limit hit). Please wait a bit and try again.",
//         },
//         { status: 429 }
//       );
//     }

//     if (err?.status === 503) {
//       return NextResponse.json(
//         {
//           error:
//             "Gemini's servers are temporarily overloaded. Please try again in a few seconds.",
//         },
//         { status: 503 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Something went wrong processing your request." },
//       { status: 500 }
//     );
//   }
// }
// app/api/chat/route.js
import { NextResponse } from "next/server";
import { runPlannerTurn } from "../../../agents/planner.js";
import { runPlannerTurnV1 } from "../../../agents/plannerV1.js";
import { runPlannerTurnV2 } from "../../../agents/plannerV2.js";

const PLANNERS = {
  v1: runPlannerTurnV1,
  v2: runPlannerTurnV2,
  v3: runPlannerTurn,
};

/**
 * @typedef {Object} ChatRequestBody
 * @property {string} sessionId
 * @property {string} message
 * @property {import('../../../agents/planner.js').ChatMessage[]} [history]
 * @property {"v1"|"v2"|"v3"} [mode]
 * @property {"text"|"voice"} [inputMode]
 */

/**
 * @param {Request} req
 */
export async function POST(req) {
  try {
    /** @type {ChatRequestBody} */
    const body = await req.json();
    const { sessionId, message, history = [], mode = "v3", inputMode = "text" } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "sessionId and message are required" },
        { status: 400 }
      );
    }

    const runTurn = PLANNERS[mode];
    if (!runTurn) {
      return NextResponse.json(
        { error: `Unknown mode "${mode}" — expected one of: ${Object.keys(PLANNERS).join(", ")}` },
        { status: 400 }
      );
    }

    const result = await runTurn(sessionId, history, message);

    return NextResponse.json({
      reply: result.finalText,
      history: result.messages,
      toolCalls: result.toolCallsExecuted,
      inputMode,
    });
  } catch (err) {
    console.error("Planner error:", err);

    if (err?.status === 429) {
      return NextResponse.json(
        {
          error:
            "Gemini is rate-limited right now (free tier request limit hit). Please wait a bit and try again.",
        },
        { status: 429 }
      );
    }

    if (err?.status === 503) {
      return NextResponse.json(
        {
          error:
            "Gemini's servers are temporarily overloaded. Please try again in a few seconds.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong processing your request." },
      { status: 500 }
    );
  }
}