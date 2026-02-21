import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);

// Initialize Gemini 2.5 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const extractDataFromReceipt = async (imageFile) => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    const prompt = `
    You are an AI assistant. Analyze the following receipt or bill image and extract the relevant information. Return the result in strict JSON format.

    All monetary values are in Indian Rupees (INR), but the "amount" field should be returned as a number only (without the ₹ symbol).

    Return the following JSON:

    {
      "amount": "total amount in rupees as a number (e.g., 1234.56)",
      "date": "date in YYYY-MM-DD format",
      "merchant": "merchant or store name",
      "category": "one of: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Education, Business, Other",
      "items": ["list of purchased items if visible"],
      "confidence": "overall confidence score between 0 and 1"
    }

    If any field is unknown or not visible, return null for that field.
    Predict the most likely category using the merchant name and item names.
    Return only the JSON. Do not include any explanation or notes.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: imageFile.type,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not parse OCR response");
    }
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Failed to process receipt with AI");
  }
};

export const generateExpenseDescription = async (
  amount,
  category,
  merchant,
  items = [],
) => {
  try {
    const prompt = `
    Generate a concise and professional expense description suitable for expense tracking or accounting.

    Input:
    - Amount: ₹${amount}
    - Category: ${category}
    - Merchant: ${merchant}
    - Items: ${items.join(", ")}

    Output:
    - A single sentence or phrase (under 50 characters)
    - Must be professional and relevant to the transaction
    - Avoid unnecessary punctuation or symbols
    - Do not include the amount or currency symbol in the output
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Description generation error:", error);
    throw new Error("Failed to generate description");
  }
};

export const parseExpenseFromVoice = async (
  transcript,
  availablePaymentMethods = [],
) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are an AI assistant that extracts expense information from a voice transcription. The transcription may be imperfect due to speech-to-text conversion — use your best judgment.
Today's date is ${today}.

The user said: "${transcript}"

Extract the following fields and return ONLY a valid JSON object (no markdown, no explanation, no code fences):

{
  "amount": "numeric amount as a string (e.g., '500') or null",
  "date": "YYYY-MM-DD format or null. 'today'=${today}, interpret 'yesterday', 'last Monday' etc.",
  "category": "one of: food, transport, shopping, entertainment, health, other. Auto-detect from context or null.",
  "description": "concise expense description under 50 chars. Always generate one.",
  "paymentMethod": "one of: ${["cash", ...availablePaymentMethods].join(", ")} or null"
}

Category hints: food/restaurant/lunch/dinner/snack/grocery → food, cab/auto/bus/train/fuel/petrol/uber/ola → transport, clothes/electronics/amazon/flipkart/mall → shopping, movie/game/netflix/party → entertainment, doctor/medicine/hospital/pharmacy → health.
Payment hints: match keywords like "cash", "UPI", "card", "debit", "credit" to available methods.
Return ONLY the JSON object.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
      },
    });

    const response = result.response;
    let text = response.text();

    // Strip markdown code fences if present
    text = text
      .replace(/```(?:json)?\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Extract JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } else {
      console.error("Gemini voice response (no JSON found):", text);
      throw new Error("Could not parse voice expense response");
    }
  } catch (error) {
    console.error("Voice expense parsing error:", error);
    console.error("Transcript was:", transcript);
    throw new Error("Failed to parse expense from voice");
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
