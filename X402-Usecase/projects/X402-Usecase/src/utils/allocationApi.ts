import { createX402Fetch } from './weatherApi'

export async function deployAllocationAgent(
  url: string,
  walletSigner: any,
  payload: {
    commodity: string
    requestedMetricTons: number
    destinationHub: string
  },
): Promise<Record<string, unknown>> {
  const fetchFn = await createX402Fetch(walletSigner)
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Allocation agent HTTP ${response.status}`)
  }

  return response.json()
}
