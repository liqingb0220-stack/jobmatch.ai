
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, JobMatch, AnalysisResult, OptimizationDiagnosis, OptimizationStep } from "../types";

/**
 * 内部获取 AI 实例的方法
 * 兼容用户指定的 VITE_GEMINI_API_KEY 及系统预设的 process.env.API_KEY
 */
const getAI = () => {
  // 获取 API Key
  let apiKey = (process.env as any).VITE_GEMINI_API_KEY || process.env.API_KEY;
  
  // 字符串清洗与预校验
  if (typeof apiKey === 'string') {
    apiKey = apiKey.trim();
  }

  // 拦截常见的无效占位符
  const isInvalid = !apiKey || 
                    apiKey === "undefined" || 
                    apiKey === "null" || 
                    apiKey === "" || 
                    apiKey === "process.env.API_KEY";

  if (isInvalid) {
    console.error("[GeminiService] API Key 状态异常:", { apiKey });
    throw new Error("API_KEY_MISSING");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const analyzeProfile = async (profile: UserProfile): Promise<AnalysisResult> => {
  console.log("[GeminiService] 正在启动 AI 简历建模...");
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error("[GeminiService] analyzeProfile Error:", error);
    throw error;
  }
};

export const searchAndMatchJobs = async (profile: UserProfile, analysis: AnalysisResult, excludeTitles: string[] = []): Promise<JobMatch[]> => {
  console.log("[GeminiService] 正在全网检索实时岗位（目标：10个）...");
  try {
    const ai = getAI();
    const excludePart = excludeTitles.length > 0 ? `请避开以下已检索过的职位：${excludeTitles.join('、')}` : "";
    
    const prompt = `
      作为资深猎头，利用 Google Search 实时确认当前在招的岗位。
      用户背景：${analysis.summary}
      求职期望：${profile.expectations}
      ${excludePart}
      
      要求：
      1. 必须一次性返回正好 10 个最匹配的岗位。
      2. 每个岗位必须包含真实链接（招聘平台、公司官网等）。
      3. 在 reason 字段中，必须包含“已找到 X 条高度相关经历”字样。
      4. 结果请翻译为中文。
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

    const rawText = response.text || '[]';
    let results: JobMatch[] = JSON.parse(rawText);
    
    // 强制截取 10 条，确保 UI 体验一致
    return results.filter(job => job.url).slice(0, 10);
  } catch (error: any) {
    console.error("[GeminiService] searchAndMatchJobs Error:", error);
    if (error.message?.includes("JSON")) throw new Error("AI_RESPONSE_PARSE_FAILED");
    throw error;
  }
};

export const getOptimizationDiagnosis = async (resumeText: string, job: JobMatch): Promise<OptimizationDiagnosis> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `对比岗位 "${job.title} @ ${job.company}" 与简历。
JD：${job.jdSummary}
简历：${resumeText.substring(0, 3000)}`,
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
  } catch (error) {
    throw error;
  }
};

export const getDeepOptimizationSteps = async (resumeText: string, job: JobMatch): Promise<OptimizationStep[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `简历深度优化建议。职位："${job.title} @ ${job.company}"。
简历原文：${resumeText.substring(0, 3000)}`,
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
  } catch (error) {
    throw error;
  }
};
