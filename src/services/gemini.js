import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);

// Initialize Gemini 2.0 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const extractDataFromReceipt = async (imageFile) => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    const prompt = `
    Analyze this receipt/bill image and extract the following information in JSON format:
    {
      "amount": "total amount as number",
      "date": "date in YYYY-MM-DD format",
      "merchant": "merchant/store name",
      "category": "predicted category from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Education, Business, Other",
      "items": ["list of purchased items if visible"],
      "confidence": "confidence score between 0 and 1"
    }
    
    If any field cannot be determined, return null for that field.
    Predict the most appropriate category based on the merchant name and items purchased.
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
    Generate a concise, professional expense description based on:
    - Amount: $${amount}
    - Category: ${category}
    - Merchant: ${merchant}
    - Items: ${items.join(', ')}
    
    Create a description that would be suitable for expense tracking/accounting.
    Keep it under 50 characters and professional.
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