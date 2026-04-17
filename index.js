import * as dotenv from "dotenv";
dotenv.config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";


// Sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Retry wrapper for embeddings
const embedWithRetry = async (embeddings, texts, retries = 5) => {
  try {
    return await embeddings.embedDocuments(texts);
  } catch (err) {
    if (retries === 0) throw err;

    console.log("Rate limited... retrying in 2s");
    await sleep(2000);

    return embedWithRetry(embeddings, texts, retries - 1);
  }
};

// DSA Instructor Phase 1: Indexing
const indexDocument = async () => {
  // Loading the document
  const PDF_PATH = "./dsa.pdf";
  const pdfLoader = new PDFLoader(PDF_PATH);
  const rawDocs = await pdfLoader.load();

  // Chunking
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 100,
  });
  const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
  console.log("Chunking Completed", chunkedDocs.length);

  // Vector embedding model
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001", // 3072 dimensional vector
  });

  console.log("Embedding model configured");

  // Configure database
  //  Initialize Pinecone Client
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  console.log("Pinecone configured");

  // Manual batching
  const batchSize = 10;

  for (let i = 0; i < chunkedDocs.length; i += batchSize) {
    const batch = chunkedDocs.slice(i, i + batchSize);

    const texts = batch.map((doc) => doc.pageContent);

    // Retry-enabled embedding
    const vectors = await embedWithRetry(embeddings, texts);

    const records = vectors.map((vec, idx) => ({
      id: `doc-${i + idx}`,
      values: vec,
      metadata: {
        text: batch[idx].pageContent, // useful for retrieval
      },
    }));

    await pineconeIndex.upsert(records);

    console.log(
      `Batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(
        chunkedDocs.length / batchSize,
      )} uploaded`,
    );

    // Throttle to avoid rate limits
    await sleep(1500);
  }

  console.log("Data Stored succesfully");
};

indexDocument();
