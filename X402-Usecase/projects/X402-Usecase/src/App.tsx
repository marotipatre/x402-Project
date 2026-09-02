import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { useMemo } from 'react'
import AgriApp from './agri/AgriApp'

const supportedWallets: SupportedWallet[] = [
  { id: WalletId.DEFLY },
  { id: WalletId.PERA },
  { id: WalletId.EXODUS },
  { id: WalletId.LUTE }
]

export default function App() {
  // Hardcoded production-safe testnet fallback to bypass missing Vercel .env files
  const algodConfig = {
    network: 'testnet',
    server: 'https://algonode.cloud',
    port: 443,
    token: ''
  }

  const walletManager = useMemo(
    () =>
      new WalletManager({
        wallets: supportedWallets,
        defaultNetwork: algodConfig.network,
        networks: {
          [algodConfig.network]: {
            algod: {
              baseServer: algodConfig.server,
              port: String(algodConfig.port),
              token: algodConfig.token,
            },
          },
        },
        options: {
          resetNetwork: true,
        },
      }),
    [algodConfig.network, algodConfig.server, algodConfig.port, algodConfig.token],
  )

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <AgriApp />
      </WalletProvider>
    </SnackbarProvider>
  )
}
