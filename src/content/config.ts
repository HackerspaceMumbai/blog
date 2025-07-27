import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),    
    cover: z.string().optional(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };