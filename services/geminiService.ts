import { GoogleGenAI } from "@google/genai";
import { Point, PointType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends the image and point prompts to Gemini to perform semantic segmentation/extraction.
 */
export const segmentImage = async (
  imageBase64: string,
  points: Point[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  // Model selection: gemini-3-pro-image-preview is best for complex image editing/reasoning tasks
  const model = "gemini-3-pro-image-preview";

  const positivePoints = points.filter(p => p.type === PointType.POSITIVE);
  const negativePoints = points.filter(p => p.type === PointType.NEGATIVE);

  // Helper to format points for the prompt
  const formatPoints = (pts: Point[]) => {
    if (pts.length === 0) return "None";
    return pts.map(p => `(x: ${(p.x * 100).toFixed(1)}%, y: ${(p.y * 100).toFixed(1)}%)`).join(", ");
  };

  // Optimized prompt for SAM-like behavior
  const prompt = `
    Act as an advanced Semantic Segmentation engine equivalent to "Segment Anything Model 3" (SAM3).
    
    TASK:
    Extract a specific subject from the provided input image based on user interaction points.
    
    INPUT COORDINATES (Origin: Top-Left):
    - POSITIVE CLICKS (Include/Add): [${formatPoints(positivePoints)}]
    - NEGATIVE CLICKS (Exclude/Subtract): [${formatPoints(negativePoints)}]
    
    STRICT RULES:
    1. **Identification**: Locate the object(s) indicated by POSITIVE clicks. This is your base selection.
    2. **Subtraction**: If NEGATIVE clicks are present, strictly REMOVE that specific semantic region from the selection. 
       - Example: If (+) is on a person and (-) is on their bag, output the person WITHOUT the bag.
       - Example: If (+) is on a table and (-) is on a vase, output the table WITHOUT the vase.
    3. **Output Format**: 
       - Generate an image containing ONLY the final segmented subject.
       - The background MUST be pure WHITE (RGB 255,255,255).
       - Maintain the original resolution and perspective of the object.
       - Ensure high-quality edge detection (clean matte).
  `;

  // Remove header from base64 if present for the API call
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        // gemini-3-pro-image-preview specific configurations can be added here if needed
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image was returned by the model. Please try adjusting your points.");

  } catch (error: any) {
    console.error("Gemini Segmentation Error:", error);
    throw new Error(error.message || "Failed to segment image.");
  }
};