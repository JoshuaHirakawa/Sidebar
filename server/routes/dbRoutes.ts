import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// Project routes
router.post('/projects', async (req, res) => {
  try {
    const { name, description, is_public = false } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (name, description, is_public, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, is_public, req.body.user_id || '00000000-0000-0000-0000-000000000000'] // Default user for now
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Component routes
router.post('/components', async (req, res) => {
  try {
    const { project_id, component_type, name, position_x, position_y, properties } = req.body;
    const result = await pool.query(
      'INSERT INTO components (project_id, component_type, name, position_x, position_y, properties) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, component_type, name, position_x, position_y, properties || {}]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

router.get('/components/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('SELECT * FROM components WHERE project_id = $1', [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

router.put('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position_x, position_y, properties } = req.body;
    const result = await pool.query(
      'UPDATE components SET name = $1, position_x = $2, position_y = $3, properties = $4 WHERE id = $5 RETURNING *',
      [name, position_x, position_y, properties, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

router.delete('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM components WHERE id = $1', [id]);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// Connection routes
router.post('/connections', async (req, res) => {
  try {
    const { project_id, source_component_id, target_component_id, connection_type, properties } = req.body;
    const result = await pool.query(
      'INSERT INTO connections (project_id, source_component_id, target_component_id, connection_type, properties) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, source_component_id, target_component_id, connection_type || 'default', properties || {}]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.get('/connections/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('SELECT * FROM connections WHERE project_id = $1', [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Chat routes
router.post('/chat-sessions', async (req, res) => {
  try {
    const { project_id, user_id } = req.body;
    const result = await pool.query(
      'INSERT INTO chat_sessions (project_id, user_id) VALUES ($1, $2) RETURNING *',
      [project_id, user_id || '00000000-0000-0000-0000-000000000000']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

router.post('/chat-messages', async (req, res) => {
  try {
    const { session_id, role, content } = req.body;
    const result = await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [session_id, role, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ error: 'Failed to create chat message' });
  }
});

router.get('/chat-messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Scratch pad routes
router.post('/scratch-notes', async (req, res) => {
  try {
    const { project_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO scratch_notes (project_id, content) VALUES ($1, $2) RETURNING *',
      [project_id, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating scratch note:', error);
    res.status(500).json({ error: 'Failed to create scratch note' });
  }
});

router.get('/scratch-notes/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('SELECT * FROM scratch_notes WHERE project_id = $1 ORDER BY updated_at DESC', [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scratch notes:', error);
    res.status(500).json({ error: 'Failed to fetch scratch notes' });
  }
});

router.put('/scratch-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const result = await pool.query(
      'UPDATE scratch_notes SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scratch note:', error);
    res.status(500).json({ error: 'Failed to update scratch note' });
  }
});

export default router; 