import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { AgriUser } from './auth'

type FarmerTab = 'docs' | 'search' | 'track' | 'pay' | 'fasalbima'

interface FarmerDashboardProps {
  user: AgriUser
  onLogout: () => void
}

interface UploadedDocs {
  aadhaar?: string
  passbook?: string
  affidavit?: string
}

interface CenterDef {
  id: string
  name: string
  authority: string
  location?: string
  distanceKm?: string
  estimatedMsp?: string
}

const CENTERS: CenterDef[] = [
  { id: 'A', name: 'FCI Ludhiana Mandi Yard', authority: 'Central — FCI' },
  { id: 'B', name: 'NAFED Karnal Procurement Hub', authority: 'Central — NAFED' },
  { id: 'C', name: 'CWC Hisar Warehouse Gate', authority: 'State — Punjab/Haryana CWC' },
  { id: 'D', name: 'MARKFED Bathinda Centre', authority: 'State — MARKFED' },
]

interface QueueRow {
  centerId: string
  tokenNumber: string
  position: number
  waitMinutes: number
  status: 'queued' | 'sold' | 'cleared'
}

interface InsuranceClaim {
  id: string
  crop: string
  season: string
  damagePhoto?: string
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<FarmerTab>('docs')
  const [docs, setDocs] = useState<UploadedDocs>({})
  const [crop, setCrop] = useState('Wheat')
  const [variety, setVariety] = useState('PBW 725')
  const [qty, setQty] = useState('18')
  const [recommendedCenters, setRecommendedCenters] = useState<CenterDef[]>([])
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [customFormOpen, setCustomFormOpen] = useState(false)
  const [customCenterName, setCustomCenterName] = useState('')
  const [customAgency, setCustomAgency] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [customDistance, setCustomDistance] = useState('')
  const [customMsp, setCustomMsp] = useState('')
  const [applied, setApplied] = useState(false)
  const [queues, setQueues] = useState<QueueRow[]>([])
  const [soldAt, setSoldAt] = useState<string | null>(null)
  const [gatePassCenterId, setGatePassCenterId] = useState<string | null>(null)
  const [insuranceClaim, setInsuranceClaim] = useState<InsuranceClaim | null>(null)
  const [insuranceCrop, setInsuranceCrop] = useState('Wheat')
  const [insuranceSeason, setInsuranceSeason] = useState('Rabi')
  const [damagePhoto, setDamagePhoto] = useState('')

