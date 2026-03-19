import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    description: z.string(),    
    cover: image().optional(),
    author: z.string(),
    slug: z.string().optional(),
    layout: z.string().optional(),
    heroImage: z.string().optional(),
    ogImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };