import React, { useState } from 'react'

const PILLARS = [
  {
    title: 'Cross-border procurement',
    body: 'Coordinate grain movement across state mandis and national corridors with a single farmer-first identity.',
  },
  {
    title: 'Multi-centre counseling',
    body: 'Compare FCI, NAFED, CWC and state yards in one queue so farmers are not locked to a single gate.',
  },
  {
    title: 'Tenant farmer insurance protection',
    body: 'Map PMFBY and MSP payouts to the cultivator, not the landlord, using self-attested land verification.',
  },
  {
    title: 'Consumer surplus market',
    body: 'Licensed buyers lift overflow stocks when silos are full, reducing wastage and improving price discovery.',
  },
]

interface AuthShellProps {
  children: React.ReactNode
}

const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  return (
    <div className="gov-auth-shell min-h-screen flex flex-col lg:flex-row">
      <section className="gov-auth-brand lg:w-[46%] xl:w-[42%] p-8 lg:p-12 flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-800 font-semibold">
          Government of India · Agriculture portal
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-semibold text-emerald-950 leading-tight">KrishiConnect AI</h1>
        <p className="mt-3 text-emerald-900/80 max-w-md">
          National grain procurement, tenant protection and surplus offtake — designed for farmers and licensed
          commercial buyers.
        </p>
        <ul className="mt-8 space-y-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="gov-pillar">
              <p className="font-semibold text-emerald-950">{pillar.title}</p>
              <p className="text-sm text-emerald-900/75 mt-1">{pillar.body}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="gov-how-link mt-8 self-start" onClick={() => setShowHowItWorks(true)}>
          How it works?
        </button>
      </section>

      <section className="flex-1 flex items-center justify-center p-6 lg:p-12">{children}</section>

      {showHowItWorks && (
        <div className="gov-modal-backdrop" role="presentation" onClick={() => setShowHowItWorks(false)}>
          <div
            className="gov-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-it-works-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="how-it-works-title" className="text-2xl font-semibold text-emerald-950">
              How KrishiConnect works
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-emerald-900/90 list-decimal pl-5">
              <li>Register with a unique mobile number, state and role. Farmers use the portal free of charge.</li>
              <li>Sign in with password or a one-time SMS code. Identity is bound to mobile, not just a display name.</li>
              <li>Farmers upload KYC, join multi-centre queues, and receive MSP or insurance to their own account.</li>
              <li>Consumers pay a Testnet USDC tech fee to deploy an allocation agent against surplus lots.</li>
            </ol>
            <button type="button" className="agri-btn-primary mt-6" onClick={() => setShowHowItWorks(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthShell
