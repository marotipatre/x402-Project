import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from '../components/ConnectWallet'
import { deployAllocationAgent } from '../utils/allocationApi'
import type { AgriUser } from './auth'

interface ConsumerDashboardProps {
  user: AgriUser
  onLogout: () => void
}

const INVENTORY = [
  {
    id: 'WHT-OF-01',
    crop: 'Wheat',
    hub: 'Ludhiana FCI Surplus Yard',
    mt: 1840,
    spot: '₹1,840 / qtl',
    mspNote: 'Overflow vs MSP corridor — reduced commercial spot',
    utilization: '93.5% silos full',
  },
  {
    id: 'RCE-OF-07',
    crop: 'Rice',
    hub: 'Karnal Central Warehouse',
    mt: 1260,
    spot: '₹2,110 / qtl',
    mspNote: 'Limited storage capacity — priority lift',
    utilization: '96.2% silos full',
  },
  {
    id: 'PDY-OF-03',
    crop: 'Paddy',
    hub: 'Hisar CWC Overflow Bay',
    mt: 720,
    spot: '₹1,620 / qtl',
    mspNote: 'Harvest surge lot',
    utilization: '93.4% silos full',
  },
]

const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ user, onLogout }) => {
  const { activeAddress, signTransactions } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [selected, setSelected] = useState(INVENTORY[0])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  const deploy = async () => {
    setError('')
    setResult(null)

    if (!activeAddress) {
      setOpenWalletModal(true)
      setError('Connect Pera or Defly on Algorand TestNet, then deploy the agent.')
      return
    }
    if (!signTransactions) {
      setError('Wallet does not support transaction signing')
      return
    }

    setLoading(true)
    try {
      setStatus('Opening x402 checkout…')
      const data = await deployAllocationAgent(
        `${apiBaseUrl}/ai-query`,
        { address: activeAddress, signTransactions },
        {
          commodity: selected.crop.toLowerCase(),
          requestedMetricTons: Math.min(250, selected.mt),
          destinationHub: selected.hub,
        },
      )
      setStatus('Settlement confirmed on TestNet.')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Allocation failed')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  const gatePass =
    result && typeof result.gate_pass_token === 'string' ? result.gate_pass_token : null

  return (
    <div className="consumer-shell min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-amber-200 bg-white/80 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">x402 monetization engine</p>
          <h1 className="text-2xl font-semibold text-amber-950">KrishiConnect Surplus Marketplace</h1>
          <p className="text-sm text-amber-800">
            {user.name} · {user.state} · {user.mobile} · Commercial buyer · Testnet USDC tech fee $0.01
          </p>
        </div>
        <div className="flex gap-2">
          <button className="agri-btn-secondary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress ? `Wallet ${activeAddress.slice(0, 8)}…` : 'Connect Pera / Defly'}
          </button>
          <button className="agri-btn-ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-amber-950 mb-4">Live government surplus overflow</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {INVENTORY.map((lot) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => setSelected(lot)}
                className={`text-left glass-card p-5 transition ${
                  selected.id === lot.id ? 'ring-2 ring-amber-500' : 'hover:ring-1 hover:ring-amber-300'
                }`}
              >
                <p className="text-xs text-amber-700">{lot.id}</p>
                <h3 className="text-2xl font-semibold text-amber-950">{lot.crop}</h3>
                <p className="text-sm text-amber-800 mt-1">{lot.hub}</p>
                <p className="mt-3 text-lg font-medium">{lot.mt.toLocaleString()} MT overflow</p>
                <p className="text-emerald-800 font-semibold">{lot.spot}</p>
                <p className="text-xs text-amber-700 mt-2">{lot.utilization}</p>
                <p className="text-xs mt-1">{lot.mspNote}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-amber-950">Deploy allocation agent</h2>
          <p className="text-amber-900">
            Selected lot: <strong>{selected.crop}</strong> at {selected.hub}. Checkout uses this
            repository&apos;s x402 middleware. Sign the $0.01 Testnet USDC invoice in Pera or Defly.
          </p>
          <button className="agri-btn-primary text-lg px-6 py-4 w-full md:w-auto" onClick={deploy} disabled={loading}>
            {loading ? 'Settling x402 invoice…' : '🌾 Deploy Allocation Agent to Secure Surplus Bulk Cargo ($0.01 Testnet USDC)'}
          </button>
          {status && <p className="text-amber-800">{status}</p>}
          {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </section>

        {gatePass && (
          <section className="gate-pass">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-100">Official gate pass token</p>
            <p className="font-mono text-2xl md:text-3xl text-white mt-2 break-all">{gatePass}</p>
            <p className="text-amber-100 mt-3 text-sm">Present this token at the overflow bay after x402 settlement.</p>
          </section>
        )}

        {result && (
          <pre className="glass-card p-4 text-xs overflow-auto text-amber-950">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </div>
  )
}

export default ConsumerDashboard
