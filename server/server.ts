import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import openaiRoutes from './routes/openaiRoutes';
import dbRoutes from './routes/dbRoutes';
import './db/connection'; // Initialize database connection
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Use openaiRoutes for all API requests
app.use('/api', openaiRoutes);

// Use database routes
app.use('/api/db', dbRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
