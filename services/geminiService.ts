import { GoogleGenAI } from "@google/genai";
import { Point, PointType } from "../types";

/**
 * Sends the image and point prompts to Gemini to perform semantic segmentation/extraction.
 */
export const segmentImage = async (
  imageBase64: string,
  points: Point[]
): Promise<string> => {
  // Initialize Gemini Client inside the function to ensure we use the latest API_KEY
  // from the environment (which might be updated by window.aistudio.openSelectKey)
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please select a key.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use 'gemini-2.5-flash-image' which is generally available on the free tier.
  // This model is capable of image editing and following segmentation instructions.
  const model = "gemini-2.5-flash-image";

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
       - The background MUST be pure WHITE (RGB 255,255,255) or Transparent if supported.
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
         // Do not set responseMimeType or responseSchema for image generation models
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      // Iterate through all parts to find the image part
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image was returned by the model. Please try adjusting your points.");

  } catch (error: any) {
    console.error("Gemini Segmentation Error:", error);
    // Provide more specific error messages for common issues
    if (error.message?.includes("403") || error.status === "PERMISSION_DENIED" || error.code === 403) {
        throw new Error("Permission Denied. Please ensure your API Key is valid. If using a free key, ensure it is active in Google AI Studio.");
    }
    if (error.message?.includes("400") || error.status === "INVALID_ARGUMENT") {
        throw new Error("Invalid Request. The image might be too large or the format unsupported.");
    }
    throw new Error(error.message || "Failed to segment image.");
  }
};