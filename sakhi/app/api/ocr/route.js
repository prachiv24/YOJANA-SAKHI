// // // // app/api/ocr/route.js
// // // // Uses Gemini Vision to extract structured data from Indian government documents.

// // // import { NextResponse } from "next/server";
// // // import { GoogleGenAI } from "@google/genai";
// // // import { createClient } from "@supabase/supabase-js";

// // // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// // // const supabase = createClient(
// // //   process.env.NEXT_PUBLIC_SUPABASE_URL,
// // //   process.env.SUPABASE_SERVICE_ROLE_KEY,
// // //   { auth: { persistSession: false } }
// // // );

// // // const DOC_PROMPTS = {
// // //   "aadhaar": `This should be an Aadhaar card issued by UIDAI, Government of India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Aadhaar Card",
// // //   "name": "full name on card",
// // //   "dob": "date of birth if visible",
// // //   "uid": "12-digit number, mask last 4 as XXXX",
// // //   "gender": "Male/Female if visible",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "death-cert": `This should be a Death Certificate issued by a government authority in India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Death Certificate",
// // //   "deceasedName": "name of deceased",
// // //   "dateOfDeath": "date if visible",
// // //   "issuingAuthority": "who issued it",
// // //   "registrationNumber": "certificate number if visible",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "income-cert": `This should be an Income Certificate issued by Tehsildar or SDM in India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Income Certificate",
// // //   "holderName": "name of holder",
// // //   "annualIncome": "income amount if visible",
// // //   "issuingAuthority": "Tehsildar/SDM/other",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "bank-passbook": `This should be a Bank Passbook or bank account document from an Indian bank.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Bank Passbook",
// // //   "accountHolderName": "name on account",
// // //   "bankName": "name of bank",
// // //   "accountNumber": "mask all but last 4 digits",
// // //   "ifscCode": "IFSC if visible",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "secc-proof": `This should be a SECC 2011, BPL card, or ration card from India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "BPL/SECC Document",
// // //   "holderName": "name of holder",
// // //   "cardNumber": "card number if visible",
// // //   "category": "BPL/AAY/other",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "land-doc": `This should be a land document — Khasra, Khatauni, Jamabandi or registry from India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Land Document",
// // //   "ownerName": "owner name",
// // //   "landArea": "area if visible",
// // //   "surveyNumber": "Khasra/survey number if visible",
// // //   "district": "district if visible",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "passport-photo": `This should be a passport size photograph of a person.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Passport Photo",
// // //   "hasHumanFace": true/false,
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "age-proof": `This should be an age proof document — birth certificate, school leaving certificate, voter ID, or Aadhaar card showing date of birth, issued in India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Age Proof",
// // //   "holderName": "name on document",
// // //   "dob": "date of birth if visible",
// // //   "issuingAuthority": "who issued it",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "bpl-card": `This should be a BPL (Below Poverty Line) card or ration card from India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "BPL / Ration Card",
// // //   "holderName": "name of holder",
// // //   "cardNumber": "card number if visible",
// // //   "category": "BPL/AAY/APL/other",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,

// // //   "disability-cert": `This should be a disability certificate issued by a government medical board in India.
// // // Extract and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "Disability Certificate",
// // //   "holderName": "name of holder",
// // //   "disabilityPercentage": "percentage if visible",
// // //   "issuingAuthority": "medical board / hospital name",
// // //   "verified": true/false,
// // //   "reason": "why verified or not"
// // // }`,
// // // };

// // // const DEFAULT_PROMPT = `Analyze this document and return JSON only:
// // // {
// // //   "isCorrectDocument": true/false,
// // //   "documentType": "type detected",
// // //   "extractedText": "key text on document",
// // //   "verified": true/false,
// // //   "reason": "explanation"
// // // }`;

// // // function formatExtractedFields(parsed) {
// // //   const skip = ["isCorrectDocument", "documentType", "verified", "reason"];
// // //   const lines = [];
// // //   for (const [key, value] of Object.entries(parsed)) {
// // //     if (skip.includes(key) || !value) continue;
// // //     const label = key
// // //       .replace(/([A-Z])/g, " $1")
// // //       .replace(/^./, (s) => s.toUpperCase())
// // //       .trim();
// // //     lines.push(`${label}: ${value}`);
// // //   }
// // //   return lines.join("\n");
// // // }

// // // export async function POST(req) {
// // //   try {
// // //     const formData   = await req.formData();
// // //     const file       = formData.get("file");
// // //     const sessionId  = formData.get("sessionId");
// // //     const schemeId   = formData.get("schemeId");
// // //     const documentId = formData.get("documentId");
// // //     const docName    = formData.get("docName") || documentId;

// // //     if (!file || !sessionId || !schemeId || !documentId) {
// // //       return NextResponse.json(
// // //         { error: "file, sessionId, schemeId, documentId are required" },
// // //         { status: 400 }
// // //       );
// // //     }

// // //     const validTypes = ["image/jpeg", "image/png", "image/webp"];
// // //     if (!validTypes.includes(file.type)) {
// // //       return NextResponse.json({
// // //         success:  false,
// // //         verified: false,
// // //         message:  "Only JPG, PNG, or WEBP images supported. Please take a photo of your document.",
// // //       });
// // //     }

// // //     if (file.size > 5 * 1024 * 1024) {
// // //       return NextResponse.json({
// // //         success:  false,
// // //         verified: false,
// // //         message:  "File too large. Please upload an image under 5MB.",
// // //       });
// // //     }

