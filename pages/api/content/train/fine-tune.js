// pages/api/content/train/fine-tune.js

import fs from 'fs';
import path from 'path';
import db from '../../../../lib/db'; // Ensure the correct path to your db.js
import OpenAI from 'openai';
import FormData from 'form-data';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Adjust based on your dataset size
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action } = req.body;

    switch (action) {
      case 'fetch-datasets':
        // Fetch all datasets
        const [datasets] = await db.query('SELECT * FROM datasets ORDER BY created_at DESC');
        return res.status(200).json({ datasets });

      case 'create-dataset':
        // Create a new dataset
        const { dataset, datasetName } = req.body;

        // Validation
        if (!datasetName || typeof datasetName !== 'string' || datasetName.trim() === '') {
          return res.status(400).json({ error: 'Dataset name is required and must be a non-empty string.' });
        }

        if (!Array.isArray(dataset) || dataset.length === 0) {
          return res.status(400).json({ error: 'Dataset is empty or invalid.' });
        }

        if (dataset.length < 10) {
          return res.status(400).json({ error: 'Dataset must contain at least 10 examples for fine-tuning.' });
        }

        for (const [index, entry] of dataset.entries()) {
          if (
            !entry.input_text ||
            !entry.output_text ||
            typeof entry.input_text !== 'string' ||
            typeof entry.output_text !== 'string' ||
            entry.input_text.trim() === '' ||
            entry.output_text.trim() === ''
          ) {
            return res.status(400).json({
              error: `Dataset entry at index ${index} is invalid. Each entry must have non-empty 'input_text' and 'output_text'.`,
            });
          }
        }

        // Convert dataset to JSONL format for chat-based model
        const jsonl = dataset
          .map(
            (item) =>
              JSON.stringify({
                messages: [
                  { role: 'system', content: 'You are a helpful assistant.' }, // Customize system prompt as needed
                  { role: 'user', content: item.input_text },
                  { role: 'assistant', content: item.output_text },
                ],
              })
          )
          .join('\n');

        // Validate JSONL
        const lines = jsonl.split('\n');
        for (let i = 0; i < lines.length; i++) {
          try {
            JSON.parse(lines[i]);
          } catch (e) {
            return res.status(400).json({ error: `Invalid JSON in line ${i + 1}: ${e.message}` });
          }
        }

        // Check size
        const jsonlSizeMB = Buffer.byteLength(jsonl) / (1024 * 1024);
        console.log(`Uploading JSONL Size: ${jsonlSizeMB.toFixed(2)} MB`);
        if (jsonlSizeMB > 100) { // Example limit, adjust as needed
          return res.status(400).json({ error: 'Dataset size exceeds 100 MB limit. Please reduce the size.' });
        }

        // Write JSONL to a temporary file
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }
        const tempFilePath = path.join(tempDir, `dataset_${Date.now()}.jsonl`);
        fs.writeFileSync(tempFilePath, jsonl, 'utf8');

        // Create a read stream
        const fileStream = fs.createReadStream(tempFilePath);

        try {
            try {
                const response = await openai.files.create({
                    file: fileStream,
                    purpose: 'fine-tune',
                });
            } catch (error) {
                console.error('Error in files.create:', error.response ? error.response.data : error.message);
                throw error;
            }

          console.log('Dataset uploaded to OpenAI:', response);

          // Clean up the temporary file
          fs.unlinkSync(tempFilePath);

          // Insert dataset reference into the database
          await db.query(
            'INSERT INTO datasets (dataset_id, dataset_name, file_size_mb) VALUES (?, ?, ?)',
            [response.id, datasetName.trim(), jsonlSizeMB.toFixed(2)]
          );

          console.log(`Dataset Inserted into DB: Dataset ID=${response.id}, Name=${datasetName.trim()}`);

          return res.status(200).json({ message: 'Dataset uploaded and saved successfully.', datasetId: response.id });
        } catch (error) {
          // Clean up the temporary file in case of error
          fs.unlinkSync(tempFilePath);
          console.error('Error uploading to OpenAI:', error.response ? error.response.data : error.message);
          return res.status(500).json({ error: 'Failed to upload dataset to OpenAI.', details: error.response ? error.response.data : error.message });
        }

        case 'fetch-models':
            const [models] = await db.query(`
              SELECT ftm.*, d.dataset_name, COALESCE(ftm.output_model, '') AS output_model
              FROM fine_tuned_models ftm
              JOIN datasets d ON ftm.dataset_id = d.id
              ORDER BY ftm.created_at DESC
            `);
            return res.status(200).json({ models });
   

        case 'create-model':
            const { datasetId: selectedDatasetId, modelName: newModelNameInput, baseModel } = req.body;
            
            if (!selectedDatasetId || !baseModel) {
                return res.status(400).json({ error: 'Dataset ID and base model are required to create a model.' });
            }
            
            if (!newModelNameInput || typeof newModelNameInput !== 'string' || newModelNameInput.trim() === '') {
                return res.status(400).json({ error: 'Model name is required and must be a non-empty string.' });
            }
            
            try {
                const fineTuneResponse = await openai.fineTuning.jobs.create({
                training_file: selectedDatasetId,
                model: baseModel, // Use the selected base model, which can be a fine-tuned model
                suffix: newModelNameInput.trim(),
                });
            
                console.log('Fine-Tune Job Created:', fineTuneResponse);
            
                await db.query(
                'INSERT INTO fine_tuned_models (fine_tune_id, model_name, status, dataset_id) VALUES (?, ?, ?, ?)',
                [fineTuneResponse.id, newModelNameInput.trim(), fineTuneResponse.status, selectedDatasetId]
                );
            
                return res.status(200).json({ message: 'Fine-tuning initiated successfully.', fineTuneId: fineTuneResponse.id });
            } catch (error) {
                console.error('Error initiating fine-tuning:', error.response ? error.response.data : error.message);
                return res.status(500).json({ error: 'Failed to initiate fine-tuning.', details: error.response?.data || error.message });
            }
        case 'status':
            const { fineTuneId: statusFineTuneId } = req.body;
            
            if (!statusFineTuneId) {
                return res.status(400).json({ error: 'Fine-tune ID is required to check status.' });
            }
            
            try {
                const statusResponse = await openai.fineTuning.jobs.retrieve(statusFineTuneId);
            
                console.log('Fine-Tune Job Status Retrieved:', statusResponse);
            
                const { status, fine_tuned_model } = statusResponse;
            
                // Update the status in the database
                if (status === 'succeeded' && fine_tuned_model) {
                await db.query(
                    'UPDATE fine_tuned_models SET status = ?, output_model = ? WHERE fine_tune_id = ?',
                    [status, fine_tuned_model, statusFineTuneId]
                );
                } else {
                await db.query('UPDATE fine_tuned_models SET status = ? WHERE fine_tune_id = ?', [
                    status,
                    statusFineTuneId,
                ]);
                }
            
                return res.status(200).json({
                status,
                fineTuneId: statusFineTuneId,
                outputModel: fine_tuned_model || null,
                });
            } catch (error) {
                console.error('Error retrieving fine-tune status:', error.response ? error.response.data : error.message);
                return res.status(500).json({ error: 'Failed to retrieve fine-tune status.', details: error.response?.data || error.message });
            }
            
        case 'update-status':
            const { fineTuneId, status } = req.body;
            
            if (!fineTuneId || !status) {
                return res.status(400).json({ error: 'Fine-tune ID and status are required.' });
            }
            
            try {
                await db.query(
                'UPDATE fine_tuned_models SET status = ? WHERE fine_tune_id = ?',
                [status, fineTuneId]
                );
            
                return res.status(200).json({ message: 'Status updated successfully.' });
            } catch (error) {
                console.error('Error updating status:', error);
                return res.status(500).json({ error: 'Failed to update status in database.' });
            }
            
            
      case 'list':
        // List all fine-tuned models from the database
        try {
          const [rows] = await db.query(`
            SELECT ftm.*, d.dataset_name
            FROM fine_tuned_models ftm
            JOIN datasets d ON ftm.dataset_id = d.id
            ORDER BY ftm.created_at DESC
          `);
          return res.status(200).json({ fineTunes: rows });
        } catch (error) {
          console.error('Error listing fine-tuned models:', error);
          return res.status(500).json({ error: 'Failed to list fine-tuned models.', details: error.message });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in fine-tune API:', error);
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
