import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: (username: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();
  const [username, setUsername] = useState('');

  const isWrongNetwork = isConnected && chainId !== base.id;

  const handleStart = () => {
    if (username.trim().length > 0) {
      onComplete(username.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-bg"></div>
      
      <div className="glass-panel onboarding-panel animate-fade-in">
        <div className="logo-container">
          <div className="base-logo-mock"></div>
          <h1>Base Penalty Arena</h1>
          <p className="subtitle">High-tech football on the Base network</p>
        </div>

        <div className="action-container">
          {!isConnected ? (
            <div className="step-container">
              <p>Connect your wallet to enter the arena.</p>
              <button className="primary-btn connect-btn" onClick={() => open()}>
                Connect Wallet
              </button>
            </div>
          ) : isWrongNetwork ? (
            <div className="step-container error-state">
              <p className="error-text">You are currently on Ethereum or an unsupported network. Please switch to the Base network to continue.</p>
              <button 
                className="primary-btn switch-btn" 
                onClick={() => switchChain({ chainId: base.id })}
              >
                Switch to Base
              </button>
            </div>
          ) : (
            <div className="step-container ready-state">
              <div className="wallet-status">
                <span className="status-dot green"></span>
                Connected to Base: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              
              <div className="input-group">
                <label htmlFor="username">Player Name</label>
                <input 
                  id="username"
                  type="text" 
                  className="text-input"
                  placeholder="Enter username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={16}
                />
              </div>

              <button 
                className="primary-btn start-btn" 
                onClick={handleStart}
                disabled={username.trim().length === 0}
              >
                Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
