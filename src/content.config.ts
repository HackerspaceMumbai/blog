import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
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