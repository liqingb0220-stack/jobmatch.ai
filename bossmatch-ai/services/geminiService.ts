
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, JobMatch, AnalysisResult, OptimizationDiagnosis, OptimizationStep } from "../types";

/**
 * Creates a new instance of GoogleGenAI using the environment's API Key.
 * We initialize inside functions to prevent top-level load errors if the key is momentarily unavailable.
 */
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("YOUR_API_KEY")) { 
    console.error("[GeminiService] API 不可用或遗失");
    throw new Error("AUTH_ERROR");
  }
  return new GoogleGenAI(apiKey); 
};

export const analyzeProfile = async (profile: UserProfile): Promise<AnalysisResult> => {
  console.log("[GeminiService] analyzeProfile called");
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `你是一名资深的职业顾问。请深度分析以下求职者的简历与期望，输出结构化分析报告。
请在 summary 中包含一个类似“(已识别 XX 条核心经历)”的说明。
简历内容：${profile.resumeText}
职业期望：${profile.expectations}`,
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
  const excludePart = excludeTitles.length > 0 ? `请务必避开以下已搜索过的职位：${excludeTitles.join('、')}` : "";
  
  const prompt = `
    作为资深猎头专家，请利用 Google Search 检索并在招岗位中筛选出最适合该用户的机会。
    用户背景摘要：${analysis.summary}
    用户职业期望：${profile.expectations}
    ${excludePart}
    
    要求：
    1. 必须返回 10 个最匹配的岗位。
    2. 岗位必须是真实存在的，提供其官网、BOSS直聘或相应招聘平台的检索入口。
    3. 在 reason 字段中，请用一句话说明“已找到 X 条高度相关经历”来支撑推荐理由。
    4. 使用中文回答。
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
    const results: JobMatch[] = JSON.parse(rawText);
    return results.filter(job => job.url && job.url.startsWith('http')).slice(0, 10);
  } catch (error) {
    console.error("[GeminiService] JSON parse error:", error);
    throw new Error("PARSE_ERROR");
  }
};

export const getOptimizationDiagnosis = async (resumeText: string, job: JobMatch): Promise<OptimizationDiagnosis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `对比岗位 "${job.title} @ ${job.company}" 的需求与以下简历。
JD摘要：${job.jdSummary}
简历文本：${resumeText.substring(0, 3000)}
请提供诊断报告：匹配度概览（需包含“已解析 JD（X 项核心要求）”）、匹配得分、核心短板、快速改进建议。`,
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
  return JSON.parse(response.text || '{}');
};

export const getDeepOptimizationSteps = async (resumeText: string, job: JobMatch): Promise<OptimizationStep[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `进行简历深度语义优化。目标职位："${job.title} @ ${job.company}"。
简历：${resumeText.substring(0, 3000)}
请选出 3 个关键段落进行重构。`,
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
  return JSON.parse(response.text || '[]');
};

