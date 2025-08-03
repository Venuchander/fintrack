import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);

// Initialize Gemini 2.0 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
          data: base64Image.split(',')[1], 
          mimeType: imageFile.type
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse OCR response');
    }
    
  } catch (error) {
    console.error('Gemini OCR Error:', error);
    throw new Error('Failed to process receipt with AI');
  }
};

export const generateExpenseDescription = async (amount, category, merchant, items = []) => {
  try {
    const prompt = `
    Generate a concise and professional expense description suitable for expense tracking or accounting.

    Input:
    - Amount: ₹${amount}
    - Category: ${category}
    - Merchant: ${merchant}
    - Items: ${items.join(', ')}

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
    console.error('Description generation error:', error);
    throw new Error('Failed to generate description');
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};