// // //     const arrayBuffer = await file.arrayBuffer();
// // //     const base64Data  = Buffer.from(arrayBuffer).toString("base64");
// // //     const mimeType    = file.type;

// // //     const docPrompt = DOC_PROMPTS[documentId] || DEFAULT_PROMPT;

// // //     const promptText = `You are verifying a document for an Indian government welfare scheme application.

// // // ${docPrompt}

// // // IMPORTANT RULES:
// // // - Return ONLY valid JSON, no text outside the JSON, no markdown code fences
// // // - If image is blurry or unreadable, set verified: false, reason: "Image too blurry"
// // // - If not a document (selfie, random photo), set verified: false
// // // - Mask sensitive numbers — show only last 4 digits of Aadhaar, account numbers etc
// // // - If it looks like the right document type but some fields unclear, still verify it`;

// // //     const result = await ai.models.generateContent({
// // //       model: "gemini-2.5-flash-lite",
// // //       contents: [
// // //         {
// // //           role: "user",
// // //           parts: [
// // //             { inlineData: { data: base64Data, mimeType } },
// // //             { text: promptText },
// // //           ],
// // //         },
// // //       ],
// // //     });

// // //     const rawText = result.text || "{}";

// // //     let parsed = {};
// // //     try {
// // //       const clean = rawText.replace(/```json|```/g, "").trim();
// // //       parsed = JSON.parse(clean);
// // //     } catch {
// // //       parsed = {
// // //         isCorrectDocument: false,
// // //         verified:          false,
// // //         reason:            "Could not read document. Please try a clearer photo.",
// // //       };
// // //     }

// // //     const verified      = parsed.verified === true;
// // //     const extractedInfo = formatExtractedFields(parsed);

// // //     let message = "";
// // //     if (verified) {
// // //       message = `✅ ${docName} verified successfully!\n${extractedInfo}`;
// // //     } else if (!parsed.isCorrectDocument) {
// // //       message = `❌ Wrong document. Expected: ${docName}. ${parsed.reason || "Please upload the correct document."}`;
// // //     } else {
// // //       message = `❌ ${parsed.reason || "Document could not be verified. Please try a clearer photo."}`;
// // //     }

// // //     const { error: dbError } = await supabase
// // //       .from("citizen_documents")
// // //       .upsert(
// // //         {
// // //           session_id:  sessionId,
// // //           scheme_id:   schemeId,
// // //           document_id: documentId,
// // //           doc_name:    docName,
// // //           verified,
// // //           ocr_text:    extractedInfo,
// // //         },
// // //         { onConflict: "session_id,scheme_id,document_id" }
// // //       );

// // //     if (dbError) console.error("Supabase error:", dbError);

// // //     return NextResponse.json({
// // //       success:      true,
// // //       verified,
// // //       message,
// // //       extractedInfo,
// // //       documentType: parsed.documentType || docName,
// // //     });

// // //   } catch (err) {
// // //     console.error("OCR route error FULL:", err.message, err.stack);
// // //     return NextResponse.json(
// // //       { error: "Document verification failed. Please try again." },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }


// // // app/api/ocr/route.js
// // // Uses Gemini Vision to extract structured data from Indian government documents.

// // import { NextResponse } from "next/server";
// // import { GoogleGenAI } from "@google/genai";
// // import { createClient } from "@supabase/supabase-js";

// // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL,
// //   process.env.SUPABASE_SERVICE_ROLE_KEY,
// //   { auth: { persistSession: false } }
// // );

// // const DOC_PROMPTS = {
// //   "aadhaar": `This should be an Aadhaar card issued by UIDAI, Government of India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Aadhaar Card",
// //   "name": "full name on card",
// //   "dob": "date of birth if visible",
// //   "uid": "12-digit number, mask last 4 as XXXX",
// //   "gender": "Male/Female if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "death-cert": `This should be a Death Certificate issued by a government authority in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Death Certificate",
// //   "deceasedName": "name of deceased",
// //   "dateOfDeath": "date if visible",
// //   "issuingAuthority": "who issued it",
// //   "registrationNumber": "certificate number if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "income-cert": `This should be an Income Certificate issued by Tehsildar or SDM in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Income Certificate",
// //   "holderName": "name of holder",
// //   "annualIncome": "income amount if visible",
// //   "issuingAuthority": "Tehsildar/SDM/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "bank-passbook": `This should be a Bank Passbook or bank account document from an Indian bank.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Bank Passbook",
// //   "accountHolderName": "name on account",
// //   "bankName": "name of bank",
// //   "accountNumber": "mask all but last 4 digits",
// //   "ifscCode": "IFSC if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "secc-proof": `This should be a SECC 2011, BPL card, or ration card from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "BPL/SECC Document",
// //   "holderName": "name of holder",
// //   "cardNumber": "card number if visible",
// //   "category": "BPL/AAY/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "land-doc": `This should be a land document — Khasra, Khatauni, Jamabandi or registry from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Land Document",
// //   "ownerName": "owner name",
// //   "landArea": "area if visible",
// //   "surveyNumber": "Khasra/survey number if visible",
// //   "district": "district if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "passport-photo": `This should be a passport size photograph of a person.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Passport Photo",
// //   "hasHumanFace": true/false,
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "age-proof": `This should be an age proof document — birth certificate, school leaving certificate, voter ID, or Aadhaar card showing date of birth, issued in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Age Proof",
// //   "holderName": "name on document",
// //   "dob": "date of birth if visible",
// //   "issuingAuthority": "who issued it",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "bpl-card": `This should be a BPL (Below Poverty Line) card or ration card from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "BPL / Ration Card",
// //   "holderName": "name of holder",
// //   "cardNumber": "card number if visible",
// //   "category": "BPL/AAY/APL/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "disability-cert": `This should be a disability certificate issued by a government medical board in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Disability Certificate",
// //   "holderName": "name of holder",
// //   "disabilityPercentage": "percentage if visible",
// //   "issuingAuthority": "medical board / hospital name",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,
// // };

