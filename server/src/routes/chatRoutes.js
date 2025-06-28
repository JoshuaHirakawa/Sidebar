import express from 'express';
import rateLimit from 'express-rate-limit';
import chatController, { 
  validateCreateSession, 
  validateSendMessage 
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for chat endpoints
const chatRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all chat routes
router.use(chatRateLimit);

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new chat session
 * @access  Private
 */
router.post('/sessions', validateCreateSession, chatController.createSession);

/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Get chat session with messages
 * @access  Private
 */
router.get('/sessions/:sessionId', chatController.getSession);

/**
 * @route   POST /api/chat/sessions/:sessionId/messages
 * @desc    Send a message and get AI response
 * @access  Private
 */
router.post('/sessions/:sessionId/messages', validateSendMessage, chatController.sendMessage);

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a chat session
 * @access  Private
 */
router.delete('/sessions/:sessionId', chatController.deleteSession);

/**
 * @route   GET /api/chat/projects/:projectId/sessions
 * @desc    Get all chat sessions for a project
 * @access  Private
 */
router.get('/projects/:projectId/sessions', chatController.getProjectSessions);

/**
 * @route   GET /api/chat/projects/:projectId/stats
 * @desc    Get chat statistics for a project
 * @access  Private
 */
router.get('/projects/:projectId/stats', chatController.getProjectStats);

/**
 * @route   GET /api/chat/health
 * @desc    Check AI service health
 * @access  Private
 */
router.get('/health', chatController.checkHealth);

export default router; 