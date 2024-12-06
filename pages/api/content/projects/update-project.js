// pages/api/content/projects/update-project.js

import { getServerSession } from 'next-auth/next'; // Correct import for server-side
import { authOptions } from '../../auth/[...nextauth]'; // Ensure the path is correct
import pool from '../../../../lib/db';
import Joi from 'joi'; // For validation

export default async function handler(req, res) {
  // Retrieve the session using getServerSession
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle only POST requests
  if (req.method === 'POST') {
    const { project_id, form_data } = req.body;

    // Basic validation
    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    if (!form_data || typeof form_data !== 'object') {
      return res.status(400).json({ message: 'form_data is required and should be an object' });
    }

    // Define validation schema using Joi
    const schema = Joi.object({
      business_name: Joi.string().max(255).required(),
      phone_number: Joi.string().max(50).required(),
      physical_location: Joi.string().max(255).required(),
      services_products: Joi.string().required(),
      primary_usp: Joi.string().required(),
      secondary_usp: Joi.string().allow(''),
      reference_content: Joi.string().required(),
      home_content: Joi.string().required(),
      about_us_content: Joi.string().required(),
      target_locations: Joi.string().required(),
      language: Joi.string().valid('British English/Australian English', 'US English').required(),
      primary_cta: Joi.string().allow(''),
      secondary_cta: Joi.string().allow(''),
      trust_signals: Joi.string().allow(''),
      awards_accreditations: Joi.string().allow(''),
      additional_notes: Joi.string().allow(''),
      // Add more fields as needed
    });

    // Validate form_data
    const { error } = schema.validate(form_data, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    try {
      // Define allowed fields to prevent unauthorized updates
      const allowedFields = [
        'business_name',
        'phone_number',
        'physical_location',
        'services_products',
        'primary_usp',
        'secondary_usp',
        'reference_content',
        'home_content',
        'about_us_content',
        'target_locations',
        'language',
        'primary_cta',
        'secondary_cta',
        'trust_signals',
        'awards_accreditations',
        'additional_notes',
        // Add more fields here if needed
      ];

      const fields = [];
      const values = [];

      // Iterate over form_data and prepare fields for update
      for (const [key, value] of Object.entries(form_data)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      // If no valid fields are provided, return an error
      if (fields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      // Construct the SQL query
      const sql = `UPDATE projects SET ${fields.join(', ')} WHERE project_id = ?`;
      values.push(project_id);

      // Execute the query
      const [result] = await pool.query(sql, values);

      // Check if the project was found and updated
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Respond with success
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error updating project information:', error);
      res.status(500).json({ message: 'Error updating project information' });
    }
  } else {
    // If the method is not POST, return a method not allowed error
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
