// app/api/tts/route.js
// Converts text into spoken audio using Bhashini's TTS pipeline.
// Returns base64-encoded audio (WAV) that the browser can play directly.

import { NextResponse } from "next/server";

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

export async function POST(req) {
  try {
    const { text, language } = await req.json();

    if (!text || !language) {
      return NextResponse.json({ error: "text and language are required" }, { status: 400 });
    }

    // Step 1: Pipeline Config call
    const configRes = await fetch(CONFIG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        userID: process.env.BHASHINI_USER_ID,
        ulcaApiKey: process.env.BHASHINI_ULCA_API_KEY,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "tts",
            config: {
              language: { sourceLanguage: language },
            },
          },
        ],
        pipelineRequestConfig: {
          pipelineId: "64392f96daac500b55c543cd",
        },
      }),
    });

    if (!configRes.ok) {
      console.error("Bhashini TTS config failed:", await configRes.text());
      return NextResponse.json({ error: "Speech service unavailable" }, { status: 502 });
    }

    const configData = await configRes.json();
    const serviceId = configData?.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
    const computeUrl = configData?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKeyName = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.name;
    const inferenceApiKeyValue = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    if (!computeUrl || !serviceId) {
      console.error("Unexpected Bhashini TTS config response:", JSON.stringify(configData));
      return NextResponse.json({ error: "Speech service misconfigured" }, { status: 502 });
    }

    // Step 2: Pipeline Compute call
    const computeRes = await fetch(computeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [inferenceApiKeyName]: inferenceApiKeyValue,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "tts",
            config: {
              language: { sourceLanguage: language },
              serviceId,
              gender: "female",
              samplingRate: 8000,
            },
          },
        ],
        inputData: {
          input: [{ source: text }],
        },
      }),
    });

    if (!computeRes.ok) {
      console.error("Bhashini TTS compute failed:", await computeRes.text());
      return NextResponse.json({ error: "Speech generation failed" }, { status: 502 });
    }

    const computeData = await computeRes.json();
    const audioBase64 = computeData?.pipelineResponse?.[0]?.audio?.[0]?.audioContent || "";

    if (!audioBase64) {
      return NextResponse.json({ error: "No audio returned" }, { status: 502 });
    }

    return NextResponse.json({ audioBase64, mimeType: "audio/wav" });
  } catch (err) {
    console.error("TTS route error:", err.message);
    return NextResponse.json({ error: "Speech generation failed. Please try again." }, { status: 500 });
  }
}