import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { base } from 'wagmi/chains';

// Get a project ID at https://cloud.walletconnect.com
// We'll use a public shared/demo one for this scope, or the user can replace it.
export const projectId = 'b56e18d47c72ab683b1081546738b5d3';

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'Base Penalty Arena',
  description: 'A dynamic penalty shootout game on Base',
  url: 'https://base-penalty-arena.vercel.app', 
  icons: ['https://avatars.githubusercontent.com/u/108554201']
};

export const chains = [base] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  auth: {
    email: true, // default to true
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    showWallets: true,
    walletFeatures: true,
  },
  ssr: false,
  storage: createStorage({
    storage: cookieStorage
  }),
});
