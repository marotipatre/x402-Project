/**
 * X402 Hackathon Starter Kit - Endpoints Configuration
 *
 * This file defines all payment-protected endpoints for your x402 service.
 * Modify this file to add new endpoints or change payment requirements.
 *
 * QUICK START FOR TEAMS:
 * 1. Add a new entry below with your endpoint path and payment price
 * 2. Create a handler in handlers/ directory
 * 3. Import and register it in index.ts
 * 4. Test with curl: curl http://localhost:4021/your-endpoint
 */

import { ALGORAND_TESTNET_CAIP2, USDC_TESTNET_ASA_ID } from '@x402/avm';
import { declareDiscoveryExtension } from '@x402-avm/extensions';

// Type definition for endpoints
export interface EndpointConfig {
  [key: string]: {
    accepts: Array<{
      scheme: 'exact';
      price: string;
      network: string;
      payTo: string;
      extra: { asset: number };
    }>;
    description: string;
    extensions?: Record<string, unknown>;
  };
}

/**
 * ENDPOINT TEMPLATES - Copy and modify for your ideas!
 *
 * Modify this based on your team's MVP idea:
 */
export function createPaymentConfig(avmAddress: string): EndpointConfig {
  return {
    // ========== EXAMPLE ENDPOINTS - Modify these! ==========

    /**
     * EXAMPLE 1: Pay-Per-Use API
     * Users pay for accessing premium data
     * Idea: Real-time market data, weather, news, etc.
     */
    'GET /weather': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.005',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: Number(USDC_TESTNET_ASA_ID) },
        },
      ],
      description: 'Weather data access - Pay $0.005 USDC',
      extensions: declareDiscoveryExtension({
        output: {
          example: {
            city: 'San Francisco',
            temperature: 64,
            condition: 'Partly Cloudy',
            humidity: 72,
            timestamp: '2026-06-15T16:00:00.000Z',
            paidVia: 'x402 / USDC Algorand Testnet',
          },
        },
      }),
    },

    /**
     * MEME GENERATOR - AI-powered meme generation
     * Uses Hugging Face API with custom RAG layer
     * Users pay 0.1 USDC per meme generation
     */
    'POST /meme-generate': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.1',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: Number(USDC_TESTNET_ASA_ID) },
        },
      ],
      description: 'AI Meme Generator with RAG - Pay $0.1 USDC per image',
      extensions: declareDiscoveryExtension({
        bodyType: 'json',
        input: { topic: 'blockchain', style: 'funny' },
        inputSchema: {
          properties: {
            topic: { type: 'string' },
            style: { type: 'string' },
          },
          required: ['topic'],
        },
        output: {
          example: {
            imageUrl: 'https://example.com/meme.png',
            caption: 'When your smart contract finally deploys',
            paidVia: 'x402 / USDC Algorand Testnet',
          },
        },
      }),
    },

    /**
     * KrishiConnect AI: Surplus Grain Warehouse Allocation & Logistic Agent
     * Consumers pay a $0.01 Testnet USDC tech fee to deploy the allocation agent.
     * Handler: POST /ai-query
     */
    'POST /ai-query': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: Number(USDC_TESTNET_ASA_ID) },
        },
      ],
      description: 'Surplus Grain Warehouse Allocation & Logistic Agent',
      extensions: declareDiscoveryExtension({
        bodyType: 'json',
        input: {
          commodity: 'wheat',
          requestedMetricTons: 250,
          destinationHub: 'Ludhiana FCI Complex',
        },
        inputSchema: {
          properties: {
            commodity: { type: 'string' },
            requestedMetricTons: { type: 'number' },
            destinationHub: { type: 'string' },
          },
          required: ['commodity'],
        },
        output: {
          example: {
            status: 'ALLOCATION_CONFIRMED',
            gatePassToken: 'AGRI-GP-TESTNET-10458941',
            siloBalanceMt: 18420,
            paidVia: 'x402 / USDC Algorand Testnet',
          },
        },
      }),
    },

    /**
     * EXAMPLE 2: Premium Analytics
     * Users pay for detailed analytics or reports
     * Idea: Portfolio analytics, trading stats, DeFi analytics
     */
    // 'GET /analytics': {
    //   accepts: [
    //     {
    //       scheme: 'exact',
    //       price: '$0.01', // Premium pricing
    //       network: ALGORAND_TESTNET_CAIP2,
    //       payTo: avmAddress,
    //       extra: { asset: USDC_TESTNET_ASA_ID },
    //     },
    //   ],
    //   description: 'Advanced analytics dashboard - Pay $0.01 USDC',
    // },

    /**
     * EXAMPLE 3: Creator Monetization
     * Creators get paid when users access their content
     * Idea: Exclusive NFT content, digital art, music, tutorials
     */
    // 'GET /exclusive-content/:id': {
    //   accepts: [
    //     {
    //       scheme: 'exact',
    //       price: '$0.02', // Creator's price
    //       network: ALGORAND_TESTNET_CAIP2,
    //       payTo: avmAddress,
    //       extra: { asset: USDC_TESTNET_ASA_ID },
    //     },
    //   ],
    //   description: 'Exclusive creator content - Pay $0.02 USDC per access',
    // },

    /**
     * EXAMPLE 4: Token-Gated Utility
     * Users pay to access special tools or utilities
     * Idea: Dev tools, code analysis, AI-powered features
     */
    // 'POST /ai-analysis': {
    //   accepts: [
    //     {
    //       scheme: 'exact',
    //       price: '$0.001', // Micropayment
    //       network: ALGORAND_TESTNET_CAIP2,
    //       payTo: avmAddress,
    //       extra: { asset: USDC_TESTNET_ASA_ID },
    //     },
    //   ],
    //   description: 'AI analysis tool - Pay $0.001 USDC per request',
    // },

    /**
     * EXAMPLE 5: Subscription Alternative
     * Users pay small amounts instead of monthly subscriptions
     * Idea: Database access, API quota, file storage
     */
    // 'GET /premium-data': {
    //   accepts: [
    //     {
    //       scheme: 'exact',
    //       price: '$0.003', // Small payment
    //       network: ALGORAND_TESTNET_CAIP2,
    //       payTo: avmAddress,
    //       extra: { asset: USDC_TESTNET_ASA_ID },
    //     },
    //   ],
    //   description: 'Premium data access - Pay as you go',
    // },
  };
}

