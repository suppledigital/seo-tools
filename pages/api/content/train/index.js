import OpenAI from 'openai';

// Initialize OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is correctly set in your environment variables
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { queryType, projectId } = req.body;

  // Validate inputs
  if (!queryType || !projectId) {
    return res.status(400).json({ error: 'queryType and projectId are required' });
  }

  try {
    // Example prompt structure for training model
    const prompt = `
You are a content generation AI specializing in ${queryType}. Generate sample content for project ID ${projectId}.
`;

    // Call OpenAI's chat completions endpoint
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Specify the model you are using
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, // Adjust based on creativity needed
      max_tokens: 500, // Adjust token limit based on requirements
    });

    const samples = response.choices.map((choice) => choice.message.content.trim());

    res.status(200).json({ samples });
  } catch (error) {
    console.error('Error generating samples:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'OpenAI API error',
      });
    }

    res.status(500).json({ error: 'An internal server error occurred' });
  }
}
