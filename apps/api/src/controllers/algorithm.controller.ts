
import { Request, Response } from 'express';
import Algorithm from '../models/mongodb/algorithm.model.js';
import mongoose from 'mongoose';
import { OpenAIAlgorithmClient } from '@aica/ai-engine';
import { CacheService } from '../services/cache.service.js';

const getOpenAIClient = () => new OpenAIAlgorithmClient();
const generationRequests = new Map<string, { count: number; expiresAt: number }>();

const mongoUnavailable = (res: Response) => res.status(503).json({
  success: false,
  message: 'Algorithm database is unavailable. Check MONGODB_URI and MongoDB connectivity.',
});

// Get all algorithms
export const getAlgorithms = async (
  req: Request,
  res: Response
) => {
  try {
    if (mongoose.connection.readyState !== 1) return mongoUnavailable(res);

    const cacheKey = 'cache:algorithms:list';
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      res.status(200).json(cached);
      return;
    }

    const algorithms = await Algorithm.find().sort({ name: 1 });

    const responseData = {
      success: true,
      count: algorithms.length,
      data: algorithms,
    };

    await CacheService.set(cacheKey, responseData, 600);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('[Algorithms] Failed to fetch algorithms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch algorithms',
    });
  }
};

// Get one algorithm by slug
export const getAlgorithmBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    if (mongoose.connection.readyState !== 1) return mongoUnavailable(res);

    const slug = req.params.slug;
    const cacheKey = `cache:algorithms:item:${slug}`;
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      res.status(200).json(cached);
      return;
    }

    const algorithm = await Algorithm.findOne({ slug });

    if (!algorithm) {
      res.status(404).json({
        success: false,
        message: 'Algorithm not found',
      });
      return;
    }

    const responseData = {
      success: true,
      data: algorithm,
    };

    await CacheService.set(cacheKey, responseData, 600);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('[Algorithms] Failed to fetch algorithm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch algorithm',
    });
  }
};

export const generateAlgorithm = async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) return mongoUnavailable(res);

  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ success: false, message: 'Enter an algorithm or topic name between 2 and 100 characters.' });
  }

  try {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await Algorithm.findOne({ name: new RegExp(`^${escapedQuery}$`, 'i') });
    if (existing) return res.status(200).json({ success: true, generated: false, data: existing });

  const now = Date.now();
  for (const [ip, request] of generationRequests) {
    if (request.expiresAt <= now) generationRequests.delete(ip);
  }
  const clientKey = req.user?.id || req.ip || 'unknown';
  const priorRequests = generationRequests.get(clientKey);
  if (priorRequests && priorRequests.count >= 20 && priorRequests.expiresAt > now) {
    return res.status(429).json({ success: false, message: 'Too many algorithm generation requests. Please try again in a few minutes.' });
  }
  generationRequests.set(clientKey, {
    count: (priorRequests?.count || 0) + 1,
    expiresAt: priorRequests?.expiresAt || now + 10 * 60 * 1000,
  });

    const generated = await getOpenAIClient().generateAlgorithm(query);
    if (!generated.isAlgorithm) {
      return res.status(422).json({ success: false, message: 'That search does not look like a specific computer science algorithm or topic. Try a name such as Dijkstra’s algorithm or graph traversal.' });
    }

    const slug = generated.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) return res.status(422).json({ success: false, message: 'The generated algorithm name was not valid. Please try a more specific search.' });

    const existingSlug = await Algorithm.findOne({ slug });
    if (existingSlug) return res.status(200).json({ success: true, generated: false, data: existingSlug });

    const algorithm = await Algorithm.findOneAndUpdate(
      { slug },
      { ...generated, slug },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await CacheService.invalidatePattern('cache:algorithms:*');
    return res.status(201).json({ success: true, generated: true, data: algorithm });
  } catch (error: any) {
    console.error('[Algorithms] Failed to generate algorithm:', error);
    if (error.message?.includes('AI_CONFIG_ERROR')) {
      return res.status(503).json({ success: false, message: 'Algorithm generation is not configured. Set OPENAI_API_KEY on the API server.' });
    }
    if (error.status === 401 || error.status === 403) {
      return res.status(503).json({ success: false, message: 'OpenAI rejected the API key. Check OPENAI_API_KEY on the API server.' });
    }
    if (error.status === 429) {
      if (error.code === 'credit_balance_exhausted' || error.code === 'insufficient_quota' || error.type === 'insufficient_quota') {
        return res.status(402).json({ success: false, message: 'OpenAI API credits are exhausted. Add credits or check the project billing and usage limits, then try again.' });
      }
      return res.status(429).json({ success: false, message: 'OpenAI request limit reached. Please try again later.' });
    }
    if (error.status === 503 || error.status === 504 || error.message?.includes('UNAVAILABLE') || error.message?.includes('DEADLINE_EXCEEDED')) {
      return res.status(503).json({ success: false, message: 'Gemini is temporarily busy. Please try generating this algorithm again shortly.' });
    }
    return res.status(502).json({ success: false, message: 'Could not generate this algorithm right now. Please try again.' });
  }
};
