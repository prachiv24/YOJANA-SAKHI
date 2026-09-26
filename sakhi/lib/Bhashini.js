// lib/bhashini.js
const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

export async function translateText(text, sourceLanguage, targetLanguage) {
  if (sourceLanguage === targetLanguage) return text;
  if (!text || !text.trim()) return text;

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
          taskType: "translation",
          config: { language: { sourceLanguage, targetLanguage } },
        },
      ],
      pipelineRequestConfig: {
        pipelineId: "64392f96daac500b55c543cd",
      },
    }),
  });

  if (!configRes.ok) {
    console.error("Bhashini config call failed:", await configRes.text());
    throw new Error("Translation service unavailable");
  }

  const configData = await configRes.json();
  const serviceId = configData?.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
  const computeUrl = configData?.pipelineInferenceAPIEndPoint?.callbackUrl;
  const inferenceApiKeyName = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.name;
  const inferenceApiKeyValue = configData?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

  if (!computeUrl || !serviceId) {
    console.error("Unexpected Bhashini config response:", JSON.stringify(configData));
    throw new Error("Translation service misconfigured");
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
          taskType: "translation",
          config: { language: { sourceLanguage, targetLanguage }, serviceId },
        },
      ],
      inputData: { input: [{ source: text }] },
    }),
  });

  if (!computeRes.ok) {
    console.error("Bhashini compute call failed:", await computeRes.text());
    throw new Error("Translation failed");
  }

  const computeData = await computeRes.json();
  return computeData?.pipelineResponse?.[0]?.output?.[0]?.target || "";
}