// // const DEFAULT_PROMPT = `Analyze this document and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "type detected",
// //   "extractedText": "key text on document",
// //   "verified": true/false,
// //   "reason": "explanation"
// // }`;

// // function formatExtractedFields(parsed) {
// //   const skip = ["isCorrectDocument", "documentType", "verified", "reason"];
// //   const lines = [];
// //   for (const [key, value] of Object.entries(parsed)) {
// //     if (skip.includes(key) || !value) continue;
// //     const label = key
// //       .replace(/([A-Z])/g, " $1")
// //       .replace(/^./, (s) => s.toUpperCase())
// //       .trim();
// //     lines.push(`${label}: ${value}`);
// //   }
// //   return lines.join("\n");
// // }

// // export async function POST(req) {
// //   try {
// //     const formData   = await req.formData();
// //     const file       = formData.get("file");
// //     const sessionId  = formData.get("sessionId");
// //     const schemeId   = formData.get("schemeId");
// //     const documentId = formData.get("documentId");
// //     const docName    = formData.get("docName") || documentId;

// //     if (!file || !sessionId || !schemeId || !documentId) {
// //       return NextResponse.json(
// //         { error: "file, sessionId, schemeId, documentId are required" },
// //         { status: 400 }
// //       );
// //     }

// //     const validTypes = ["image/jpeg", "image/png", "image/webp"];
// //     if (!validTypes.includes(file.type)) {
// //       return NextResponse.json({
// //         success:  false,
// //         verified: false,
// //         message:  "Only JPG, PNG, or WEBP images supported. Please take a photo of your document.",
// //       });
// //     }

// //     if (file.size > 5 * 1024 * 1024) {
// //       return NextResponse.json({
// //         success:  false,
// //         verified: false,
// //         message:  "File too large. Please upload an image under 5MB.",
// //       });
// //     }

// //     const arrayBuffer = await file.arrayBuffer();
// //     const base64Data  = Buffer.from(arrayBuffer).toString("base64");
// //     const mimeType    = file.type;

// //     const docPrompt = DOC_PROMPTS[documentId] || DEFAULT_PROMPT;

// //     const promptText = `You are verifying a document for an Indian government welfare scheme application.

// // ${docPrompt}

// // IMPORTANT RULES:
// // - Return ONLY valid JSON, no text outside the JSON, no markdown code fences
// // - If image is blurry or unreadable, set verified: false, reason: "Image too blurry"
// // - If not a document (selfie, random photo), set verified: false
// // - Mask sensitive numbers — show only last 4 digits of Aadhaar, account numbers etc
// // - If it looks like the right document type but some fields unclear, still verify it`;

// //     const result = await ai.models.generateContent({
// //       model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
// //       contents: [
// //         {
// //           role: "user",
// //           parts: [
// //             { inlineData: { data: base64Data, mimeType } },
// //             { text: promptText },
// //           ],
// //         },
// //       ],
// //     });

// //     const rawText = result.text || "{}";

// //     let parsed = {};
// //     try {
// //       const clean = rawText.replace(/```json|```/g, "").trim();
// //       parsed = JSON.parse(clean);
// //     } catch {
// //       parsed = {
// //         isCorrectDocument: false,
// //         verified:          false,
// //         reason:            "Could not read document. Please try a clearer photo.",
// //       };
// //     }

// //     const verified      = parsed.verified === true;
// //     const extractedInfo = formatExtractedFields(parsed);

// //     let message = "";
// //     if (verified) {
// //       message = `✅ ${docName} verified successfully!\n${extractedInfo}`;
// //     } else if (!parsed.isCorrectDocument) {
// //       message = `❌ Wrong document. Expected: ${docName}. ${parsed.reason || "Please upload the correct document."}`;
// //     } else {
// //       message = `❌ ${parsed.reason || "Document could not be verified. Please try a clearer photo."}`;
// //     }

// //     const { error: dbError } = await supabase
// //       .from("citizen_documents")
// //       .upsert(
// //         {
// //           session_id:  sessionId,
// //           scheme_id:   schemeId,
// //           document_id: documentId,
// //           doc_name:    docName,
// //           verified,
// //           ocr_text:    extractedInfo,
// //         },
// //         { onConflict: "session_id,scheme_id,document_id" }
// //       );

// //     if (dbError) console.error("Supabase error:", dbError);

// //     return NextResponse.json({
// //       success:      true,
// //       verified,
// //       message,
// //       extractedInfo,
// //       fields:       parsed,   // structured fields (name, dob, annualIncome, etc.) for cross-checking against the profile
// //       documentType: parsed.documentType || docName,
// //     });

// //   } catch (err) {
// //     console.error("OCR route error FULL:", err.message, err.stack);
// //     return NextResponse.json(
// //       { error: "Document verification failed. Please try again." },
// //       { status: 500 }
// //     );
// //   }
// // }
// // app/api/ocr/route.js
// // Uses Gemini Vision to extract structured data from Indian government documents with 503 fallback handling.



// // import { NextResponse } from "next/server";
// // import { GoogleGenAI } from "@google/genai";
// // import { createClient } from "@supabase/supabase-js";

// // export const maxDuration = 60; // Extend route timeout to 60s for serverless/Next.js

// // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL,
// //   process.env.SUPABASE_SERVICE_ROLE_KEY,
// //   { auth: { persistSession: false } }
// // );

// // // Resilient API Caller to handle 503 / High Demand Spikes
// // async function generateWithFallback(contents, retries = 2) {
// //   // Candidate models to fallback if primary model hits 503 rate limits
// //   const models = [
// //     process.env.GEMINI_MODEL || "gemini-2.5-flash",
// //     "gemini-1.5-flash",
// //     "gemini-2.0-flash",
// //   ];

// //   for (let attempt = 0; attempt <= retries; attempt++) {
// //     for (const modelName of models) {
// //       try {
// //         const result = await ai.models.generateContent({
// //           model: modelName,
// //           contents,
// //         });
// //         return result;
// //       } catch (err) {
// //         const is503 =
// //           err?.status === 503 ||
// //           err?.code === 503 ||
// //           err?.message?.includes("503") ||
// //           err?.message?.includes("high demand");

// //         if (is503) {
// //           console.warn(`[OCR API] Model ${modelName} hit 503 (high demand). Trying fallback...`);
// //           continue; // Try next model in list
// //         }
// //         throw err; // Rethrow non-503 errors directly
// //       }
// //     }
// //     // Exponential backoff delay before retrying the full loop
// //     if (attempt < retries) {
// //       await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
// //     }
// //   }

// //   throw new Error("AI service is currently experiencing high demand. Please try uploading again in a few seconds.");
// // }

// // const DOC_PROMPTS = {
// //   "aadhaar": `This should be an Aadhaar card issued by UIDAI, Government of India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Aadhaar Card",
// //   "name": "full name on card",
// //   "dob": "date of birth if visible",
// //   "uid": "12-digit number, mask last 4 as XXXX",
// //   "gender": "Male/Female if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "death-cert": `This should be a Death Certificate issued by a government authority in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Death Certificate",
// //   "deceasedName": "name of deceased",
// //   "dateOfDeath": "date if visible",
// //   "issuingAuthority": "who issued it",
// //   "registrationNumber": "certificate number if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "income-cert": `This should be an Income Certificate issued by Tehsildar or SDM in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Income Certificate",
// //   "holderName": "name of holder",
// //   "annualIncome": "income amount if visible",
// //   "issuingAuthority": "Tehsildar/SDM/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "bank-passbook": `This should be a Bank Passbook or bank account document from an Indian bank.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Bank Passbook",
// //   "accountHolderName": "name on account",
// //   "bankName": "name of bank",
// //   "accountNumber": "mask all but last 4 digits",
// //   "ifscCode": "IFSC if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "secc-proof": `This should be a SECC 2011, BPL card, or ration card from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "BPL/SECC Document",
// //   "holderName": "name of holder",
// //   "cardNumber": "card number if visible",
// //   "category": "BPL/AAY/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "land-doc": `This should be a land document — Khasra, Khatauni, Jamabandi or registry from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Land Document",
// //   "ownerName": "owner name",
// //   "landArea": "area if visible",
// //   "surveyNumber": "Khasra/survey number if visible",
// //   "district": "district if visible",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "passport-photo": `This should be a passport size photograph of a person.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Passport Photo",
// //   "hasHumanFace": true/false,
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "age-proof": `This should be an age proof document — birth certificate, school leaving certificate, voter ID, or Aadhaar card showing date of birth, issued in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Age Proof",
// //   "holderName": "name on document",
// //   "dob": "date of birth if visible",
// //   "issuingAuthority": "who issued it",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "bpl-card": `This should be a BPL (Below Poverty Line) card or ration card from India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "BPL / Ration Card",
// //   "holderName": "name of holder",
// //   "cardNumber": "card number if visible",
// //   "category": "BPL/AAY/APL/other",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,

// //   "disability-cert": `This should be a disability certificate issued by a government medical board in India.
// // Extract and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "Disability Certificate",
// //   "holderName": "name of holder",
// //   "disabilityPercentage": "percentage if visible",
// //   "issuingAuthority": "medical board / hospital name",
// //   "verified": true/false,
// //   "reason": "why verified or not"
// // }`,
// // };

// // const DEFAULT_PROMPT = `Analyze this document and return JSON only:
// // {
// //   "isCorrectDocument": true/false,
// //   "documentType": "type detected",
// //   "extractedText": "key text on document",
// //   "verified": true/false,
// //   "reason": "explanation"
// // }`;

// // function formatExtractedFields(parsed) {
// //   const skip = ["isCorrectDocument", "documentType", "verified", "reason"];
// //   const lines = [];
// //   for (const [key, value] of Object.entries(parsed)) {
// //     if (skip.includes(key) || !value) continue;
// //     const label = key
// //       .replace(/([A-Z])/g, " $1")
// //       .replace(/^./, (s) => s.toUpperCase())
// //       .trim();
// //     lines.push(`${label}: ${value}`);
// //   }
// //   return lines.join("\n");
// // }

// // export async function POST(req) {
// //   try {
// //     const formData   = await req.formData();
// //     const file       = formData.get("file");
// //     const sessionId  = formData.get("sessionId");
// //     const schemeId   = formData.get("schemeId");
// //     const documentId = formData.get("documentId");
// //     const docName    = formData.get("docName") || documentId;

// //     if (!file || !sessionId || !schemeId || !documentId) {
// //       return NextResponse.json(
// //         { error: "file, sessionId, schemeId, documentId are required" },
// //         { status: 400 }
// //       );
// //     }

