// app/api/asr/route.js
// Converts spoken audio (base64-encoded WAV) into text using Bhashini's ASR pipeline.

import { NextResponse } from "next/server";

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

export async function POST(req) {
  try {
    const { audioBase64, language } = await req.json();

    if (!audioBase64 || !language) {
      return NextResponse.json({ error: "audioBase64 and language are required" }, { status: 400 });
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
            taskType: "asr",
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
      console.error("Bhashini ASR config failed:", await configRes.text());
      return NextResponse.json({ error: "Speech recognition unavailable" }, { status: 502 });
    }

    const configData = await configRes.json();
    const serviceId = configData?.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
    const computeUrl = configData?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKeyName = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.name;
    const inferenceApiKeyValue = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    if (!computeUrl || !serviceId) {
      console.error("Unexpected Bhashini ASR config response:", JSON.stringify(configData));
      return NextResponse.json({ error: "Speech recognition misconfigured" }, { status: 502 });
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
            taskType: "asr",
            config: {
              language: { sourceLanguage: language },
              serviceId,
              audioFormat: "wav",
              samplingRate: 16000,
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }],
        },
      }),
    });

    if (!computeRes.ok) {
      console.error("Bhashini ASR compute failed:", await computeRes.text());
      return NextResponse.json({ error: "Speech recognition failed" }, { status: 502 });
    }

    const computeData = await computeRes.json();
    const transcript = computeData?.pipelineResponse?.[0]?.output?.[0]?.source || "";

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("ASR route error:", err.message);
    return NextResponse.json({ error: "Speech recognition failed. Please try again." }, { status: 500 });
  }
}