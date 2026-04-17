# DSA Instructor

A simple Retrieval-Augmented Generation (RAG) project for Data Structures and Algorithms using Node.js, Google Gemini embeddings, and Pinecone.

## Overview

This repository contains two main scripts:

- `index.js` - Loads and chunks a PDF document (`dsa.pdf`), generates embeddings, and uploads them to a Pinecone vector index.
- `query.js` - Prompts the user for a question, converts the question into an embedding, retrieves relevant document chunks from Pinecone, and uses Gemini to generate an answer.

## Prerequisites

- Node.js 18+ or compatible version
- A Google Gemini API key
- A Pinecone index and credentials
- A local PDF file named `dsa.pdf` in the repository root

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root with at least the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```

> Note: The Pinecone client may also require additional environment variables such as `PINECONE_API_KEY` and `PINECONE_ENV` or `PINECONE_BASE_URL`, depending on your Pinecone SDK configuration.

## Usage

### 1. Index the PDF

This step loads the `dsa.pdf` file, splits it into chunks, embeds the text, and uploads vector records to Pinecone.

```bash
node index.js
```

### 2. Query the knowledge base

Run the conversational query script and ask questions against the indexed PDF content.

```bash
node query.js
```

The script will prompt you for a question and print the model response.

## File Summary

- `index.js` - Builds the RAG index from a PDF document.
- `query.js` - Performs retrieval from Pinecone and generates answers with Gemini.
- `package.json` - Project dependencies and metadata.

## Notes

- `query.js` currently stores conversation history in-memory during one runtime session.
- The prompt is configured to force the model to answer only from the retrieved context and to return a fallback message if the answer is not present.

## License

This project is released under the ISC license.
