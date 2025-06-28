import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class ChatModel {
  /**
   * Create a new chat session
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created session
   */
  async createSession(projectId, userId) {
    try {
      const sessionId = uuidv4();
      const result = await query(
        'INSERT INTO chat_sessions (id, project_id, user_id) VALUES ($1, $2, $3) RETURNING *',
        [sessionId, projectId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  /**
   * Get chat session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data
   */
  async getSession(sessionId) {
    try {
      const result = await query(
        'SELECT * FROM chat_sessions WHERE id = $1',
        [sessionId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to get chat session');
    }
  }

  /**
   * Get all sessions for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Sessions
   */
  async getSessionsByProject(projectId) {
    try {
      const result = await query(
        'SELECT * FROM chat_sessions WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting project sessions:', error);
      throw new Error('Failed to get project sessions');
    }
  }

  /**
   * Add a message to a chat session
   * @param {string} sessionId - Session ID
   * @param {string} role - Message role (user/assistant/system)
   * @param {string} content - Message content
   * @returns {Promise<Object>} Created message
   */
  async addMessage(sessionId, role, content) {
    try {
      const messageId = uuidv4();
      const result = await query(
        'INSERT INTO chat_messages (id, session_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [messageId, sessionId, role, content]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  /**
   * Get all messages for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Messages
   */
  async getMessages(sessionId) {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Add multiple messages in a transaction
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Array of message objects
   * @returns {Promise<Array>} Created messages
   */
  async addMessagesBatch(sessionId, messages) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const createdMessages = [];
      
      for (const message of messages) {
        const messageId = uuidv4();
        const result = await client.query(
          'INSERT INTO chat_messages (id, session_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *',
          [messageId, sessionId, message.role, message.content]
        );
        createdMessages.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdMessages;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding messages batch:', error);
      throw new Error('Failed to add messages batch');
    } finally {
      client.release();
    }
  }

  /**
   * Delete a chat session and all its messages
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Delete messages first (due to foreign key constraint)
      await client.query(
        'DELETE FROM chat_messages WHERE session_id = $1',
        [sessionId]
      );
      
      // Delete session
      const result = await client.query(
        'DELETE FROM chat_sessions WHERE id = $1 RETURNING id',
        [sessionId]
      );
      
      await client.query('COMMIT');
      return result.rows.length > 0;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    } finally {
      client.release();
    }
  }

  /**
   * Get chat statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Statistics
   */
  async getProjectStats(projectId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(DISTINCT cs.id) as total_sessions,
          COUNT(cm.id) as total_messages,
          AVG(session_duration.minutes) as avg_session_duration
        FROM chat_sessions cs
        LEFT JOIN chat_messages cm ON cs.id = cm.session_id
        LEFT JOIN (
          SELECT 
            session_id,
            EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as minutes
          FROM chat_messages 
          GROUP BY session_id
        ) session_duration ON cs.id = session_duration.session_id
        WHERE cs.project_id = $1
      `, [projectId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw new Error('Failed to get project statistics');
    }
  }
}

export default new ChatModel(); 