// //     const validTypes = ["image/jpeg", "image/png", "image/webp"];
// //     if (!validTypes.includes(file.type)) {
// //       return NextResponse.json({
// //         success:  false,
// //         verified: false,
// //         message:  "Only JPG, PNG, or WEBP images supported. Please take a photo of your document.",
// //       });
// //     }

// //     if (file.size > 5 * 1024 * 1024) {
// //       return NextResponse.json({
// //         success:  false,
// //         verified: false,
// //         message:  "File too large. Please upload an image under 5MB.",
// //       });
// //     }

// //     const arrayBuffer = await file.arrayBuffer();
// //     const base64Data  = Buffer.from(arrayBuffer).toString("base64");
// //     const mimeType    = file.type;

// //     const docPrompt = DOC_PROMPTS[documentId] || DEFAULT_PROMPT;

// //     const promptText = `You are verifying a document for an Indian government welfare scheme application.

// // ${docPrompt}

// // IMPORTANT RULES:
// // - Return ONLY valid JSON, no text outside the JSON, no markdown code fences
// // - If image is blurry or unreadable, set verified: false, reason: "Image too blurry"
// // - If not a document (selfie, random photo), set verified: false
// // - Mask sensitive numbers — show only last 4 digits of Aadhaar, account numbers etc
// // - If it looks like the right document type but some fields unclear, still verify it`;

// //     // Execute API call with fallback & retry handling
// //     const result = await generateWithFallback([
// //       {
// //         role: "user",
// //         parts: [
// //           { inlineData: { data: base64Data, mimeType } },
// //           { text: promptText },
// //         ],
// //       },
// //     ]);

// //     const rawText = result.text || "{}";

// //     let parsed = {};
// //     try {
// //       const clean = rawText.replace(/```json|```/g, "").trim();
// //       parsed = JSON.parse(clean);
// //     } catch {
// //       parsed = {
// //         isCorrectDocument: false,
// //         verified:          false,
// //         reason:            "Could not read document. Please try a clearer photo.",
// //       };
// //     }

// //     const verified      = parsed.verified === true;
// //     const extractedInfo = formatExtractedFields(parsed);

// //     let message = "";
// //     if (verified) {
// //       message = `✅ ${docName} verified successfully!\n${extractedInfo}`;
// //     } else if (!parsed.isCorrectDocument) {
// //       message = `❌ Wrong document. Expected: ${docName}. ${parsed.reason || "Please upload the correct document."}`;
// //     } else {
// //       message = `❌ ${parsed.reason || "Document could not be verified. Please try a clearer photo."}`;
// //     }

// //     const { error: dbError } = await supabase
// //       .from("citizen_documents")
// //       .upsert(
// //         {
// //           session_id:  sessionId,
// //           scheme_id:   schemeId,
// //           document_id: documentId,
// //           doc_name:    docName,
// //           verified,
// //           ocr_text:    extractedInfo,
// //         },
// //         { onConflict: "session_id,scheme_id,document_id" }
// //       );

// //     if (dbError) console.error("Supabase error:", dbError);

// //     return NextResponse.json({
// //       success:      true,
// //       verified,
// //       message,
// //       extractedInfo,
// //       fields:       parsed,
// //       documentType: parsed.documentType || docName,
// //     });

// //   } catch (err) {
// //     console.error("OCR route error FULL:", err.message, err.stack);
// //     return NextResponse.json(
// //       { error: err.message || "Document verification failed. Please try again." },
// //       { status: 500 }
// //     );
// //   }
// // }

// // sakhi/components/DocumentUpload.js
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAssistant } from "../client/useAssistant";
// import { DOC_FIELD_MAP, findAgeMismatch } from "../lib/docIdentity.js";

// const STATUS_ICON = {
//   idle:       "📄",
//   uploading:  "⏳",
//   verified:   "✅",
//   failed:     "❌",
// };

// async function compressImage(file) {
//   if (file.type === "application/pdf") return file;

//   return new Promise((resolve) => {
//     const img = new Image();
//     img.src = URL.createObjectURL(file);
//     img.onload = () => {
//       URL.revokeObjectURL(img.src);
//       const canvas = document.createElement("canvas");
//       const MAX_WIDTH = 1200;
//       const scaleSize = MAX_WIDTH / img.width;

//       if (scaleSize < 1) {
//         canvas.width = MAX_WIDTH;
//         canvas.height = img.height * scaleSize;
//       } else {
//         canvas.width = img.width;
//         canvas.height = img.height;
//       }

//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) {
//             resolve(file);
//             return;
//           }
//           resolve(new File([blob], file.name, { type: "image/jpeg" }));
//         },
//         "image/jpeg",
//         0.8
//       );
//     };
//     img.onerror = () => resolve(file);
//   });
// }

// function normalizeProfile(profile) {
//   if (!profile) return null;
//   const pick = (...candidates) => candidates.map((k) => profile[k]).find((v) => v !== undefined && v !== null);
//   return {
//     name:         pick("name", "fullName", "full_name"),
//     dob:          pick("dob", "dateOfBirth", "date_of_birth"),
//     incomeAnnual: pick("incomeAnnual", "income_annual", "annualIncome"),
//     age:          pick("age"),
//   };
// }

// export default function DocumentUpload({ sessionId, schemeId, schemeName, documents, onVerified }) {
//   const router = useRouter();
//   const { verifyDocument } = useAssistant();

//   const [profile, setProfile] = useState(null);
//   const inputRefs = useRef({});

//   useEffect(() => {
//     if (!sessionId) return;
//     let cancelled = false;
//     fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (!cancelled) setProfile(normalizeProfile(data.profile));
//       })
//       .catch((err) => console.error("Failed to load citizen profile:", err));
//     return () => { cancelled = true; };
//   }, [sessionId]);

