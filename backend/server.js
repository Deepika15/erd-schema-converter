const express = require('express');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mockExtractSchemaFromImage = require('./erd_image_mock_schema');
const generateMockData = require('./generate_mock_data');

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Convert ERD to Schema
app.post('/api/convert', (req, res) => {
    const { entities, relationships } = req.body;
    const schema = convertToSchema(entities, relationships);
    res.json({ schema });
});

// Helper function to convert ERD to schema
function convertToSchema(entities, relationships) {
    let schema = '';
    
    // Process each entity
    entities.forEach(entity => {
        schema += `CREATE TABLE ${entity.name} (\n`;
        
        // Add attributes
        entity.attributes.forEach((attr, index) => {
            schema += `    ${attr.name} ${attr.type}`;
            if (attr.isPrimaryKey) schema += ' PRIMARY KEY';
            if (attr.isRequired) schema += ' NOT NULL';
            if (index < entity.attributes.length - 1) schema += ',';
            schema += '\n';
        });
        
        // Add foreign keys
        const entityRelationships = relationships.filter(r => 
            r.source === entity.id || r.target === entity.id);
            
        entityRelationships.forEach(rel => {
            if (rel.target === entity.id) {
                schema += `    FOREIGN KEY (${rel.targetField}) `;
                schema += `REFERENCES ${rel.sourceTable}(${rel.sourceField}),\n`;
            }
        });
        
        schema = schema.replace(/,\n$/, '\n');
        schema += ');\n\n';
    });
    
    return schema;
}

// Endpoint to accept ERD diagram image upload and return schema
app.post('/api/convert-erd-image', upload.single('diagram'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded.' });
    }
    try {
        // Use OCR to extract text from the image
        const schema = await mockExtractSchemaFromImage(req.file.path);
        // Optionally, delete the uploaded file after processing
        fs.unlink(req.file.path, () => {});
        res.json({ schema });
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract schema from image.' });
    }
});

// Endpoint to accept SQL schema and return synthetic data
app.post('/api/generate-mock-data', express.text({ type: '*/*' }), (req, res) => {
    const schema = req.body;
    console.log('Received schema for mock data generation:\n', schema);
    if (!schema || !schema.toLowerCase().includes('create table')) {
        console.log('Error: Invalid or missing SQL schema.');
        return res.status(400).json({ error: 'Invalid or missing SQL schema.' });
    }
    try {
        const mockData = generateMockData(schema, 10);
        console.log('Mock data generated successfully.');
        res.json({ mockData });
    } catch (err) {
        console.log('Error generating mock data:', err.stack || err);
        res.status(500).json({ error: 'Failed to generate mock data.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
