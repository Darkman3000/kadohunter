
import { GoogleGenAI, Type } from "@google/genai";
import { Card, TCG } from "../types";

// This service handles the interaction with Google Gemini for card recognition
// It adheres to the strict @google/genai coding guidelines.

const MOCK_CARD_TEMPLATES: Partial<Card>[] = [
  {
    name: 'Celestial Dragon',
    set: 'Origins of Light',
    rarity: 'Secret Rare',
    number: '101/099',
    price: 145.50,
    game: TCG.POKEMON,
    imageUrl: 'https://images.unsplash.com/photo-1613771404721-c5b425876d91?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Ancient Golem',
    set: 'Lost Civilizations',
    rarity: 'Ultra Rare',
    number: '045/150',
    price: 22.30,
    game: TCG.YUGIOH,
    imageUrl: 'https://images.unsplash.com/photo-1622218545935-5738e60df725?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Forest Spirit',
    set: 'Nature\'s Wrath',
    rarity: 'Mythic',
    number: '210/300',
    price: 55.00,
    game: TCG.MAGIC_THE_GATHERING,
    imageUrl: 'https://images.unsplash.com/photo-1602626080622-3d232827377f?q=80&w=600&auto=format&fit=crop',
  }
];

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.API_KEY;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.warn("Gemini API Key not found. Service will run in mock mode.");
    }
  }

  private getMockCard(): Partial<Card> {
      const template = MOCK_CARD_TEMPLATES[Math.floor(Math.random() * MOCK_CARD_TEMPLATES.length)];
      return {
        id: crypto.randomUUID(),
        ...template,
        setName: template.set, // compatibility
        usMarketValue: template.price,
        marketTrend: Math.random() > 0.5 ? 'up' : 'stable',
        dateAdded: new Date().toISOString(),
        condition: 'NM',
        isNew: true,
      };
  }

  /**
   * Simulates identifying a card from a base64 image string.
   * In a real scenario with a valid key, this calls gemini-2.5-flash.
   */
  async identifyCard(base64Image: string): Promise<Partial<Card>> {
    if (!this.ai) {
      // Simulate network delay for "Premium" feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      return this.getMockCard();
    }

    try {
      // Using Gemini 2.5 Flash for speed and vision capabilities
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                },
                {
                    text: `Identify this trading card. Return a JSON object with the following fields: 
                    - name (string)
                    - set (string)
                    - rarity (string)
                    - number (string)
                    - estimated_price (number, in USD)
                    - game (string, e.g. Pokemon, Magic: The Gathering, Yu-Gi-Oh!, One Piece)
                    
                    If you cannot identify it clearly, make a best guess based on visual text.`
                }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    set: { type: Type.STRING },
                    rarity: { type: Type.STRING },
                    number: { type: Type.STRING },
                    estimated_price: { type: Type.NUMBER },
                    game: { type: Type.STRING },
                }
            }
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from AI");

      // FIX: Trim whitespace from the response text before parsing as JSON.
      const parsed = JSON.parse(resultText.trim());

      return {
        id: crypto.randomUUID(),
        name: parsed.name || "Unknown Card",
        set: parsed.set || "Unknown Set",
        setName: parsed.set || "Unknown Set",
        rarity: parsed.rarity || "Common",
        number: parsed.number || "---",
        price: parsed.estimated_price || 0,
        usMarketValue: parsed.estimated_price || 0,
        marketTrend: 'stable',
        imageUrl: 'https://picsum.photos/400/600', // In a real app, we'd use the captured frame or a fetched URL
        dateAdded: new Date().toISOString(),
        condition: 'NM',
        game: parsed.game as TCG || TCG.POKEMON,
        isNew: true
      };

    } catch (error: any) {
      // Specific handling for Quota Exceeded
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.code === 429) {
          console.warn("Gemini API Quota Exceeded. Switching to offline mock mode for this request.");
      } else {
          console.error("Gemini Identification Failed:", error);
      }
      
      // Fallback to mock for demo purposes if API fails
      return this.getMockCard();
    }
  }
}

export const geminiService = new GeminiService();
