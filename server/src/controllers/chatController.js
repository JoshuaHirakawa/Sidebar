import { body, validationResult } from 'express-validator';
import chatModel from '../models/chatModel.js';
import aiService from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

class ChatController {
  /**
   * Create a new chat session
   * POST /api/chat/sessions
   */
  async createSession(req, res) {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { projectId } = req.body;
      const userId = req.user.id;

      // Create session
      const session = await chatModel.createSession(projectId, userId);

      res.status(201).json({
        success: true,
        data: {
          session: {
            id: session.id,
            projectId: session.project_id,
            userId: session.user_id,
            createdAt: session.created_at
          }
        }
      });

    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat session'
      });
    }
  }

  /**
   * Get chat session with messages
   * GET /api/chat/sessions/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get session
      const session = await chatModel.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }

      // Check ownership
      if (session.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this chat session'
        });
      }

      // Get messages
      const messages = await chatModel.getMessages(sessionId);

      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            projectId: session.project_id,
            userId: session.user_id,
            createdAt: session.created_at
          },
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at
          }))
        }
      });

    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chat session'
      });
    }
  }

  /**
   * Send a message and get AI response
   * POST /api/chat/sessions/:sessionId/messages
   */
  async sendMessage(req, res) {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { content, boardContext } = req.body;
      const userId = req.user.id;

      // Verify session ownership
      const session = await chatModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this chat session'
        });
      }

      // Add user message to database
      const userMessage = await chatModel.addMessage(sessionId, 'user', content);

      // Get conversation history
      const messages = await chatModel.getMessages(sessionId);
      
      // Format messages for AI service
      const conversationMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      const aiResponse = await aiService.generateInterviewResponse(
        conversationMessages,
        boardContext
      );

      if (!aiResponse.success) {
        // Add error message to database
        await chatModel.addMessage(sessionId, 'assistant', 
          `Sorry, I'm having trouble responding right now: ${aiResponse.error}`
        );

        return res.status(500).json({
          success: false,
          error: aiResponse.error,
          code: aiResponse.code
        });
      }

      // Add AI response to database
      const assistantMessage = await chatModel.addMessage(
        sessionId, 
        'assistant', 
        aiResponse.content
      );

      res.json({
        success: true,
        data: {
          userMessage: {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            createdAt: userMessage.created_at
          },
          assistantMessage: {
            id: assistantMessage.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            createdAt: assistantMessage.created_at
          },
          usage: aiResponse.usage,
          model: aiResponse.model
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Get all sessions for a project
   * GET /api/chat/projects/:projectId/sessions
   */
  async getProjectSessions(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const sessions = await chatModel.getSessionsByProject(projectId);

      // Filter sessions by ownership
      const userSessions = sessions.filter(session => session.user_id === userId);

      res.json({
        success: true,
        data: {
          sessions: userSessions.map(session => ({
            id: session.id,
            projectId: session.project_id,
            userId: session.user_id,
            createdAt: session.created_at
          }))
        }
      });

    } catch (error) {
      console.error('Get project sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project sessions'
      });
    }
  }

  /**
   * Delete a chat session
   * DELETE /api/chat/sessions/:sessionId
   */
  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Verify session ownership
      const session = await chatModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this chat session'
        });
      }

      const deleted = await chatModel.deleteSession(sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }

      res.json({
        success: true,
        message: 'Chat session deleted successfully'
      });

    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat session'
      });
    }
  }

  /**
   * Get chat statistics for a project
   * GET /api/chat/projects/:projectId/stats
   */
  async getProjectStats(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const stats = await chatModel.getProjectStats(projectId);

      res.json({
        success: true,
        data: {
          stats: {
            totalSessions: parseInt(stats.total_sessions) || 0,
            totalMessages: parseInt(stats.total_messages) || 0,
            avgSessionDuration: parseFloat(stats.avg_session_duration) || 0
          }
        }
      });

    } catch (error) {
      console.error('Get project stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project statistics'
      });
    }
  }

  /**
   * Validate AI service configuration
   * GET /api/chat/health
   */
  async checkHealth(req, res) {
    try {
      const isApiKeyValid = await aiService.validateApiKey();
      const availableModels = await aiService.getAvailableModels();

      res.json({
        success: true,
        data: {
          aiService: {
            status: isApiKeyValid ? 'healthy' : 'unhealthy',
            apiKeyValid: isApiKeyValid,
            availableModels: availableModels.map(model => model.id)
          }
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }
}

// Validation rules
export const validateCreateSession = [
  body('projectId').isUUID().withMessage('Valid project ID required')
];

export const validateSendMessage = [
  body('content').isString().trim().isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('boardContext').optional().isObject()
    .withMessage('Board context must be an object')
];

export default new ChatController(); 