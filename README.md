cd client
npm install reactflow @mui/material @emotion/react @emotion/styled axios# ERD to Schema Converter

A Proof of Concept application that converts Entity Relationship Diagrams into SQL schema definitions.

## Features

- Interactive UI for drawing ERD diagrams
- Real-time conversion to SQL schema
- Support for entities, attributes, and relationships
- Export functionality for SQL schema

## Project Structure

- `/client` - React application for the ERD editor

- `/backend` - Node.js API server for schema conversion

## Tech Stack

- Client: React, React Flow (for diagram editing)
- Backend: Node.js, Express
- Database: SQLite (for saving diagrams)
