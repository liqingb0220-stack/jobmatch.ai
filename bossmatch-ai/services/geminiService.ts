
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, JobMatch, AnalysisResult, OptimizationDiagnosis, OptimizationStep } from "../types";

const getAI = () => {
  const apiKey = VITE_GEMINI_API_KEY;
  console.log("[GeminiService] Checking API Key presence:", !!apiKey);
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProfile = async (profile: UserProfile): Promise<AnalysisResult> => {
  console.log("[GeminiService] analyzeProfile called");
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `你是一名资深的职业顾问。请深度分析以下求职者的简历与期望，输出结构化分析报告。
请在 summary 中包含一个类似“(已识别 XX 条核心经历)”的说明。
简历：${profile.resumeText}
期望：${profile.expectations}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING, description: "AI 肖像分析，必须包含经历条数统计" },
          suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "核心竞争优势" },
        },
        required: ["keywords", "summary", "suggestedRoles", "strengths"],
      },
    },
  });

  console.log("[GeminiService] analyzeProfile response received");
  return JSON.parse(response.text || '{}');
};

export const searchAndMatchJobs = async (profile: UserProfile, analysis: AnalysisResult, excludeTitles: string[] = []): Promise<JobMatch[]> => {
  console.log("[GeminiService] searchAndMatchJobs called");
  const ai = getAI();
  const excludePart = excludeTitles.length > 0 ? `排除：${excludeTitles.join('、')}` : "";
  
  const prompt = `
    作为猎头专家，利用 Google Search 确认 BOSS直聘 或官网在招岗位。
    背景：${analysis.summary}
    期望：${profile.expectations}
    ${excludePart}
    要求：存活性验证，真实链接（官网或招聘平台首页），中文。
    在返回的 reason 中，请包含一句“已找到 X 条高度相关经历”的描述。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            salary: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            url: { type: Type.STRING },
            skillsMatch: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirementsMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
            jdSummary: { type: Type.STRING },
          },
          required: ["title", "company", "matchScore", "reason", "url", "location", "salary", "jdSummary"],
        },
      },
    },
  });

  console.log("[GeminiService] searchAndMatchJobs response received");
  try {
    const rawText = response.text || '[]';
    const cleanedText = rawText.replace(/```json|```/g, '').trim();
    const results: JobMatch[] = JSON.parse(cleanedText);
    return results.filter(job => job.url && job.url.startsWith('http'));
  } catch (error) {
    console.error("[GeminiService] Failed to parse jobs:", error);
    return [];
  }
};

export const getOptimizationDiagnosis = async (resumeText: string, job: JobMatch): Promise<OptimizationDiagnosis> => {
  console.log("[GeminiService] getOptimizationDiagnosis called");
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `对比岗位 "${job.title} @ ${job.company}" 的需求与以下简历。
JD摘要：${job.jdSummary}
简历：${resumeText.substring(0, 2000)}
请给出诊断：匹配度概览、核心短板、快速改进建议。
要求：在 matchOverview 中明确说明“已解析 JD（X 项核心要求）”。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchOverview: { type: Type.STRING },
          score: { type: Type.NUMBER },
          coreGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          quickWins: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["matchOverview", "score", "coreGaps", "quickWins"],
      },
    },
  });
  console.log("[GeminiService] getOptimizationDiagnosis response received");
  return JSON.parse(response.text || '{}');
};

export const getDeepOptimizationSteps = async (resumeText: string, job: JobMatch): Promise<OptimizationStep[]> => {
  console.log("[GeminiService] getDeepOptimizationSteps called");
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `进行深度语义优化（非关键词堆砌）。针对 "${job.title}"，从以下简历中挑出 2-3 个最需要重写的段落。
简历内容：${resumeText.substring(0, 2500)}
要求：提供原句、优化后的句子及深度优化逻辑。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING },
            original: { type: Type.STRING },
            improved: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["section", "original", "improved", "reasoning"],
        },
      },
    },
  });
  console.log("[GeminiService] getDeepOptimizationSteps response received");
  return JSON.parse(response.text || '[]');
}