//   const [docState, setDocState] = useState(
//     Object.fromEntries(
//       (documents || []).map((d) => [
//         d.id,
//         {
//           status: d.verified ? "verified" : "idle",
//           message: d.verified ? "Already verified" : "",
//           preview: d.ocr_text || "",
//           crossCheck: null,
//           fields: d.fields || {},
//         },
//       ])
//     )
//   );

//   const [applyState, setApplyState] = useState("idle");
//   const [applyError, setApplyError] = useState("");

//   // Sync state & perform cross-check on stored/hydrated documents
//   useEffect(() => {
//     setDocState((prev) => {
//       const next = { ...prev };
//       for (const d of documents || []) {
//         const current = next[d.id];
//         if (d.verified && current?.status !== "verified") {
//           next[d.id] = {
//             status: "verified",
//             message: current?.message || "Already verified",
//             preview: d.ocr_text || current?.preview || "",
//             fields: d.fields || current?.fields || {},
//             crossCheck: current?.crossCheck || null,
//           };
//         } else if (!next[d.id]) {
//           next[d.id] = { status: "idle", message: "", preview: "", fields: {}, crossCheck: null };
//         }
//       }
//       return next;
//     });
//   }, [JSON.stringify((documents || []).map((d) => [d.id, d.verified, d.ocr_text]))]);

//   // Run cross-check whenever profile or hydrated document fields are present
//   useEffect(() => {
//     if (!profile) return;

//     (documents || []).forEach(async (doc) => {
//       const fieldMap = DOC_FIELD_MAP[doc.id];
//       const state = docState[doc.id];

//       if (state?.status === "verified" && fieldMap && !state.crossCheck) {
//         try {
//           const fields = state.fields || {};
//           const result = await verifyDocument(doc.name, fields, profile, fieldMap);

//           if (fieldMap.dob) {
//             const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
//             if (ageMismatch) {
//               result.matches = false;
//               result.mismatches = [...(result.mismatches || []), ageMismatch];
//             }
//           }

//           setDocState((prev) => ({
//             ...prev,
//             [doc.id]: { ...prev[doc.id], crossCheck: result },
//           }));
//         } catch (err) {
//           console.error("Cross-check evaluation failed:", err);
//         }
//       }
//     });
//   }, [profile, docState]);

//   function setDoc(docId, patch) {
//     setDocState((prev) => ({ ...prev, [docId]: { ...prev[docId], ...patch } }));
//   }

//   async function handleFile(doc, file) {
//     if (!file) return;

//     if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
//       setDoc(doc.id, { status: "failed", message: "Only images (JPG, PNG) or PDF allowed." });
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       setDoc(doc.id, { status: "failed", message: "File too large. Max 10MB." });
//       return;
//     }

//     setDoc(doc.id, { status: "uploading", message: "Processing & verifying document..." });

//     try {
//       const processedFile = await compressImage(file);

//       const form = new FormData();
//       form.append("file",       processedFile);
//       form.append("sessionId",  sessionId);
//       form.append("schemeId",   schemeId);
//       form.append("documentId", doc.id);
//       form.append("docName",    doc.name);

//       const res  = await fetch("/api/ocr", { method: "POST", body: form });
//       const data = await res.json();

//       if (!res.ok) throw new Error(data.error || "Document processing failed");

//       const fields = data.fields || {};

//       let crossCheckResult = null;
//       const fieldMap = DOC_FIELD_MAP[doc.id];
//       if (data.verified && fieldMap && profile) {
//         try {
//           crossCheckResult = await verifyDocument(doc.name, fields, profile, fieldMap);

//           if (fieldMap.dob) {
//             const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
//             if (ageMismatch) {
//               crossCheckResult.matches = false;
//               crossCheckResult.mismatches = [...(crossCheckResult.mismatches || []), ageMismatch];
//             }
//           }
//         } catch (err) {
//           console.error("Document cross-check failed:", err);
//         }
//       }

//       setDoc(doc.id, {
//         status:     data.verified ? "verified" : "failed",
//         message:    data.message || "Document verified successfully!",
//         preview:    data.extractedInfo || data.ocrPreview || "",
//         fields:     fields,
//         crossCheck: crossCheckResult,
//       });

//       if (data.verified && onVerified) {
//         onVerified(doc.id);
//       }
//     } catch (err) {
//       setDoc(doc.id, {
//         status:  "failed",
//         message: err.message || "Upload failed. Please try again.",
//       });
//       console.error(err);
//     }
//   }

//   async function handleApply() {
//     setApplyState("submitting");
//     setApplyError("");

//     try {
//       const res = await fetch("/api/applications", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ sessionId, schemeId, schemeName }),
//       });
//       const data = await res.json();

//       if (!res.ok) throw new Error(data.error || "Application failed");

//       setApplyState("success");

//       setTimeout(() => {
//         router.push("/track-applications");
//       }, 1500);
//     } catch (err) {
//       setApplyState("failed");
//       setApplyError(err.message || "Could not submit application. Please try again.");
//       console.error(err);
//     }
//   }

//   if (!documents || documents.length === 0) return null;

//   const verifiedCount = Object.values(docState).filter((s) => s.status === "verified").length;
//   const totalCount    = documents.length;
//   const pct           = Math.round((verifiedCount / totalCount) * 100);
//   const allVerified   = verifiedCount === totalCount && totalCount > 0;

//   const hasCriticalMismatch = Object.values(docState).some((s) =>
//     s.crossCheck && !s.crossCheck.matches && s.crossCheck.mismatches?.some((m) => m.severity === "critical")
//   );