/**
 * QUICK GUIDE: Adding a New Endpoint
 *
 * Step 1: Add config here
 * ───────────────────────
 * 'GET /my-endpoint': {
 *   accepts: [{
 *     scheme: 'exact',
 *     price: '$0.005',
 *     network: ALGORAND_TESTNET_CAIP2,
 *     payTo: avmAddress,
 *     extra: { asset: USDC_TESTNET_ASA_ID },
 *   }],
 *   description: 'Description of what users pay for',
 * },
 *
 * Step 2: Create handler in handlers/myEndpoint.ts
 * ─────────────────────────────────────────────────
 * import { Context } from 'hono';
 *
 * export function handleMyEndpoint(c: Context) {
 *   console.log('✓ Payment verified - returning data');
 *   return c.json({ data: 'your response here' });
 * }
 *
 * Step 3: Register in index.ts
 * ─────────────────────────────
 * import { handleMyEndpoint } from './handlers/myEndpoint';
 * app.get('/my-endpoint', handleMyEndpoint);
 *
 * That's it! Your endpoint is now payment-protected.
 */

/**
 * PRICING EXAMPLES (Convert to USDC decimals):
 * - $0.001 = 1 microUSDC (micropayment)
 * - $0.005 = 5 microUSDC (low cost)
 * - $0.01  = 10 microUSDC (small fee)
 * - $0.05  = 50 microUSDC (premium)
 * - $0.10  = 100 microUSDC (high value)
 *
 * USDC on TestNet (ASA 10458941) has 6 decimals
 * So $0.01 USDC = 10,000 microunits
 */

export default createPaymentConfig;