  const storageKey = `KrishiConnect_farmer_${user.name}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw)
        setDocs(saved.docs ?? {})
        setCrop(saved.crop ?? 'Wheat')
        setSelectedCenters([])
        setApplied(Boolean(saved.applied))
        setQueues(saved.queues ?? [])
        setSoldAt(saved.soldAt ?? null)
        setInsuranceClaim(saved.insuranceClaim ?? null)
      }
    } catch {
      /* ignore */
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ docs, crop, selectedCenters, applied, queues, soldAt, insuranceClaim }),
    )
  }, [storageKey, docs, crop, selectedCenters, applied, queues, soldAt, insuranceClaim])

  useEffect(() => () => {
    if (scanTimer.current) clearTimeout(scanTimer.current)
  }, [])

  useEffect(() => {
    if (!applied || soldAt) return
    const timer = setInterval(() => {
      setQueues((prev) =>
        prev.map((q) =>
          q.status === 'queued'
            ? {
                ...q,
                waitMinutes: Math.max(8, q.waitMinutes - 1),
                position: q.position > 1 && Math.random() > 0.7 ? q.position - 1 : q.position,
              }
            : q,
        ),
      )
    }, 4000)
    return () => clearInterval(timer)
  }, [applied, soldAt])

  const nav = [
    { id: 'docs' as const, label: 'Document Upload Hub' },
    { id: 'search' as const, label: 'Smart Search & Multi-Centre' },
    { id: 'track' as const, label: 'Live Procurement Track' },
    { id: 'pay' as const, label: 'Payment Status' },
  ]

  const submitInsuranceClaim = (e: React.FormEvent) => {
    e.preventDefault()
    setInsuranceClaim({
      id: `PMFBY-${Math.floor(1000 + Math.random() * 9000)}`,
      crop: insuranceCrop,
      season: insuranceSeason,
      damagePhoto: damagePhoto || undefined,
    })
  }

  const onFile = (key: keyof UploadedDocs, file?: File) => {
    if (!file) return
    setDocs((d) => ({ ...d, [key]: file.name }))
  }

  const toggleCenter = (id: string) => {
    setSelectedCenters((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const runProcurementScan = () => {
    if (isScanning) return
    if (scanTimer.current) clearTimeout(scanTimer.current)
    setIsScanning(true)
    setRecommendedCenters([])
    setSelectedCenters([])
    scanTimer.current = setTimeout(() => {
      setRecommendedCenters(CENTERS)
      setIsScanning(false)
      scanTimer.current = null
    }, 1500)
  }

  const addCustomCenter = () => {
    if (!customCenterName.trim() || !customAgency.trim() || !customLocation.trim() || !customDistance || !customMsp) return
    setRecommendedCenters((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customCenterName.trim(),
        authority: customAgency.trim(),
        location: customLocation.trim(),
        distanceKm: customDistance,
        estimatedMsp: customMsp,
      },
    ])
    setCustomCenterName('')
    setCustomAgency('')
    setCustomLocation('')
    setCustomDistance('')
    setCustomMsp('')
  }

  const findCenter = (id: string) =>
    CENTERS.find((center) => center.id === id) ?? recommendedCenters.find((center) => center.id === id)

  const openGoogleMapsRoute = (center: CenterDef) => {
    const origin = `${user.state}, India`
    const destination = `${center.name}, ${center.location ?? user.state}, India`
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  const applyCenters = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCenters.length === 0) return
    const next: QueueRow[] = selectedCenters.map((id, i) => ({
      centerId: id,
      tokenNumber: `TKN-${String(8492 + i * 137).padStart(4, '0')}`,
      position: 12 + i * 7,
      waitMinutes: 45 + i * 18,
      status: 'queued',
    }))
    setQueues(next)
    setApplied(true)
    setSoldAt(null)
    setTab('track')
  }

  const markSold = (centerId: string) => {
    setSoldAt(centerId)
    setQueues((prev) =>
      prev.map((q) => {
        if (q.centerId === centerId) return { ...q, status: 'sold', position: 0, waitMinutes: 0 }
        return { ...q, status: 'cleared', position: 0, waitMinutes: 0 }
      }),
    )
  }

  const gatePassQueue = gatePassCenterId ? queues.find((queue) => queue.centerId === gatePassCenterId) : undefined
  const gatePassCenter = gatePassQueue ? findCenter(gatePassQueue.centerId) : undefined

  const receipts = useMemo(() => {
    const payout = Number(qty) * 2275
    return [
      {
        id: 'MSP-4821',
        type: 'Crop sale disbursement',
        amount: soldAt ? `₹${payout.toLocaleString('en-IN')}` : 'Pending sale',
        destination: `${user.name} — linked passbook A/C (landlord blocked)`,
        status: soldAt ? 'Settled to farmer' : 'Awaiting procurement',
      },
      {
        id: 'PMFBY-1904',
        type: 'Disaster crop insurance',
        amount: '₹42,500',
        destination: `${user.name} — direct benefit transfer`,
        status: 'Paid',
      },
      ...(insuranceClaim
        ? [{
            id: insuranceClaim.id,
            type: 'PMFBY Fasal Bima crop insurance',
            amount: 'Policy active',
            destination: `${user.name} — ${insuranceClaim.crop} · ${insuranceClaim.season} season`,
            status: 'Policy locked · Claim active',
          }]
        : []),
    ]
  }, [qty, soldAt, user.name, insuranceClaim])

  return (
    <div className="farmer-shell min-h-screen flex flex-col md:flex-row">
      <aside className="farmer-sidebar">
        <div>
          <p className="text-amber-200/80 text-xs uppercase tracking-widest">100% free for farmers</p>
          <h1 className="text-2xl font-semibold text-white mt-1">KrishiConnect AI</h1>
          <p className="text-amber-100/80 text-sm mt-2">{user.name}</p>
          <p className="text-amber-200/70 text-xs">
            {user.userType} · {user.state} · {user.mobile}
          </p>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`farmer-nav ${tab === item.id ? 'farmer-nav-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className={`mt-6 w-full rounded-xl px-4 py-3 text-left font-semibold shadow-lg transition ${tab === 'fasalbima' ? 'bg-amber-300 text-amber-950 ring-2 ring-white/70' : 'bg-sky-600 text-white hover:bg-sky-500'}`}
          onClick={() => setTab('fasalbima')}
        >
          🛡️ Apply for PMFBY Fasal Bima
        </button>
        <button className="mt-auto agri-btn-ghost w-full" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {tab === 'docs' && (
          <section className="space-y-6 max-w-3xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Document Upload Hub</h2>
              <p className="text-amber-900/80 mt-1">
                Tenant farmers can complete land verification without any landlord signature.
              </p>
            </header>
            <UploadField
              title="Aadhaar Card"
              hint="Identity for MSP and DBT mapping"
              fileName={docs.aadhaar}
              onChange={(f) => onFile('aadhaar', f)}
            />
            <UploadField
              title="Bank Passbook"
              hint="Disbursements go only to this account"
              fileName={docs.passbook}
              onChange={(f) => onFile('passbook', f)}
            />
            <UploadField
              title="Tenant Farmer Affidavit / Land Verification Document"
              hint="Self-attested cultivation proof. Landlord signature is not required."
              fileName={docs.affidavit}
              onChange={(f) => onFile('affidavit', f)}
              emphasis
            />
          </section>
        )}

        {tab === 'search' && (
          <section className="space-y-6 max-w-3xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Smart Search & Multi-Centre Counseling</h2>
              <p className="text-amber-900/80 mt-1">
                Apply to several state and central procurement centres at once and bypass commission agents.
              </p>
            </header>
            <form onSubmit={applyCenters} className="glass-card p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Crop details</span>
                <select className="agri-input mt-1" value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option value="Wheat">Wheat (Rabi)</option>
                  <option value="Paddy / Rice">Paddy / Rice (Kharif)</option>
                  <option value="Mustard Seed">Mustard Seed (Rabi Oilseed)</option>
                  <option value="Gram / Chana">Gram / Chana (Rabi Pulse)</option>
                  <option value="Maize / Corn">Maize / Corn (Kharif Cereal)</option>
                  <option value="Bajra / Pearl Millet">Bajra / Pearl Millet (Kharif Coarse Grain)</option>
                  <option value="Cotton">Cotton (Commercial Fiber)</option>
                  <option value="Soybean">Soybean (Kharif Oilseed)</option>
                  <option value="Tur / Arhar">Tur / Arhar (Kharif Pulse)</option>
                  <option value="Barley">Barley (Rabi Cereal)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Variety</span>
                <input className="agri-input mt-1" value={variety} onChange={(e) => setVariety(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Quantity (quintals)</span>
                <input className="agri-input mt-1" value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <button
                type="button"
                className="agri-btn-primary w-full"
                onClick={runProcurementScan}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning mandis for best returns...' : '🔍 Run AI Procurement Agent & Match Best Centers'}
              </button>
              {isScanning && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 animate-pulse" role="status" aria-live="polite">
                  <p className="font-medium">AI agent scanning inter-state central and state mandis...</p>
                  <p className="text-sm mt-1">Comparing MSP returns and queue wait times for {crop}.</p>
                </div>
              )}
              {recommendedCenters.length > 0 && (
                <fieldset>
                  <legend className="text-sm font-medium text-amber-900 mb-2">AI-recommended centres</legend>
                  <div className="space-y-2">
                    {recommendedCenters.map((center) => (
                      <label key={center.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedCenters.includes(center.id)}
                          onChange={() => toggleCenter(center.id)}
                        />
                        <span>
                          <span className="font-medium text-amber-950">{center.name}</span>
                          <span className="block text-xs text-amber-800">{center.authority}</span>
                          {center.location && (
                            <span className="block text-xs text-amber-700 mt-1">
                              {center.location} · {center.distanceKm} km · Estimated MSP ₹{center.estimatedMsp}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="border-t border-amber-200 pt-4">
                <button
                  type="button"
                  className="agri-btn-ghost w-full text-left"
                  onClick={() => setCustomFormOpen((open) => !open)}
                  aria-expanded={customFormOpen}
                >
                  ➕ Add Custom Mandi / Centre Manually
                </button>
                {customFormOpen && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-4 space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-amber-900">Center Name</span>
                      <input className="agri-input mt-1" placeholder="Local District Mandi" value={customCenterName} onChange={(e) => setCustomCenterName(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-amber-900">Agency</span>
                      <input className="agri-input mt-1" placeholder="Private / State Coop" value={customAgency} onChange={(e) => setCustomAgency(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-amber-900">State Location</span>
                      <input className="agri-input mt-1" placeholder="Punjab, India" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} />
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-medium text-amber-900">Distance (km)</span>
                        <input className="agri-input mt-1" type="number" min="0" step="0.1" value={customDistance} onChange={(e) => setCustomDistance(e.target.value)} />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-amber-900">Estimated MSP (₹)</span>
                        <input className="agri-input mt-1" type="number" min="0" step="1" value={customMsp} onChange={(e) => setCustomMsp(e.target.value)} />
                      </label>
                    </div>
                    <button type="button" className="agri-btn-primary w-full" onClick={addCustomCenter}>
                      Add to Counseling List
                    </button>
                  </div>
                )}
              </div>
              <button type="submit" className="agri-btn-primary">
                Submit parallel applications
              </button>
            </form>
          </section>
        )}

        {tab === 'track' && (
          <section className="space-y-6">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Live Procurement Track & Dynamic Queue Management</h2>
              <p className="text-amber-900/80 mt-1">
                Parallel queues update together. Selling at one centre immediately clears you from the others.
              </p>
            </header>
            {!applied && (
              <p className="glass-card p-6 text-amber-900">Apply from Smart Search first to join live queues.</p>
            )}
            {applied && (
              <div className="grid lg:grid-cols-2 gap-6">
                {queues.map((q) => {
                  const center = findCenter(q.centerId)
                  const tokenNumber = q.tokenNumber ?? 'TKN-8492'
                  return (
                    <article key={q.centerId} className="queue-card">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-amber-700">Centre {q.centerId}</p>
                          <h3 className="text-xl font-semibold text-amber-950">{center?.name}</h3>
                        </div>
                        <span className={`queue-pill queue-pill-${q.status}`}>{q.status}</span>
                      </div>
                      {q.status === 'queued' ? (
                        <>
                          <div className="inline-flex items-center rounded-lg bg-emerald-950 px-4 py-2 mt-4 text-lg font-bold tracking-wide text-white shadow-sm">
                            #{tokenNumber}
                          </div>
                          <p className="text-5xl font-semibold text-amber-900 mt-4">#{q.position}</p>
                          <p className="text-amber-800">Expected wait ≈ {q.waitMinutes} min</p>
                          <div className="flex flex-wrap gap-3 mt-4">
                            <button className="agri-btn-ghost" onClick={() => setGatePassCenterId(q.centerId)}>
                              Show Gate QR Code
                            </button>
                            {center && (
                              <button className="agri-btn-ghost" onClick={() => openGoogleMapsRoute(center)}>
                                Open Route in Google Maps
                              </button>
                            )}
                            <button className="agri-btn-primary" onClick={() => markSold(q.centerId)}>
                              Mark harvest sold here
                            </button>
                          </div>
                        </>
                      ) : q.status === 'sold' ? (
                        <p className="mt-4 text-emerald-800 font-medium">Sold. Direct MSP path opened for your passbook.</p>
                      ) : (
                        <p className="mt-4 text-slate-600">Name cleared from this queue after sale at another centre.</p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
            {gatePassQueue && gatePassCenter && (
              <GatePassModal
                user={user}
                crop={crop}
                variety={variety}
                queue={gatePassQueue}
                center={gatePassCenter}
                onClose={() => setGatePassCenterId(null)}
              />
            )}
          </section>
        )}

        {tab === 'pay' && (
          <section className="space-y-6 max-w-4xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Payment Status</h2>
              <p className="text-amber-900/80 mt-1">
                Crop sales and insurance payouts are mapped to the farmer bank account, not the landlord.
              </p>
            </header>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-100 text-amber-950">
                  <tr>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id} className="border-t border-amber-100">
                      <td className="p-3 font-mono">{r.id}</td>
                      <td className="p-3">{r.type}</td>
                      <td className="p-3">{r.amount}</td>
                      <td className="p-3">{r.destination}</td>
                      <td className="p-3 text-emerald-800">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'fasalbima' && (
          <section className="space-y-6 max-w-3xl">
            <header>
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">PMFBY crop protection</p>
              <h2 className="text-3xl font-semibold text-amber-950">Fasal Bima Application</h2>
              <p className="text-amber-900/80 mt-1">
                Protect your crop with a digital policy linked directly to your farmer account.
              </p>
            </header>
            {!insuranceClaim ? (
              <form onSubmit={submitInsuranceClaim} className="glass-card p-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-amber-900">Select Crop</span>
                  <select className="agri-input mt-1" value={insuranceCrop} onChange={(e) => setInsuranceCrop(e.target.value)}>
                    <option>Wheat</option>
                    <option>Paddy / Rice</option>
                    <option>Mustard Seed</option>
                    <option>Gram / Chana</option>
                    <option>Maize / Corn</option>
                    <option>Bajra / Pearl Millet</option>
                    <option>Cotton</option>
                    <option>Soybean</option>
                    <option>Tur / Arhar</option>
                    <option>Barley</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-amber-900">Season</span>
                  <select className="agri-input mt-1" value={insuranceSeason} onChange={(e) => setInsuranceSeason(e.target.value)}>
                    <option>Rabi</option>
                    <option>Kharif</option>
                    <option>Summer</option>
                  </select>
                </label>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
                  <p className="font-semibold">Verified Land &amp; Lease Records Loaded from Document Hub</p>
                  <p className="mt-1 text-sm">Premium subsidized by Govt (Only 1.5% - 2% farmer share).</p>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <span>
                    <span className="block font-semibold text-amber-950">📸 Upload Damage Photo (For Quick Claim)</span>
                    <span className="mt-1 block text-xs text-amber-800">Optional: attach a hailstorm or unseasonal rain photo.</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="max-w-[9rem] text-xs"
                    onChange={(e) => setDamagePhoto(e.target.files?.[0]?.name ?? '')}
                  />
                </label>
                {damagePhoto && <p className="text-sm text-emerald-800">Damage photo ready: {damagePhoto}</p>}
                <button type="submit" className="agri-btn-primary w-full text-lg">
                  ⚡ 1-Click Fast-Track PMFBY Enrollment
                </button>
              </form>
            ) : (
              <div className="glass-card border-2 border-emerald-300 p-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Application successful</p>
                <h3 className="mt-2 text-2xl font-semibold text-amber-950">Your x402 insurance policy is locked</h3>
                <p className="mt-2 text-amber-900/80">
                  {insuranceClaim.crop} · {insuranceClaim.season} policy enrolled using your verified land and lease records.
                </p>
                <button type="button" className="agri-btn-primary mt-5" onClick={() => setTab('pay')}>
                  View Claim Status &amp; Payout ➔
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

const QR_PATTERN = [
  '111111100101101111111',
  '100000101110101100001',
  '101110100010101101101',
  '101110101011101101101',
  '101110100110101101101',
  '100000101010101100001',
  '111111101010101111111',
  '000000001101100000000',
  '110101111001011010111',
  '001011001111100101001',
  '111100111010111100110',
  '010011001101001011010',
  '101110111011101110101',
  '000000001010100000000',
  '111111101101111111111',
  '100000100011001000001',
  '101110101110101011101',
  '101110100101101011101',
  '101110101011001011101',
  '100000101110101000001',
  '111111101001101111111',
]

function GatePassModal({
  user,
  crop,
  variety,
  queue,
  center,
  onClose,
}: {
  user: AgriUser
  crop: string
  variety: string
  queue: QueueRow
  center: CenterDef
  onClose: () => void
}) {
  const tokenNumber = queue.tokenNumber ?? 'TKN-8492'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="gate-pass-title">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-amber-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Digital Entry Gate Pass</p>
            <h3 id="gate-pass-title" className="mt-1 text-2xl font-semibold text-amber-950">Mandi weighbridge verification</h3>
          </div>
          <button type="button" className="agri-btn-ghost" onClick={onClose} aria-label="Close gate pass">
            Close
          </button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="rounded-xl border-8 border-emerald-950 bg-white p-3 shadow-inner" aria-label="Simulated QR code">
            <svg viewBox="0 0 21 21" className="w-full" role="img" aria-label="Simulated gate pass QR code">
              {QR_PATTERN.flatMap((row, y) =>
                [...row].flatMap((cell, x) => cell === '1' ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#062e26" />] : []),
              )}
            </svg>
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-950">Scan or verify token manually</p>
          </div>
          <div className="space-y-4 text-amber-950">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-700">Token number</p>
              <p className="mt-1 inline-block rounded-lg bg-emerald-950 px-4 py-2 text-2xl font-bold tracking-wide text-white">#{tokenNumber}</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold text-amber-800">Farmer</dt><dd>{user.name}</dd>
              <dt className="font-semibold text-amber-800">Mobile</dt><dd>{user.mobile}</dd>
              <dt className="font-semibold text-amber-800">Crop</dt><dd>{crop} · {variety} · {queue.position > 0 ? `${queue.position} in queue` : 'Application active'}</dd>
              <dt className="font-semibold text-amber-800">Centre</dt><dd>{center.name}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadField({
  title,
  hint,
  fileName,
  onChange,
  emphasis,
}: {
  title: string
  hint: string
  fileName?: string
  onChange: (file?: File) => void
  emphasis?: boolean
}) {
  return (
    <label className={`glass-card p-6 block cursor-pointer ${emphasis ? 'ring-2 ring-amber-400' : ''}`}>
      <span className="block text-lg font-semibold text-amber-950">{title}</span>
      <span className="block text-sm text-amber-800 mt-1">{hint}</span>
      <input
        type="file"
        className="mt-4 block w-full text-sm"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {fileName && <span className="mt-2 inline-block text-emerald-800 text-sm">Uploaded: {fileName}</span>}
    </label>
  )
}

export default FarmerDashboard
