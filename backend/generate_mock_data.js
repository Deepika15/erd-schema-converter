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
        let foreignKeys = [];
        let primaryKeys = [];
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
            // FOREIGN KEY
            const fkMatch = line.match(/^FOREIGN KEY \(([^)]+)\) REFERENCES (\w+)\(([^)]+)\)/i);
            if (fkMatch) {
                foreignKeys.push({
                    column: fkMatch[1].trim(),
                    refTable: fkMatch[2].trim(),
                    refColumn: fkMatch[3].trim()
                });
                return;
            }
            // PRIMARY KEY inline
            const pkInline = /PRIMARY KEY/i.test(line);
            // Extract column name, type, and rest
            const colMatch = line.match(/^(\w+)\s+([A-Z]+(?:\([^)]*\))?)(.*)$/i);
            if (colMatch) {
                columns.push({
                    name: colMatch[1],
                    type: colMatch[2].toUpperCase(),
                    autoIncrement: /AUTO_INCREMENT/i.test(colMatch[3]),
                    isPrimary: pkInline
                });
                if (pkInline) primaryKeys.push(colMatch[1]);
            }
        });
        tables.push({ name: tableName, columns, foreignKeys, primaryKeys });
    }
    return tables;
}

function generateValue(type, name, opts = {}) {
    // Use column name for better realism
    const n = name.toLowerCase();
    const t = type.toUpperCase();
    if (opts.autoIncrement && typeof opts.rowIndex === 'number') return opts.rowIndex + 1;
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
    // Build dependency graph and sort tables
    const tableMap = Object.fromEntries(tables.map(t => [t.name, t]));
    const visited = new Set();
    const sorted = [];
    function visit(table) {
        if (visited.has(table.name)) return;
        for (const fk of table.foreignKeys) {
            if (tableMap[fk.refTable]) visit(tableMap[fk.refTable]);
        }
        visited.add(table.name);
        sorted.push(table);
    }
    tables.forEach(visit);
    // Generate data
    const result = {};
    const pkCache = {}; // table -> array of pk values
    for (const table of sorted) {
        result[table.name] = [];
        const parentKeys = {};
        // Prepare parent PKs for all FKs in this table
        for (const fk of table.foreignKeys) {
            parentKeys[fk.column] = pkCache[fk.refTable] || [];
        }
        for (let i = 0; i < rowsPerTable; i++) {
            const row = {};
            // For each column, if FK, pick from parent
            table.columns.forEach(col => {
                // Is this column a FK?
                const fk = table.foreignKeys.find(fk => fk.column === col.name);
                if (fk && parentKeys[fk.column].length > 0) {
                    // Pick a random PK from parent table
                    row[col.name] = parentKeys[fk.column][faker.number.int({ min: 0, max: parentKeys[fk.column].length - 1 })];
                } else {
                    row[col.name] = generateValue(col.type, col.name, { autoIncrement: col.autoIncrement, rowIndex: i });
                }
            });
            result[table.name].push(row);
        }
        // Cache PK values for this table for use by children
        if (table.primaryKeys.length === 1) {
            pkCache[table.name] = result[table.name].map(row => row[table.primaryKeys[0]]);
        }
    }
    return result;
}

module.exports = generateMockData;
