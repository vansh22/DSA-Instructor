import readlineSync from "readline-sync";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from '@pinecone-database/pinecone'

dotenv.config();

const ai = new GoogleGenAI({});
const History = []

async function chatting(userQuery){
    // // <-- Convert the user query into query vector --> 

    // const ai = new GoogleGenAI({
    //     apiKey: process.env.GEMINI_API_KEY
    // });

    // const response = await ai.models.embedContent({
    //     model: 'gemini-embedding-001',
    //     contents: userQuery,
    // }); // 3072 dimensional vector


    // console.log(response.embeddings)
    // console.log(response.embeddings[0].values.length)

    // OR
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-embedding-001',
    });
 
    const queryVector = await embeddings.embedQuery(userQuery);   

    console.log(queryVector);


    // // <-- Query the vector DB - get the relevant chunks -->
    const pc = new Pinecone();

    const index = pc.Index(process.env.PINECONE_INDEX_NAME);

    const queryResponse = await index.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
    });

    console.log(queryResponse);

    const context = queryResponse.matches
                   .map(match => match.metadata.text)
                   .join("\n\n---\n\n");

    console.log(context);

    // // <-- Feed the above chunks to the LLM -->
    History.push({
        role: 'user',
        parts: [{text: userQuery}]
    });

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: History,
        config: {
            systemInstruction: `You have to behave like a Data Structure and Algorithm Expert.
            You will be given a context of relevant information and a user question.
            Your task is to answer the user's question based ONLY on the provided context.
            If the answer is not in the context, you must say "I could not find the answer in the provided document."
            Keep your answers clear, concise, and educational.
        
            Context: ${context}
        `,
        },
    });

    console.log(response.text)

    History.push({
        role: 'model',
        parts: [{text: response.text}]
    })

}

async function main() {
    const userQuery = readlineSync.question("\n<-- Ask me anything -->\n\n");
    await chatting(userQuery);
    main();
}

main();