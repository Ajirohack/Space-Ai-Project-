import { z } from 'zod';
import type { RagSystemConfig } from './types';

const configSchema = z.object({
  pinecone: z.object({
    apiKey: z.string({
      required_error: "PINECONE_API_KEY is required in environment variables",
    }),
    indexName: z.string({
      required_error: "PINECONE_INDEX_NAME is required in environment variables",
    }),
  }),
  openai: z.object({
    apiKey: z.string({
      required_error: "OPENAI_API_KEY is required in environment variables",
    }),
    modelName: z.string().default('text-embedding-ada-002'),
    maxTokens: z.coerce.number().default(500),
  }),
  documentProcessing: z.object({
    chunkSize: z.coerce.number().default(1000),
    chunkOverlap: z.coerce.number().default(200),
  }),
});

export class ConfigLoader {
  static load(env: NodeJS.ProcessEnv): RagSystemConfig {
    try {
      const config = {
        pinecone: {
          apiKey: env.PINECONE_API_KEY,
          indexName: env.PINECONE_INDEX_NAME,
        },
        openai: {
          apiKey: env.OPENAI_API_KEY,
          modelName: env.OPENAI_MODEL_NAME,
          maxTokens: env.OPENAI_MAX_TOKENS,
        },
        documentProcessing: {
          chunkSize: env.DOC_CHUNK_SIZE,
          chunkOverlap: env.DOC_CHUNK_OVERLAP,
        },
      };

      return configSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.issues
          .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
          .map(issue => issue.path.join('.'))
          .join(', ');

        throw new Error(
          `Missing required environment variables: ${missingVars}\n` +
          `Please check your .env file and ensure all required variables are set.`
        );
      }
      throw error;
    }
  }
}