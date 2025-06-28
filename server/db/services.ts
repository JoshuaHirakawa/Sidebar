import pool from './connection.js';

export interface Project {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Component {
  id: string;
  project_id: string;
  component_type: string;
  name: string;
  position_x: number;
  position_y: number;
  properties: any;
  created_at: Date;
  updated_at: Date;
}

export interface Connection {
  id: string;
  project_id: string;
  source_component_id: string;
  target_component_id: string;
  connection_type: string;
  properties: any;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

export interface ScratchNote {
  id: string;
  project_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// Project services
export const projectService = {
  async create(project: Partial<Project>): Promise<Project> {
    const result = await pool.query(
      'INSERT INTO projects (name, description, is_public, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [project.name, project.description, project.is_public || false, project.user_id || '00000000-0000-0000-0000-000000000000']
    );
    return result.rows[0];
  },

  async getAll(): Promise<Project[]> {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  },

  async getById(id: string): Promise<Project | null> {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
};

// Component services
export const componentService = {
  async create(component: Partial<Component>): Promise<Component> {
    const result = await pool.query(
      'INSERT INTO components (project_id, component_type, name, position_x, position_y, properties) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [component.project_id, component.component_type, component.name, component.position_x, component.position_y, component.properties || {}]
    );
    return result.rows[0];
  },

  async getByProjectId(projectId: string): Promise<Component[]> {
    const result = await pool.query('SELECT * FROM components WHERE project_id = $1', [projectId]);
    return result.rows;
  },

  async update(id: string, updates: Partial<Component>): Promise<Component> {
    const result = await pool.query(
      'UPDATE components SET name = $1, position_x = $2, position_y = $3, properties = $4 WHERE id = $5 RETURNING *',
      [updates.name, updates.position_x, updates.position_y, updates.properties, id]
    );
    return result.rows[0];
  },

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM components WHERE id = $1', [id]);
  }
};

// Connection services
export const connectionService = {
  async create(connection: Partial<Connection>): Promise<Connection> {
    const result = await pool.query(
      'INSERT INTO connections (project_id, source_component_id, target_component_id, connection_type, properties) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [connection.project_id, connection.source_component_id, connection.target_component_id, connection.connection_type || 'default', connection.properties || {}]
    );
    return result.rows[0];
  },

  async getByProjectId(projectId: string): Promise<Connection[]> {
    const result = await pool.query('SELECT * FROM connections WHERE project_id = $1', [projectId]);
    return result.rows;
  }
};

// Chat services
export const chatService = {
  async createSession(session: Partial<ChatSession>): Promise<ChatSession> {
    const result = await pool.query(
      'INSERT INTO chat_sessions (project_id, user_id) VALUES ($1, $2) RETURNING *',
      [session.project_id, session.user_id || '00000000-0000-0000-0000-000000000000']
    );
    return result.rows[0];
  },

  async createMessage(message: Partial<ChatMessage>): Promise<ChatMessage> {
    const result = await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [message.session_id, message.role, message.content]
    );
    return result.rows[0];
  },

  async getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    return result.rows;
  }
};

// Scratch note services
export const scratchNoteService = {
  async create(note: Partial<ScratchNote>): Promise<ScratchNote> {
    const result = await pool.query(
      'INSERT INTO scratch_notes (project_id, content) VALUES ($1, $2) RETURNING *',
      [note.project_id, note.content]
    );
    return result.rows[0];
  },

  async getByProjectId(projectId: string): Promise<ScratchNote[]> {
    const result = await pool.query('SELECT * FROM scratch_notes WHERE project_id = $1 ORDER BY updated_at DESC', [projectId]);
    return result.rows;
  },

  async update(id: string, content: string): Promise<ScratchNote> {
    const result = await pool.query(
      'UPDATE scratch_notes SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );
    return result.rows[0];
  }
}; 