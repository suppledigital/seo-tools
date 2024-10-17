const express = require('express');
const pool = require('../db'); // Adjust this to your database configuration file
const router = express.Router();
const axios = require('axios');


// Fetch projects
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects');
    res.json({ projects: rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Add new project
router.post('/add', async (req, res) => {
  const { project_name } = req.body;
  try {
    await pool.query('INSERT INTO projects (project_name) VALUES (?)', [project_name]);
    res.status(201).json({ message: 'Project added' });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Error adding project' });
  }
});

// GET /server-api/projects/:projectId
router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
  
    try {
      const [projectRows] = await pool.query(
        'SELECT * FROM projects WHERE project_id = ?',
        [projectId]
      );
      const project = projectRows[0];
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      if (project.initialised) {
        const [entryRows] = await pool.query(
          'SELECT * FROM entries WHERE project_id = ?',
          [projectId]
        );
        return res.status(200).json({ project, entries: entryRows });
      }
  
      return res.status(200).json({ project });
    } catch (error) {
      console.error('Error fetching project data:', error);
      res.status(500).json({ message: 'Error fetching project data' });
    }
  });
  // POST /server-api/projects/:projectId/save-data
router.post('/:projectId/save-data', async (req, res) => {
  console.log("Here");
    const { projectId } = req.params;
    const { data } = req.body;
  
    try {
      // Process data and insert into entries table
      await processDataAndSave(projectId, data);
  
      // Update project's initialized status
      await pool.query('UPDATE projects SET initialised = 1 WHERE project_id = ?', [projectId]);
  
      res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ message: 'Error saving data' });
    }
  });

  // Fetch prompt by ID
router.get('/prompts/:promptId', async (req, res) => {
  console.log("Here    Fetch prompt by ID");

  const { promptId } = req.params;

  try {
    const [promptRows] = await pool.query(
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    if (promptRows.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    res.status(200).json({ prompt: promptRows[0] });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ message: 'Error fetching prompt' });
  }
});
// POST /server-api/projects/:projectId/run-prompt
router.post('/:projectId/run-prompt', async (req, res) => {
  const { projectId } = req.params;
  const { promptId, urls } = req.body;

  try {
    // Fetch the prompt from the database
    const [promptRows] = await pool.query(
      'SELECT prompt_text FROM prompts WHERE id = ?',
      [promptId]
    );

    if (promptRows.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    const promptText = promptRows[0].prompt_text;
    const urlList = urls.join('\n');
    const fullPrompt = `${promptText}\n${urlList}`;

    // Call the external API (Claude)
    const response = await runPrompt(fullPrompt);

    if (!response) {
      return res.status(500).json({ message: 'Error calling AI API' });
    }

    res.status(200).json({ data: response });
  } catch (error) {
    console.error('Error running prompt:', error);
    res.status(500).json({ message: 'Error running prompt' });
  }
});

async function runPrompt(prompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY; // Store your API key in an environment variable

  const data = {
    model: 'claude-3-5-sonnet-20240620', // Update to your desired model
    messages: [
      { role: 'user', content: prompt },
    ],
    max_tokens: 8000,
    temperature: 1.0,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });
    const assistantMessage = response.data;

    // The assistant's reply is in assistantMessage.content, which is an array of content blocks
    // We'll extract the text content
    const assistantReply = assistantMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return assistantReply;
  } catch (error) {
    console.error(
      'Error calling Claude API:',
      error.response ? error.response.data : error
    );
    return null;
  }
}
async function runPrompt1(prompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages'; // Update to the correct endpoint
  const apiKey = process.env.CLAUDE_API_KEY; // Store your API key in an environment variable

  const data = {
    //prompt: prompt,
    messages: [
      {"role": "user", "content": prompt}
    ],
    model: 'claude-3-5-sonnet-20240620', // Update to your desired model
    max_tokens: 8000,
    temperature: 1.0,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });
    return response.data.completion;
  } catch (error) {
    console.error('Error calling Claude API:', error.response ? error.response.data : error);
    return null;
  }
}

  
  // Functions for processing data
async function processDataAndSave(project_id, data) {
    // Remove header row if present
    if (data[0][0]?.toLowerCase() === 'url') {
      data.shift();
    }
  
    let currentUrl = null;
    let currentTitle = '';
    let currentDescription = '';
    let keywords = [];
    let emptyKeywordLines = 0;
  
    for (let row of data) {
      const url = row[0]?.trim();
      const keyword = row[1]?.trim();
      const title = row[2]?.trim();
      const description = row[3]?.trim();
  
      if (url) {
        if (currentUrl && keywords.length > 0) {
          // Save previous entry
          await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
        }
        currentUrl = url;
        currentTitle = title;
        currentDescription = description;
        keywords = [];
        emptyKeywordLines = 0;
      }
  
      if (keyword) {
        keywords.push(keyword);
        emptyKeywordLines = 0;
      } else {
        emptyKeywordLines++;
      }
  
      if (emptyKeywordLines >= 2) {
        if (currentUrl && keywords.length > 0) {
          await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
        }
        currentUrl = null;
        currentTitle = '';
        currentDescription = '';
        keywords = [];
        emptyKeywordLines = 0;
      }
    }
  
    // Save any remaining entry
    if (currentUrl && keywords.length > 0) {
      await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
    }
  }
  
  async function saveEntry(project_id, url, title, description, keywords) {
    const primary_keyword = keywords.shift();
    const secondary_keywords = keywords.join(',');
  
    await pool.query(
      'INSERT INTO entries (project_id, url, primary_keyword, secondary_keyword, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, url, primary_keyword, secondary_keywords, title, description]
    );
  }

module.exports = router;
