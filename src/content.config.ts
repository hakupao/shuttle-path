import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['strokes', 'footwork', 'sports-science']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    coverColor: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { knowledge, lessons };
