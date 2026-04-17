const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY); // reuse same client used elsewhere

/** Vietnamese vulgar / banned words – checked before calling Gemini. Must be lowercase. */
const BANNED_WORDS = [
  "cứt",
  "đéo",
  "địt",
  "đụ",
  "lồn",
  "cặc",
  "buồi",
  "chó chết",
  "mẹ mày",
  "con mẹ",
  "đmm",
  "clgt",
  "clgbt",
  "vl ",
  " vl",
  "vl.",
  "vcl",
  "vkl",
  "dm ",
  " dm",
  "đm ",
  " đm",
  "fuck",
  "shit",
  "dick",
  "asshole",
  "bitch",
];

/**
 * Check if content contains any banned word (case-insensitive, normalized).
 * @param {string} content
 * @returns {{ banned: boolean, word?: string }}
 */
const containsBannedWord = (content) => {
  if (typeof content !== "string") return { banned: false };
  const normalized = content.toLowerCase().trim();
  for (const word of BANNED_WORDS) {
    if (normalized.includes(word)) return { banned: true, word };
  }
  return { banned: false };
};

/**
 * Escape user content for safe use in prompt (avoid prompt injection / broken JSON).
 * @param {string} raw - Raw comment content
 * @returns {string}
 */
const escapeForPrompt = (raw) => {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
};

/**
 * Phân tích nội dung comment: blocklist trước, sau đó Gemini AI.
 * Chính sách khi API lỗi: fail-open (cho phép đăng) để tránh chặn oan khi hệ thống lỗi.
 * @param {string} content - Nội dung comment cần phân tích
 * @returns {Promise<{toxicity_score: number, reason: string, isFailOpen?: boolean}>}
 */
const analyzeCommentToxicity = async (content) => {
  const raw = typeof content === "string" ? content : "";

  // Blocklist: từ thô tục tiếng Việt/Anh → từ chối ngay, không gọi Gemini
  const banned = containsBannedWord(raw);
  if (banned.banned) {
    return {
      toxicity_score: 0.95,
      reason: "Nội dung chứa từ ngữ không phù hợp",
    };
  }

  const timeoutMs = 5000; // 5 giây timeout

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error("Gemini API timeout"));
      }, timeoutMs)
    );

    const safeContent = escapeForPrompt(raw);

    // Prompt cho Gemini – yêu cầu nghiêm với từ tục tĩu
    const prompt = `Phân tích độ độc hại của bình luận sau đây. Trả về JSON với cấu trúc:
{
  "toxicity_score": số từ 0 đến 1 (0 = không độc hại, 1 = cực kỳ độc hại),
  "reason": "Giải thích ngắn gọn"
}

Tiêu chí đánh giá (áp dụng nghiêm, đặc biệt tiếng Việt):
- Từ tục tĩu, thô tục (ví dụ: cứt, chửi bậy, từ nhạy cảm) -> toxicity_score >= 0.8 (reject)
- Xúc phạm, kỳ thị, bôi nhọc -> score cao
- Nội dung tình dục, bạo lực -> score cao
- Spam, quảng cáo không liên quan -> score vừa
- Bình luận lịch sự -> score thấp

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.

Bình luận: "${safeContent}"`;

    // Gọi Gemini API với timeout bằng thư viện @google/genai
    const modelPromise = (async () => {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // model working as seen elsewhere
        contents: prompt,
      });

      // thư viện trả về text ở nhiều vị trí, ưu tiên result.text
      return (
        result.text ||
        result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        ""
      );
    })();

    const response = await Promise.race([modelPromise, timeoutPromise]);

    // Validate và parse JSON response
    // Extract JSON snippet from response if model injects extra text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON format from Gemini: " + response);
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Validate cấu trúc response
    if (
      typeof parsedResponse.toxicity_score !== "number" ||
      parsedResponse.toxicity_score < 0 ||
      parsedResponse.toxicity_score > 1
    ) {
      throw new Error("Invalid toxicity_score value");
    }

    if (typeof parsedResponse.reason !== "string") {
      throw new Error("Invalid reason field");
    }

    return {
      toxicity_score: parsedResponse.toxicity_score,
      reason: parsedResponse.reason,
    };
  } catch (error) {
    // Fail-open strategy: Nếu Gemini lỗi, cho phép comment đăng (approved)
    console.error("Gemini moderation error:", error.message);
    console.warn("Falling back to automatic approval due to Gemini error");

    return {
      toxicity_score: 0, // Default: không độc hại
      reason: "Skipped due to API error",
      isFailOpen: true, // Flag để biết là fail-open
    };
  }
};

/**
 * Xác định trạng thái moderation dựa vào toxicity score
 * @param {number} toxicity_score - Điểm độc hại
 * @returns {string} moderation_status ('approved', 'hidden', 'rejected')
 */
const getModerationStatus = (toxicity_score) => {
  if (toxicity_score < 0.5) {
    return "approved";
  } else if (toxicity_score < 0.8) {
    return "hidden";
  } else {
    return "rejected";
  }
};

module.exports = {
  analyzeCommentToxicity,
  getModerationStatus,
};
