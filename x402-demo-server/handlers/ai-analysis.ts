/**
 * KrishiConnect AI — Surplus Grain Warehouse Allocation & Logistic Agent
 *
 * POST /ai-query is payment-protected ($0.01 Testnet USDC via x402).
 * After the consumer invoice settles, this handler mock-verifies cargo
 * allocation, computes remaining silo capacity, and returns a structured
 * confirmation plus an official gate-pass token.
 */

import type { Context } from 'hono';

const SILO_CAPACITY_MT: Record<string, number> = {
  wheat: 42000,
  rice: 36500,
  paddy: 28000,
};

const LIVE_OCCUPIED_MT: Record<string, number> = {
  wheat: 39280,
  rice: 35110,
  paddy: 26140,
};

const SURPLUS_OVERFLOW_MT: Record<string, number> = {
  wheat: 1840,
  rice: 1260,
  paddy: 720,
};

function normalizeCommodity(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : 'wheat';
  if (raw === 'rice' || raw === 'paddy' || raw === 'wheat') {
    return raw;
  }
  return 'wheat';
}

function mockVerifyCargo(commodity: string, requestedMetricTons: number) {
  const capacity = SILO_CAPACITY_MT[commodity] ?? SILO_CAPACITY_MT.wheat;
  const occupied = LIVE_OCCUPIED_MT[commodity] ?? LIVE_OCCUPIED_MT.wheat;
  const overflow = SURPLUS_OVERFLOW_MT[commodity] ?? SURPLUS_OVERFLOW_MT.wheat;
  const availableSiloBalanceMt = Math.max(0, capacity - occupied);
  const allocatableMt = Math.min(requestedMetricTons, overflow, Math.max(availableSiloBalanceMt, overflow));
  const verified = allocatableMt > 0;

  return {
    verified,
    capacityMt: capacity,
    occupiedMt: occupied,
    availableSiloBalanceMt,
    overflowFacingLimitedStorageMt: overflow,
    allocatedMetricTons: verified ? allocatableMt : 0,
    utilizationPct: Number(((occupied / capacity) * 100).toFixed(2)),
  };
}

function issueGatePassToken(commodity: string, allocatedMetricTons: number): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const crop = commodity.slice(0, 3).toUpperCase();
  const qty = Math.round(allocatedMetricTons).toString().padStart(4, '0');
  return `AGRI-GP-${crop}-${qty}-${stamp}`;
}

/**
 * POST /ai-query
 * Surplus Grain Warehouse Allocation & Logistic Agent
 *
 * Request body example:
 * {
 *   "commodity": "wheat" | "rice" | "paddy",
 *   "requestedMetricTons": 250,
 *   "destinationHub": "Ludhiana FCI Complex"
 * }
 */
export async function handleAIQuery(c: Context) {
  try {
    console.log('✓ PAYMENT VERIFIED - POST /ai-query Surplus Grain Warehouse Allocation & Logistic Agent');

    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }

    const commodity = normalizeCommodity(body.commodity);
    const requestedMetricTons = Number(body.requestedMetricTons) > 0 ? Number(body.requestedMetricTons) : 250;
    const destinationHub =
      typeof body.destinationHub === 'string' && body.destinationHub.trim()
        ? body.destinationHub.trim()
        : 'Ludhiana FCI Surplus Yard';

    const cargo = mockVerifyCargo(commodity, requestedMetricTons);
    const gatePassToken = cargo.verified
      ? issueGatePassToken(commodity, cargo.allocatedMetricTons)
      : null;

    return c.json({
      status: cargo.verified ? 'ALLOCATION_CONFIRMED' : 'ALLOCATION_DENIED',
      agent: 'Surplus Grain Warehouse Allocation & Logistic Agent',
      payment: {
        tech_fee_usdc: 0.01,
        asset: 'USDC_TESTNET_ASA_ID',
        paid_via_x402: true,
        network: 'Algorand TestNet',
      },
      cargo_verification: {
        mock_verified: cargo.verified,
        commodity,
        requested_metric_tons: requestedMetricTons,
        allocated_metric_tons: cargo.allocatedMetricTons,
        destination_hub: destinationHub,
        notes: cargo.verified
          ? 'Overflow lot cleared for commercial lift to relieve constrained government silo capacity.'
          : 'No surplus lot available at this hub.',
      },
      silo_storage: {
        capacity_mt: cargo.capacityMt,
        occupied_mt: cargo.occupiedMt,
        available_silo_balance_mt: cargo.availableSiloBalanceMt,
        overflow_facing_limited_storage_mt: cargo.overflowFacingLimitedStorageMt,
        utilization_pct: cargo.utilizationPct,
      },
      logistics: {
        loading_window: '06:00–14:00 IST next working day',
        suggested_route: `Farm-gate corridor → ${destinationHub} → designated overflow bay`,
        vehicle_class: 'Bulk grain trailer (22–28 MT)',
      },
      gate_pass_token: gatePassToken,
      confirmation: cargo.verified
        ? {
            message: 'x402 invoice settled. Official gate pass issued for surplus bulk cargo.',
            valid_for_hours: 24,
          }
        : {
            message: 'Payment settled but no allocatable surplus remains at this silo.',
            valid_for_hours: 0,
          },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in allocation agent:', error);
    return c.json({ error: 'Allocation agent failed' }, 500);
  }
}

/** @deprecated Use handleAIQuery — kept for template compatibility */
export async function handleAIAnalysisRequest(c: Context) {
  return handleAIQuery(c);
}

export async function handleAIAnalysisBatchRequest(c: Context) {
  try {
    console.log('✓ PAYMENT VERIFIED - POST /ai-analysis/batch handler executing');

    const body = await c.req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array required' }, 400);
    }

    const results = items.map((item: { commodity?: string; requestedMetricTons?: number }) => {
      const commodity = normalizeCommodity(item?.commodity);
      const requestedMetricTons = Number(item?.requestedMetricTons) > 0 ? Number(item.requestedMetricTons) : 50;
      return mockVerifyCargo(commodity, requestedMetricTons);
    });

    return c.json({
      batch_size: items.length,
      results,
      total_cost_usdc: 0.01 * items.length,
      paid_via_x402: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return c.json({ error: 'Batch analysis failed' }, 500);
  }
}
