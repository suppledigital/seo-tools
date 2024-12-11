// pages/api/content/projects/[projectId]/generate-content.js

import pool from '../../../../../lib/db';
import axios from 'axios';
import { appendLog } from '../../../../../lib/logs'; // Adjust path if needed

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
      const [entryRows] = await pool.query('SELECT * FROM entries WHERE entry_id = ?', [entry_id]);
      const entry = entryRows[0];

      if (!entry) {
        return res.status(404).json({ message: 'Entry not found.' });
      }

      // Fetch the project data
      const [projectRows] = await pool.query('SELECT * FROM projects WHERE project_id = ?', [projectId]);
      const project = projectRows[0];

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

      let promptTemplate = promptRows[0].prompt_text;

      // Fetch global variables with their prompt_text
      const [globalVarRows] = await pool.query(
        "SELECT variable_name, prompt_text FROM prompts WHERE prompt_type = 'Global Variable'"
      );

      const globalVariables = {};
      for (const row of globalVarRows) {
        const varName = row.variable_name; // e.g., '{url}'
        const varValue = row.prompt_text ? row.prompt_text.trim() : '';
        globalVariables[varName] = varValue;
      }

      // Replace placeholders in the prompt with actual data, handling nested placeholders
      promptTemplate = replacePlaceholders(promptTemplate, project, entry, globalVariables);

      //appendLog(entry_id, `Final Prompt after Replacement: ${promptTemplate}`);

      // Extract system prompt from %%...%%
      let systemPrompt = '';
      const systemRegex = /%%([\s\S]*?)%%/;
      const match = promptTemplate.match(systemRegex);
      if (match) {
        systemPrompt = match[1].trim();
        promptTemplate = promptTemplate.replace(systemRegex, '').trim();
      }

      // Log system and user prompt before calling runPrompt
      appendLog(entry_id, `System Prompt: ${systemPrompt || '(none)'}`);
      appendLog(entry_id, `Final User Prompt: ${promptTemplate}`);

      // Call the AI API to generate content
      const aiResponse = await runPrompt(systemPrompt, promptTemplate);

      if (!aiResponse) {
        return res.status(500).json({ message: 'Error generating content from AI.' });
      }

      // Save the generated content to the database
      await pool.query('UPDATE entries SET generated_content = ? WHERE entry_id = ?', [aiResponse, entry_id]);

      // Respond with the AI-generated content
      res.status(200).json({ data: aiResponse });
    } catch (error) {
      appendLog(req.body.entry_id, `Error: ${error.message}`);
      console.error('Error generating content:', error);
      res.status(500).json({ message: 'Internal server error while generating content.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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

  const unreplaced = prompt.match(placeholderPattern);
  if (unreplaced) {
    console.warn('Unreplaced placeholders found in prompt:', unreplaced);
  }

  return prompt;
}

function replacePlaceholders(template, project, entry, globalVariables = {}) {
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
      : entry.additional_keywords || ''
  };

  // Merge global variables
  for (const [key, value] of Object.entries(globalVariables)) {
    replacements[`{${key}}`] = value || '';
  }

  const finalPrompt = recursiveReplacePlaceholders(template, replacements);
  return finalPrompt;
}

async function runPrompt(systemPrompt, userPrompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY;

  const data = {
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    temperature: 1.0,
    system: systemPrompt, // Set system prompt at top-level if present
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });
    const assistantMessage = response.data;

    if (!assistantMessage || !assistantMessage.content) {
      console.error('Invalid response from Claude API:', assistantMessage);
      return null;
    }

    if (Array.isArray(assistantMessage.content)) {
      const text = assistantMessage.content.map(part => part.text).join('\n');
      return text.trim();
    }

    if (typeof assistantMessage.content === 'string') {
      return assistantMessage.content.trim();
    }

    console.error('Unexpected content structure from Claude response:', assistantMessage.content);
    return null;
  } catch (error) {
    console.error('Error calling Claude API:', error.response ? error.response.data : error);
    return null;
  }
}
