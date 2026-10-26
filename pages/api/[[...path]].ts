import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest } from '@the-read/backend';

export const config = {
  api: { bodyParser: false, externalResolver: true },
  maxDuration: 60,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Express parses query strings itself; Next's catch-all parameter is routing data.
    delete req.query.path;
    await handleRequest(req, res);
  } catch (error) {
    console.error('API initialization failed', error instanceof Error ? error.name : 'UnknownError');
    if (!res.headersSent) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(503).json({ statusCode: 503, message: 'Service temporarily unavailable' });
    }
  }
}