//   const readyToApply = allVerified && !hasCriticalMismatch;

//   return (
//     <div className="doc-upload-panel">
//       <div className="doc-panel-header">
//         <div className="doc-panel-title">📋 Required Documents</div>
//         <div className="doc-panel-progress">
//           <div className="doc-progress-bar">
//             <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
//           </div>
//           <span className="doc-progress-label">{verifiedCount}/{totalCount} verified</span>
//         </div>
//       </div>

//       <div className="doc-list">
//         {documents.map((doc) => {
//           const state = docState[doc.id] || { status: "idle", message: "", preview: "" };
//           const isUploading = state.status === "uploading";

//           return (
//             <div key={doc.id} className={`doc-row doc-row-${state.status}`}>
//               <div className="doc-row-left">
//                 <span className="doc-status-icon">{STATUS_ICON[state.status]}</span>
//                 <div className="doc-info">
//                   <div className="doc-name">{doc.name}</div>
//                   <div className="doc-desc">{doc.description}</div>

//                   {state.message && (
//                     <div className={`doc-message ${state.status === "verified" ? "doc-msg-ok" : "doc-msg-err"}`}>
//                       {state.message}
//                     </div>
//                   )}

//                   {state.preview && state.status === "verified" && (
//                     <div className="doc-preview">
//                       <span className="doc-preview-label">Extracted:</span>
//                       <span className="doc-preview-text">{state.preview}</span>
//                     </div>
//                   )}

//                   {state.crossCheck && !state.crossCheck.matches && (
//                     <div className={`doc-crosscheck ${state.crossCheck.mismatches.some((m) => m.severity === "critical") ? "doc-crosscheck-critical" : "doc-crosscheck-minor"}`}>
//                       {state.crossCheck.mismatches.map((m, i) => (
//                         <div key={i}>⚠️ {m.field}: form says "{m.formValue}", document says "{m.documentValue}" — {m.note}</div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="doc-row-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <input
//                   type="file"
//                   accept="image/*,.pdf"
//                   ref={(el) => (inputRefs.current[doc.id] = el)}
//                   style={{ display: "none" }}
//                   onChange={(e) => handleFile(doc, e.target.files[0])}
//                 />

//                 {state.status === "verified" ? (
//                   <>
//                     <span className="doc-verified-badge">Verified ✓</span>
//                     <button
//                       className="doc-upload-btn"
//                       style={{ backgroundColor: "#374151", color: "#f3f4f6", border: "1px solid #4b5563" }}
//                       disabled={isUploading}
//                       onClick={() => inputRefs.current[doc.id]?.click()}
//                     >
//                       {isUploading ? "Scanning..." : "Re-upload"}
//                     </button>
//                   </>
//                 ) : (
//                   <button
//                     className="doc-upload-btn"
//                     disabled={isUploading}
//                     onClick={() => inputRefs.current[doc.id]?.click()}
//                   >
//                     {isUploading ? "Scanning..." : "Upload"}
//                   </button>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {allVerified && hasCriticalMismatch && (
//         <div className="doc-complete-section">
//           <div className="doc-crosscheck doc-crosscheck-critical">
//             ⚠️ We found a mismatch between your form details and an uploaded document (see above). Please fix this before applying — use the Re-upload button to update the correct document.
//           </div>
//         </div>
//       )}

//       {readyToApply && (
//         <div className="doc-complete-section">
//           {applyState !== "success" && (
//             <div className="doc-complete-banner">
//               🎉 Sabhi documents verify ho gaye! Aap apply karne ke liye taiyaar hain.
//             </div>
//           )}

//           {applyState === "success" && (
//             <div className="doc-complete-banner doc-apply-success">
//               ✅ Application submitted successfully! Redirecting to Track Applications...
//             </div>
//           )}

//           {applyState === "failed" && (
//             <div className="doc-apply-error">{applyError}</div>
//           )}

//           {applyState !== "success" && (
//             <button
//               className="doc-apply-btn"
//               onClick={handleApply}
//               disabled={applyState === "submitting"}
//             >
//               {applyState === "submitting" ? "Submitting..." : "Apply Now →"}
//             </button>
//           )}

//           {applyState !== "success" && (
//             <a
//               href={`/application-support?scheme=${schemeId}`}
//               className="btn-link"
//               style={{ marginLeft: "12px" }}
//             >
//               📥 Get pre-filled application PDF →
//             </a>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// app/api/ocr/route.js
// Uses Gemini Vision to extract structured data from Indian government documents with 503 fallback handling.

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60; // Extend route timeout to 60s for serverless/Next.js

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Resilient API Caller to handle 503 / High Demand Spikes
async function generateWithFallback(contents, retries = 2) {
  const models = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const modelName of models) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents,
        });
        return result;
      } catch (err) {
        const is503 =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand");

        if (is503) {
          console.warn(`[OCR API] Model ${modelName} hit 503 (high demand). Trying fallback...`);
          continue;
        }
        throw err;
      }
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }

  throw new Error("AI service is currently experiencing high demand. Please try uploading again in a few seconds.");
}

