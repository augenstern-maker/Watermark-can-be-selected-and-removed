import { GoogleGenAI } from "@google/genai";
import { ProcessedImageResult } from "../types";

// Helper to convert File to Base64 and detect aspect ratio
const processFile = (file: File): Promise<{ base64Data: string; mimeType: string; aspectRatio: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;
        
        // Determine closest supported aspect ratio
        // Supported: "1:1", "3:4", "4:3", "9:16", "16:9"
        const supportedRatios: Record<string, number> = {
          "1:1": 1,
          "3:4": 0.75,
          "4:3": 1.33,
          "9:16": 0.5625,
          "16:9": 1.7778
        };

        let closestRatio = "1:1";
        let minDiff = Infinity;

        for (const [key, val] of Object.entries(supportedRatios)) {
          const diff = Math.abs(ratio - val);
          if (diff < minDiff) {
            minDiff = diff;
            closestRatio = key;
          }
        }
        
        resolve({ base64Data, mimeType: file.type || 'image/png', aspectRatio: closestRatio });
      };
      img.onerror = () => reject(new Error("Failed to load image dimensions"));
      img.src = result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const removeWatermark = async (file: File, maskBase64?: string | null): Promise<ProcessedImageResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const { base64Data, mimeType, aspectRatio } = await processFile(file);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ];

    let prompt = "Edit this image to completely remove any watermarks, text overlays, logos, or copyright stamps. Reconstruct the background seamlessly to match the surrounding area. Output ONLY the modified image.";

    if (maskBase64) {
      // If a mask is provided, add it to parts and update prompt
      // maskBase64 is expected to be the raw base64 string (without data prefix if possible, or stripped here)
      const cleanMask = maskBase64.includes(',') ? maskBase64.split(',')[1] : maskBase64;
      
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanMask
        }
      });

      // Strict prompt for masked editing
      prompt = `TASK: Targeted Image Inpainting.
INPUTS: 
1. Source Image (First image)
2. Mask Image (Second image: White = Edit, Black = Protect)

INSTRUCTIONS:
1. Use the second image as a STRICT mask.
2. REMOVE watermarks, text, or objects found specifically inside the WHITE areas of the mask.
3. CRITICAL: Do NOT modify any pixels in the BLACK areas of the mask. The non-selected areas must remain pixel-perfectly identical to the original Source Image.
4. Seamlessly fill the removed areas to match the surrounding background texture and lighting.
5. Output the result as a single image.`;
    }

    parts.push({ text: prompt });

    // We use gemini-2.5-flash-image for efficient image editing/generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    // Iterate through parts to find the image output
    const responseParts = response.candidates?.[0]?.content?.parts;
    
    if (!responseParts) {
      throw new Error("No content generated from the model.");
    }

    let imageBase64: string | undefined;
    
    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        imageBase64 = part.inlineData.data;
        break; 
      }
    }

    if (!imageBase64) {
      // If no image is returned, check if there is text explaining why
      const textPart = responseParts.find(p => p.text);
      if (textPart?.text) {
        const lowerText = textPart.text.toLowerCase();
        if (lowerText.includes("cannot") || lowerText.includes("sorry") || lowerText.includes("policy")) {
             throw new Error("The AI refused to process this image due to safety policies.");
        }
        throw new Error(`Model returned text instead of image: ${textPart.text.substring(0, 100)}...`);
      }
      throw new Error("The model did not return a valid image.");
    }

    return {
      imageUrl: `data:image/png;base64,${imageBase64}`,
      mimeType: 'image/png'
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image.");
  }
};