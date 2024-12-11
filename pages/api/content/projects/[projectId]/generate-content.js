// pages/api/content/projects/[projectId]/generate-content.js

import pool from '../../../../../lib/db';
import axios from 'axios';
import { appendLog } from '../../../../../lib/logs'; // Adjust path as needed


export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method === 'POST') {
    const { entry_id } = req.body;

    // Validate the request payload
    if (!entry_id) {
      return res.status(400).json({ message: 'Invalid request payload. "entry_id" is required.' });
    }

    try {
      // Fetch the entry data
     // appendLog(entry_id, 'Fetching entry from DB...');
      const [entryRows] = await pool.query('SELECT * FROM entries WHERE entry_id = ?', [entry_id]);
      const entry = entryRows[0];
     // appendLog(entry_id, `Entry fetched: ${JSON.stringify(entry)}`);

      //console.log(entry);

      if (!entry) {
        return res.status(404).json({ message: 'Entry not found.' });
      }

      // Fetch the project data
     // appendLog(entry_id, 'Fetching project from DB...');
      const [projectRows] = await pool.query('SELECT * FROM projects WHERE project_id = ?', [projectId]);
      const project = projectRows[0];
     // appendLog(entry_id, `Project fetched: ${JSON.stringify(project)}`);


      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      // Fetch the prompt template based on page_type and content_type
      const [promptRows] = await pool.query(
        'SELECT prompt_text FROM prompts WHERE page_type = ? AND content_type = ?',
        [entry.page_type, entry.content_type]
      );

      if (promptRows.length === 0) {
        return res.status(404).json({ message: 'No prompt found for this Page Type and Content Type combination.' });
      }

      const promptTemplate = promptRows[0].prompt_text;
   //   console.log("Original Prompt Template:", promptTemplate);
    //  appendLog(entry_id, `Original Prompt Template: ${promptTemplate}`);

      // Fetch global variables with their prompt_text
      const [globalVarRows] = await pool.query(
        "SELECT variable_name, prompt_text FROM prompts WHERE prompt_type = 'Global Variable'"
      );

      const globalVariables = {};

      // Iterate over global variables and assign their prompt_text directly
      for (const row of globalVarRows) {
        const varName = row.variable_name; // e.g., '{url}'
        const varValue = row.prompt_text ? row.prompt_text.trim() : '';

        if (varValue) {
          globalVariables[varName] = varValue;
        } else {
          console.warn(`No value found for variable "${varName}". Using empty string as fallback.`);
          globalVariables[varName] = '';
        }
      }

     // console.log('Global Variables:', globalVariables);
console.log("-----");
      // Replace placeholders in the prompt with actual data, handling nested placeholders
      const prompt = replacePlaceholders(promptTemplate, project, entry, globalVariables);
    //  console.log("Final Prompt after Replacement:", prompt);
      appendLog(entry_id, `Final Prompt after Replacement: ${prompt}`);


      // Call the AI API to generate content
      const aiResponse = await runPrompt(prompt);

      if (!aiResponse) {
        return res.status(500).json({ message: 'Error generating content from AI.' });
      }

      // Save the generated content to the database
      await pool.query('UPDATE entries SET generated_content = ? WHERE entry_id = ?', [
        aiResponse, // aiResponse is now a string
        entry_id,
      ]);

      // Respond with the AI-generated content
      res.status(200).json({ data: aiResponse });
    } catch (error) {
      appendLog(entry_id, `Error: ${error.message}`);

      console.error('Error generating content:', error);
      res.status(500).json({ message: 'Internal server error while generating content.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to perform recursive placeholder replacement
function recursiveReplacePlaceholders(template, replacements, maxIterations = 2) {
  let prompt = template;
  let iteration = 0;
  const placeholderPattern = /{[^}]+}/g;

  while (iteration < maxIterations) {
    const matches = prompt.match(placeholderPattern);
    if (!matches) break; // No more placeholders to replace

    let replacedInThisIteration = false;

    matches.forEach((placeholder) => {
      if (replacements.hasOwnProperty(placeholder)) {
        prompt = prompt.split(placeholder).join(replacements[placeholder]);
        replacedInThisIteration = true;
      }
    });

    if (!replacedInThisIteration) {
      // No replacements were made in this iteration, exit to prevent infinite loop
      break;
    }

    iteration++;
  }

  // After replacements, check for any unreplaced placeholders
  const unreplaced = prompt.match(placeholderPattern);
  if (unreplaced) {
    console.warn('Unreplaced placeholders found in prompt:', unreplaced);
  }

  return prompt;
}

// Updated replacePlaceholders function
function replacePlaceholders(template, project, entry, globalVariables = {}) {
  // Prepare the replacements object with project and entry data
  const replacements = {
    '{url}': entry.url || '',
    '{business_name}': project.business_name || '',
    '{phone_number}': project.phone_number || '',
    '{physical_location}': project.physical_location || '',
    '{services_products}': project.services_products || '',
    '{primary_usp}': project.primary_usp || '',
    '{secondary_usp}': project.secondary_usp || '',
    '{reference_content}': project.reference_content || '',
    '{home_content}': project.home_content || '',
    '{about_us_content}': project.about_us_content || '',
    '{target_locations}': project.target_locations || '',
    '{language}': project.language || '',
    '{primary_cta}': project.primary_cta || '',
    '{secondary_cta}': project.secondary_cta || '',
    '{trust_signals}': project.trust_signals || '',
    '{awards_accreditations}': project.awards_accreditations || '',
    '{additional_notes}': project.additional_notes || '',
    '{word_count}': entry.word_count || '',
    '{other_primary_keywords}': project.other_primary_keywords || '',
    '{other_secondary_keywords}': project.other_secondary_keywords || '',
    '{page_type}': entry.page_type || '',
    '{content_type}': entry.content_type || '',


    '{existing_content}': entry.existing_content || '',
    '{primary_keyword}': entry.primary_keyword || '',
    '{secondary_keyword}': entry.secondary_keyword || '',
    '{topic_cluster}': entry.topic_cluster || '',
    '{lsi_terms}': entry.lsi_terms || '',
    '{paa_terms}': entry.paa_terms || '',
    '{brand_terms}': entry.brand_terms || '',
    '{existing_product_info}': entry.existing_product_info || '',
    '{additional_keywords}': Array.isArray(entry.additional_keywords)
      ? entry.additional_keywords.join(', ')
      : entry.additional_keywords || '',
    // Add more placeholders and their replacements as needed


  };

  // **Merge Global Variables Correctly**
  Object.entries(globalVariables).forEach(([key, value]) => {
    replacements[`{${key}}`] = value || '';
  });

  //console.log('Replacements:', replacements);

  // **Perform Recursive Replacement**
  const finalPrompt = recursiveReplacePlaceholders(template, replacements);

  return finalPrompt;
}

// Helper function to call the AI API (Anthropic's Claude)
async function runPrompt(prompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY;

  const data = {
   // model: 'claude-3-5-opus-20241022', // Replace with the model you have access to
    model: 'claude-3-opus-20240229',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    //max_tokens: 8000,
    max_tokens: 4096,
    temperature: 1.0,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'anthropic-version': '2023-06-01', // Update to the version you're using
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });

    const assistantMessage = response.data;

    if (!assistantMessage || !assistantMessage.content) {
      console.error('Invalid response from Claude API:', assistantMessage);
      return null;
    }

    // Check if content is an array
    if (Array.isArray(assistantMessage.content)) {
      // Concatenate all text parts
      const text = assistantMessage.content.map(part => part.text).join('\n');
      return text;
    }

    // If content is a string
    if (typeof assistantMessage.content === 'string') {
      return assistantMessage.content;
    }

    // Unexpected structure
    console.error('Unexpected content structure:', assistantMessage.content);
    return null;
  } catch (error) {
    console.error('Error calling Claude API:', error.response ? error.response.data : error);
    return null;
  }
}