const DOC_PROMPTS = {
  "aadhaar": `This should be an Aadhaar card issued by UIDAI, Government of India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Aadhaar Card",
  "name": "full name on card",
  "dob": "date of birth if visible",
  "uid": "12-digit number, mask last 4 as XXXX",
  "gender": "Male/Female if visible",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "death-cert": `This should be a Death Certificate issued by a government authority in India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Death Certificate",
  "deceasedName": "name of deceased",
  "dateOfDeath": "date if visible",
  "issuingAuthority": "who issued it",
  "registrationNumber": "certificate number if visible",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "income-cert": `This should be an Income Certificate issued by Tehsildar or SDM in India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Income Certificate",
  "holderName": "name of holder",
  "annualIncome": "income amount if visible",
  "issuingAuthority": "Tehsildar/SDM/other",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "bank-passbook": `This should be a Bank Passbook or bank account document from an Indian bank.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Bank Passbook",
  "accountHolderName": "name on account",
  "bankName": "name of bank",
  "accountNumber": "mask all but last 4 digits",
  "ifscCode": "IFSC if visible",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "secc-proof": `This should be a SECC 2011, BPL card, or ration card from India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "BPL/SECC Document",
  "holderName": "name of holder",
  "cardNumber": "card number if visible",
  "category": "BPL/AAY/other",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "land-doc": `This should be a land document — Khasra, Khatauni, Jamabandi or registry from India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Land Document",
  "ownerName": "owner name",
  "landArea": "area if visible",
  "surveyNumber": "Khasra/survey number if visible",
  "district": "district if visible",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "passport-photo": `This should be a passport size photograph of a person.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Passport Photo",
  "hasHumanFace": true/false,
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "age-proof": `This should be an age proof document — birth certificate, school leaving certificate, voter ID, or Aadhaar card showing date of birth, issued in India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Age Proof",
  "holderName": "name on document",
  "dob": "date of birth if visible",
  "issuingAuthority": "who issued it",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "bpl-card": `This should be a BPL (Below Poverty Line) card or ration card from India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "BPL / Ration Card",
  "holderName": "name of holder",
  "cardNumber": "card number if visible",
  "category": "BPL/AAY/APL/other",
  "verified": true/false,
  "reason": "why verified or not"
}`,

  "disability-cert": `This should be a disability certificate issued by a government medical board in India.
Extract and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "Disability Certificate",
  "holderName": "name of holder",
  "disabilityPercentage": "percentage if visible",
  "issuingAuthority": "medical board / hospital name",
  "verified": true/false,
  "reason": "why verified or not"
}`,
};

const DEFAULT_PROMPT = `Analyze this document and return JSON only:
{
  "isCorrectDocument": true/false,
  "documentType": "type detected",
  "extractedText": "key text on document",
  "verified": true/false,
  "reason": "explanation"
}`;

function formatExtractedFields(parsed) {
  const skip = ["isCorrectDocument", "documentType", "verified", "reason"];
  const lines = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (skip.includes(key) || !value) continue;
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
    lines.push(`${label}: ${value}`);
  }
  return lines.join("\n");
}

export async function POST(req) {
  try {
    const formData   = await req.formData();
    const file       = formData.get("file");
    const sessionId  = formData.get("sessionId");
    const schemeId   = formData.get("schemeId");
    const documentId = formData.get("documentId");
    const docName    = formData.get("docName") || documentId;

    if (!file || !sessionId || !schemeId || !documentId) {
      return NextResponse.json(
        { error: "file, sessionId, schemeId, documentId are required" },
        { status: 400 }
      );
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success:  false,
        verified: false,
        message:  "Only JPG, PNG, or WEBP images supported. Please take a photo of your document.",
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success:  false,
        verified: false,
        message:  "File too large. Please upload an image under 5MB.",
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data  = Buffer.from(arrayBuffer).toString("base64");
    const mimeType    = file.type;

    const docPrompt = DOC_PROMPTS[documentId] || DEFAULT_PROMPT;

    const promptText = `You are verifying a document for an Indian government welfare scheme application.

${docPrompt}

IMPORTANT RULES:
- Return ONLY valid JSON, no text outside the JSON, no markdown code fences
- If image is blurry or unreadable, set verified: false, reason: "Image too blurry"
- If not a document (selfie, random photo), set verified: false
- Mask sensitive numbers — show only last 4 digits of Aadhaar, account numbers etc
- If it looks like the right document type but some fields unclear, still verify it`;

    const result = await generateWithFallback([
      {
        role: "user",
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: promptText },
        ],
      },
    ]);

    const rawText = result.text || "{}";

    let parsed = {};
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        isCorrectDocument: false,
        verified:          false,
        reason:            "Could not read document. Please try a clearer photo.",
      };
    }

    const verified      = parsed.verified === true;
    const extractedInfo = formatExtractedFields(parsed);

    let message = "";
    if (verified) {
      message = `✅ ${docName} verified successfully!\n${extractedInfo}`;
    } else if (!parsed.isCorrectDocument) {
      message = `❌ Wrong document. Expected: ${docName}. ${parsed.reason || "Please upload the correct document."}`;
    } else {
      message = `❌ ${parsed.reason || "Document could not be verified. Please try a clearer photo."}`;
    }

    const { error: dbError } = await supabase
      .from("citizen_documents")
      .upsert(
        {
          session_id:  sessionId,
          scheme_id:   schemeId,
          document_id: documentId,
          doc_name:    docName,
          verified,
          ocr_text:    extractedInfo,
        },
        { onConflict: "session_id,scheme_id,document_id" }
      );

    if (dbError) console.error("Supabase error:", dbError);

    return NextResponse.json({
      success:      true,
      verified,
      message,
      extractedInfo,
      fields:       parsed,
      documentType: parsed.documentType || docName,
    });

  } catch (err) {
    console.error("OCR route error FULL:", err.message, err.stack);
    return NextResponse.json(
      { error: err.message || "Document verification failed. Please try again." },
      { status: 500 }
    );
  }
}