// Parses SQL schema and generates synthetic data for each table (10 rows per table)
// Only basic CREATE TABLE parsing and common types (INT, VARCHAR, DATE, etc.) are supported
// const faker = require('faker');
const { faker } = require('@faker-js/faker');

function parseSchema(schema) {
    const tableRegex = /CREATE TABLE\s+(\w+)\s*\(([^;]+?)\);/gis;
    let match;
    const tables = [];
    while ((match = tableRegex.exec(schema)) !== null) {
        const tableName = match[1];
        const columnsDef = match[2];
        const columns = [];
        // Split columns on commas not inside parentheses
        const colLines = [];
        let buffer = '';
        let parens = 0;
        for (let char of columnsDef) {
            if (char === '(') parens++;
            if (char === ')') parens--;
            if (char === ',' && parens === 0) {
                colLines.push(buffer);
                buffer = '';
            } else {
                buffer += char;
            }
        }
        if (buffer.trim()) colLines.push(buffer);
        colLines.forEach(line => {
            line = line.trim();
            // Skip empty lines and foreign key lines
            if (!line || line.toUpperCase().startsWith('FOREIGN KEY')) return;
            // Extract column name and type (handles types like DECIMAL(12,2), ENUM(...), CHAR(3), etc.)
            const colMatch = line.match(/^(\w+)\s+([A-Z]+(?:\([^)]*\))?)/i);
            if (colMatch) {
                columns.push({
                    name: colMatch[1],
                    type: colMatch[2].toUpperCase()
                });
            }
        });
        tables.push({ name: tableName, columns });
    }
    return tables;
}

function generateValue(type, name) {
    // Use column name for better realism
    const n = name.toLowerCase();
    const t = type.toUpperCase();
    if (n.includes('email')) return faker.internet.email();
    if (n.includes('name')) return faker.person.fullName();
    if (n.includes('account_number')) return faker.finance.accountNumber(12);
    if (n.includes('currency')) return faker.finance.currencyCode();
    if (n.includes('balance') || n.includes('amount')) return faker.finance.amount(100, 10000, 2);
    if (n.includes('created_at') || n.includes('updated_at') || t.includes('DATE') || t.includes('TIME')) return faker.date.past().toISOString().replace('T',' ').substring(0,19);
    if (t.includes('UUID') || n.includes('uuid')) return faker.string.uuid();
    if (t.startsWith('ENUM')) {
        // Extract ENUM values
        const enumMatch = t.match(/ENUM\(([^)]*)\)/i);
        if (enumMatch) {
            // Handles both single and double quoted values, with or without spaces
            const values = enumMatch[1].split(',').map(v => v.trim().replace(/^['"]+|['"]+$/g, ''));
            // Only use non-empty values
            const filtered = values.filter(Boolean);
            return faker.helpers.arrayElement(filtered.length ? filtered : ['ENUM_ERROR']);
        }
    }
    if (t.includes('CHAR') || t.includes('TEXT')) return faker.lorem.words(2);
    if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL')) return faker.number.float({ min: 0, max: 10000, precision: 0.01 });
    if (t.includes('INT')) return faker.number.int({ min: 1, max: 100000 });
    return faker.lorem.word();
}

// Patch: Pass column name to generateValue in generateMockData

function generateMockData(schema, rowsPerTable = 10) {
    const tables = parseSchema(schema);
    const result = {};
    tables.forEach(table => {
        result[table.name] = [];
        for (let i = 0; i < rowsPerTable; i++) {
            const row = {};
            table.columns.forEach(col => {
                row[col.name] = generateValue(col.type, col.name);
            });
            result[table.name].push(row);
        }
    });
    return result;
}

module.exports = generateMockData;
