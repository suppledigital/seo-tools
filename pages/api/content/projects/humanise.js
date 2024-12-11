// pages/api/content/projects/humanise.js
import pool from '../../../../lib/db';
import axios from 'axios';
import { appendLog } from '../../../../lib/logs'; // Adjust path if needed

const MAX_ITERATIONS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { entry_id } = req.body;
  if (!entry_id) {
    return res.status(400).json({ error: 'entry_id is required' });
  }

  try {
    appendLog(entry_id, 'Fetching prompt with id=34...');
    const [promptRows] = await pool.query('SELECT prompt_text FROM prompts WHERE id = 34 LIMIT 1');
    if (promptRows.length === 0) {
      appendLog(entry_id, 'No prompt found with id=34.');
      return res.status(404).json({ error: 'Prompt with id=34 not found' });
    }
    let promptTemplate = promptRows[0].prompt_text;
    appendLog(entry_id, `Prompt Template: ${promptTemplate}`);

    appendLog(entry_id, 'Fetching entry and project data...');
    const [entryRows] = await pool.query('SELECT * FROM entries WHERE entry_id = ? LIMIT 1', [entry_id]);
    if (entryRows.length === 0) {
      appendLog(entry_id, 'Entry not found.');
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = entryRows[0];

    const [projectRows] = await pool.query('SELECT * FROM projects WHERE project_id = ?', [entry.project_id]);
    if (projectRows.length === 0) {
      appendLog(entry_id, 'Project not found.');
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectRows[0];

    appendLog(entry_id, 'Fetching global variables...');
    const [globalVarRows] = await pool.query(
      "SELECT variable_name, prompt_text FROM prompts WHERE prompt_type = 'Global Variable'"
    );

    let globalVariables = {};
    for (const row of globalVarRows) {
      const varKey = row.variable_name.startsWith('{') ? row.variable_name : `{${row.variable_name}}`;
      globalVariables[varKey] = row.prompt_text || '';
    }

    const { generated_content } = entry;
    promptTemplate = promptTemplate.replace('{text}', generated_content || '');
    appendLog(entry_id, `Prompt after replacing {text}: ${promptTemplate}`);

    let systemPrompt = '';
    const systemRegex = /%%([\s\S]*?)%%/;
    const match = promptTemplate.match(systemRegex);
    if (match) {
      systemPrompt = match[1].trim();
      promptTemplate = promptTemplate.replace(systemRegex, '').trim();
      appendLog(entry_id, `System Prompt Extracted: ${systemPrompt}`);
      appendLog(entry_id, `User Prompt after system extraction: ${promptTemplate}`);
    }

    const combinedData = buildReplacementsMap(project, entry, globalVariables);
    systemPrompt = iterativePlaceholderReplacement(systemPrompt, combinedData, MAX_ITERATIONS);
    promptTemplate = iterativePlaceholderReplacement(promptTemplate, combinedData, MAX_ITERATIONS);

    appendLog(entry_id, `Final System Prompt: ${systemPrompt}`);
    appendLog(entry_id, `Final User Prompt: ${promptTemplate}`);

    appendLog(entry_id, 'Calling AI API for humanization...');
    const humanizedContent = await runPrompt(systemPrompt, promptTemplate);
    appendLog(entry_id, `AI Response (Humanized Content): ${humanizedContent}`);

    if (!humanizedContent) {
      appendLog(entry_id, 'Error humanizing content.');
      return res.status(500).json({ error: 'Error humanizing content with Claude.' });
    }

    const sql = 'UPDATE entries SET humanized_content = ? WHERE entry_id = ?';
    const values = [humanizedContent, entry_id];
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      appendLog(entry_id, 'Failed to update entry with humanized content.');
      return res.status(404).json({ error: 'Entry not found or not updated' });
    }

    appendLog(entry_id, 'Successfully updated humanized content in DB.');
    res.status(200).json({ status: 'success', humanizedContent });
  } catch (error) {
    appendLog(entry_id, `Error: ${error.message}`);
    console.error('Error processing humanized content:', error);
    res.status(500).json({ error: 'An error occurred while processing the content' });
  }
}

function buildReplacementsMap(project, entry, globalVariables) {
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

  for (const [key, value] of Object.entries(globalVariables)) {
    replacements[key] = value;
  }

  return replacements;
}

function iterativePlaceholderReplacement(text, replacements, maxIterations) {
  if (!text) return text;
  const placeholderPattern = /{[^}]+}/g;
  let iteration = 0;

  while (iteration < maxIterations) {
    const matches = text.match(placeholderPattern);
    if (!matches) break;
    let replacedSomething = false;

    for (const placeholder of matches) {
      if (replacements.hasOwnProperty(placeholder)) {
        text = text.split(placeholder).join(replacements[placeholder]);
        replacedSomething = true;
      }
    }

    if (!replacedSomething) {
      break;
    }

    iteration++;
  }

  return text;
}

async function runPrompt(systemPrompt, userPrompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY;

  const data = {
    model: 'claude-3-opus-20240229',
    max_tokens: 2048,
    temperature: 1.0,
    system: systemPrompt,
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
