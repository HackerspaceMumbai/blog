import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequest } from '../../../functions/newsletter';

const handleRequest = (({ request }) => onRequest({ request, env })) satisfies APIRoute;

export const POST = handleRequest;
export const OPTIONS = handleRequest;
