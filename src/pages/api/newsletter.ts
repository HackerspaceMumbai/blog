import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequest } from '../../../functions/newsletter';

export const prerender = false;

const handleRequest = (({ request }) => onRequest({ request, env })) satisfies APIRoute;

export const POST = handleRequest;
export const OPTIONS = handleRequest;
