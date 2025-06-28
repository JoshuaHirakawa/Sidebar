import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load the system design interview prompt
const loadPrompt = () => {
  try {
    const promptPath = path.join(__dirname, '../../system_design_interview_prompt.md');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('Error loading prompt file:', error);
    return 'You are a senior staff engineer conducting a system design interview.';
  }
};

const SYSTEM_PROMPT = loadPrompt();

class AIService {
  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
  }

  /**
   * Generate AI response for system design interview
   * @param {Array} messages - Array of conversation messages
   * @param {Object} boardContext - Current board state (nodes and edges)
   * @returns {Promise<Object>} AI response
   */
  async generateInterviewResponse(messages, boardContext = null) {
    try {
      // Prepare messages array with system prompt
      const conversationMessages = [
        {
          role: 'system',
          content: this._buildSystemPrompt(boardContext)
        },
        ...messages
      ];

      // Add board context to the last user message if available
      if (boardContext && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          conversationMessages[conversationMessages.length - 1] = {
            ...lastMessage,
            content: `${lastMessage.content}\n\nBoard Context: ${JSON.stringify(boardContext, null, 2)}`
          };
        }
      }

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: conversationMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        // Enable streaming for better UX (optional)
        stream: false,
      });

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
        model: this.model
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Handle different types of errors
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: 'API quota exceeded. Please check your OpenAI account.',
          code: 'QUOTA_EXCEEDED'
        };
      }
      
      if (error.code === 'invalid_api_key') {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI configuration.',
          code: 'INVALID_API_KEY'
        };
      }

      return {
        success: false,
        error: 'AI service temporarily unavailable. Please try again.',
        code: 'SERVICE_ERROR'
      };
    }
  }

  /**
   * Build system prompt with board context
   * @param {Object} boardContext - Current board state
   * @returns {string} Enhanced system prompt
   */
  _buildSystemPrompt(boardContext) {
    let prompt = SYSTEM_PROMPT;
    
    if (boardContext) {
      prompt += `\n\nCurrent Board Context:\n${JSON.stringify(boardContext, null, 2)}`;
    }
    
    return prompt;
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    try {
      await openai.models.list();
      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>}
   */
  async getAvailableModels() {
    try {
      const models = await openai.models.list();
      return models.data.filter(model => 
        model.id.includes('gpt') || model.id.includes('claude')
      );
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

export default new AIService(); 