import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequest } from '../../../functions/newsletter-health';

const handleRequest = (({ request }) => onRequest({ request, env })) satisfies APIRoute;

export const GET = handleRequest;
export const OPTIONS = handleRequest;
