import OpenAI from 'openai';
import pool from '../../../../lib/db'; // Ensure the correct path to your database connection

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { queryType, selectedResponse, projectId } = req.body;

  // Validate input
  if (!queryType || !selectedResponse || !projectId) {
    return res.status(400).json({
      error: 'queryType, selectedResponse, and projectId are required',
    });
  }

  try {
    // Log the training process with OpenAI (optional)
    const trainingPrompt = `
You are a model trainer. Use the following response to train the model for future predictions.

Query Type: ${queryType}
Selected Response:
${selectedResponse}
`;

    // Optional: Call OpenAI's completion to log or validate the training data
    await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: trainingPrompt }],
      temperature: 0, // For deterministic behavior
    });

    // Save the selected response to the database as part of the training data
    const sql = `
      INSERT INTO training_data (project_id, query_type, response, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const values = [projectId, queryType, selectedResponse];

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      throw new Error('Failed to insert training data into the database.');
    }

    res.status(200).json({ status: 'success', message: 'Model updated successfully.' });
  } catch (error) {
    console.error('Error updating model:', error.message || error);
    res.status(500).json({ error: 'An error occurred while updating the model.' });
  }
}
