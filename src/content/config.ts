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

const pastEvents = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().describe("Event title"),
    date: z.coerce.date().describe("Event date"),
    location: z.string().describe("Event location"),
    description: z.string().describe("Event description"),
    coverImage: image().optional().describe("Event cover image"),
    speakerResources: z.array(z.object({
      speakerName: z.string().describe("Speaker's name"),
      resourceTitle: z.string().describe("Resource title"),
      resourceUrl: z.string()
        .refine(
          (url) => /^(https?:\/\/|\.\/resources\/|\/[a-z0-9-._~:/?#[\]@!$&'()*+,;=]+)/.test(url),
          { message: "Must be http(s)://, ./resources/, or absolute path starting with /" }
        )
        .describe("URL to the resource (http(s)://, ./resources/file, or /absolute/path)"),
      resourceType: z.enum(["slides", "video", "recording", "documentation", "blog", "github", "other"]).describe("Type of resource"),
      description: z.string().optional().describe("Brief description of the resource"),
    })).optional().describe("Array of speaker resources for this event"),
  }),
});

export const collections = { posts, pastEvents };