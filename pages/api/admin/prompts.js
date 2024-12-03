// pages/api/admin/prompts.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Adjust the path as needed
import pool from '../../../lib/db'; // Ensure this path is correct
import Joi from 'joi';

export default async function handler(req, res) {
  console.log('API /api/admin/prompts called with method:', req.method); // Debugging line

  // Retrieve the session using getServerSession
  const session = await getServerSession(req, res, authOptions);

  // Safeguard: Ensure session and session.user exist
  if (!session || !session.user) {
    console.log('Access denied: No session or user found');
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Check if the user has admin permissions
  if (session.user.permissions_level !== 'admin') {
    console.log('Access denied: User permissions level:', session.user.permissions_level);
    return res.status(403).json({ message: 'Forbidden: Not an admin' });
  }

  // Define validation schemas
  const baseSchema = {
    prompt_text: Joi.string().trim().min(1).required(),
    prompt_type: Joi.string().valid('Content Prompt', 'Global Variable').required(),
  };

  const contentPromptSchema = Joi.object({
    ...baseSchema,
    page_type: Joi.string().trim().min(1).required(),
    content_type: Joi.string().trim().min(1).required(),
  });

  const globalVariableSchema = Joi.object({
    ...baseSchema,
    variable_name: Joi.string()
      .trim()
      .regex(/^[a-zA-Z_][a-zA-Z0-9_\-{}]*$/)
      .required()
      .messages({
        'string.pattern.base':
          'variable_name must start with a letter or underscore and can include letters, numbers, underscores (_), dashes (-), and curly brackets.',
      }),
  });

  // Define schema for updating only prompt_text
  const promptTextUpdateSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
    prompt_text: Joi.string().trim().min(1).required(),
  });

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        'SELECT id, page_type, content_type, prompt_text, prompt_type, variable_name FROM prompts'
      );
      res.status(200).json({ prompts: rows });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { page_type, content_type, prompt_text, prompt_type, variable_name } = req.body;

    // Choose the appropriate schema based on prompt_type
    let schema;
    if (prompt_type === 'Content Prompt') {
      schema = contentPromptSchema;
    } else if (prompt_type === 'Global Variable') {
      schema = globalVariableSchema;
    } else {
      return res.status(400).json({ message: 'Invalid prompt_type.' });
    }

    const { error, value } = schema.validate(req.body);

    if (error) {
      console.log('Validation error details:', error.details);
      console.log('Received payload:', req.body);
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      if (prompt_type === 'Global Variable') {
        await pool.query(
          'INSERT INTO prompts (prompt_text, prompt_type, variable_name, page_type, content_type) VALUES (?, ?, ?, NULL, NULL)',
          [value.prompt_text, value.prompt_type, value.variable_name]
        );
      } else {
        await pool.query(
          'INSERT INTO prompts (page_type, content_type, prompt_text, prompt_type, variable_name) VALUES (?, ?, ?, ?, NULL)',
          [value.page_type, value.content_type, value.prompt_text, value.prompt_type]
        );
      }
      console.log('Prompt created successfully.');
      res.status(201).json({ message: 'Prompt created successfully.' });
    } catch (error) {
      console.error('Error creating prompt:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'PATCH') {
    const { id, prompt_text, prompt_type, variable_name, page_type, content_type } = req.body;
  
    // Determine if it's a prompt_text-only update
    const isPromptTextOnly = prompt_text && !prompt_type && !variable_name && !page_type && !content_type;
  

    if (isPromptTextOnly) {
        // Validate only id and prompt_text
        const { error, value } = promptTextUpdateSchema.validate(req.body);
    
        if (error) {
          console.log('Validation error:', error.details[0].message);
          console.log('Payload:', req.body);
          return res.status(400).json({ message: error.details[0].message });
        }

        try {
            await pool.query(
              'UPDATE prompts SET prompt_text = ? WHERE id = ?',
              [value.prompt_text, value.id]
            );
            console.log('Prompt text updated successfully.');
            res.status(200).json({ message: 'Prompt text updated successfully.' });
          } catch (error) {
            console.error('Error updating prompt text:', error);
            res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
       // Full update scenario
    // Define schemas for full update
    const basePatchSchema = {
        id: Joi.number().integer().positive().required(),
        prompt_text: Joi.string().trim().min(1).required(),
        prompt_type: Joi.string().valid('Content Prompt', 'Global Variable').required(),
      };
  
      const contentPromptPatchSchema = Joi.object({
        ...basePatchSchema,
        page_type: Joi.string().trim().min(1).required(),
        content_type: Joi.string().trim().min(1).required(),
      });

      const globalVariablePatchSchema = Joi.object({
        ...basePatchSchema,
        variable_name: Joi.string()
          .trim()
          .regex(/^[a-zA-Z_][a-zA-Z0-9_\-{}]*$/)
          .required()
          .messages({
            'string.pattern.base':
              'variable_name must start with a letter or underscore and can include letters, numbers, underscores (_), dashes (-), and curly brackets.',
          }),
        page_type: Joi.any().optional().allow(null),
        content_type: Joi.any().optional().allow(null),
      });

      // Choose the appropriate schema based on prompt_type
    let schema;
    if (prompt_type === 'Content Prompt') {
      schema = contentPromptPatchSchema;
    } else if (prompt_type === 'Global Variable') {
      schema = globalVariablePatchSchema;
    } else {
      return res.status(400).json({ message: 'Invalid prompt_type.' });
    }
    const { error, value } = schema.validate(req.body);

    if (error) {
      console.log('Validation error:', error.details[0].message);
      console.log('Payload:', req.body);
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
        if (prompt_type === 'Global Variable') {
          await pool.query(
            'UPDATE prompts SET prompt_text = ?, prompt_type = ?, variable_name = ?, page_type = NULL, content_type = NULL WHERE id = ?',
            [value.prompt_text, value.prompt_type, value.variable_name, value.id]
          );
        } else {
            await pool.query(
              'UPDATE prompts SET page_type = ?, content_type = ?, prompt_text = ?, prompt_type = ?, variable_name = NULL WHERE id = ?',
              [value.page_type, value.content_type, value.prompt_text, value.prompt_type, value.id]
            );
          }
          console.log('Prompt updated successfully.');
          res.status(200).json({ message: 'Prompt updated successfully.' });
        } catch (error) {
            console.error('Error updating prompt:', error);
            res.status(500).json({ message: 'Internal Server Error' });
          }
        }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
