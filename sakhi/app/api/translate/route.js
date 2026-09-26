// app/api/translate/route.js
// Translates text between Indian languages using Bhashini's ULCA pipeline.
// Two-step call: (1) pipeline config to get the compute endpoint + auth token,
// (2) pipeline compute to actually translate the text.

import { NextResponse } from "next/server";

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

export async function POST(req) {
  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();

    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "text, sourceLanguage, and targetLanguage are required" },
        { status: 400 }
      );
    }

    // Step 1: Pipeline Config call — ask Bhashini which model/endpoint to use
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
            taskType: "translation",
            config: {
              language: { sourceLanguage, targetLanguage },
            },
          },
        ],
        pipelineRequestConfig: {
          pipelineId: "64392f96daac500b55c543cd", // Bhashini's standard public pipeline ID
        },
      }),
    });

    if (!configRes.ok) {
      const errText = await configRes.text();
      console.error("Bhashini config call failed:", errText);
      return NextResponse.json({ error: "Translation service unavailable" }, { status: 502 });
    }

    const configData = await configRes.json();

    const serviceId = configData?.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
    const computeUrl = configData?.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKeyName = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.name;
    const inferenceApiKeyValue = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    if (!computeUrl || !serviceId) {
      console.error("Unexpected Bhashini config response:", JSON.stringify(configData));
      return NextResponse.json({ error: "Translation service misconfigured" }, { status: 502 });
    }

    // Step 2: Pipeline Compute call — actually translate the text
    const computeRes = await fetch(computeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [inferenceApiKeyName]: inferenceApiKeyValue,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "translation",
            config: {
              language: { sourceLanguage, targetLanguage },
              serviceId,
            },
          },
        ],
        inputData: {
          input: [{ source: text }],
        },
      }),
    });

    if (!computeRes.ok) {
      const errText = await computeRes.text();
      console.error("Bhashini compute call failed:", errText);
      return NextResponse.json({ error: "Translation failed" }, { status: 502 });
    }

    const computeData = await computeRes.json();
    const translatedText =
      computeData?.pipelineResponse?.[0]?.output?.[0]?.target || "";

    return NextResponse.json({ translatedText });
  } catch (err) {
    console.error("Translate route error:", err.message);
    return NextResponse.json({ error: "Translation failed. Please try again." }, { status: 500 });
  }
}