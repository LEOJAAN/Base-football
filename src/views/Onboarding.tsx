import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import './Onboarding.css';
import './Arena.css'; // Import Arena styles for the background

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
    <div className="onboarding-container arena-container" style={{ '--team-color': '#0052FF' } as React.CSSProperties}>
      <div className="stadium-bg">
        <div className="crowd-stands">
          <div className="pixel-crowd idle"></div>
          <div className="pixel-crowd idle team-section"></div>
          <div className="pixel-crowd idle"></div>
        </div>
        <div className="fence-overlay"></div>
        <div className="pitch-surface"></div>
        
        <div className="ad-boards">
          <div className="ad-track">
            {[1, 2].map((i) => (
              <div key={i} className="ad-group" style={{ display: 'flex' }}>
                <div className="ad-item"><span className="base-icon">●</span> BASE APP</div>
                <div className="ad-item"><span className="aero-icon">▲</span> AERODROME</div>
                <div className="ad-item"><span className="aave-icon">👻</span> AAVE</div>
                <div className="ad-item"><span className="base-icon">●</span> BUILT ON BASE</div>
                <div className="ad-item"><span className="aero-icon">◆</span> ACROSS</div>
                <div className="ad-item">0xSPLITS</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pitch-camera-wrapper" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div className="pitch">
          <div className="goal-post">
            <div className="net"></div>
          </div>
        </div>
      </div>
      
      <div className="glass-panel onboarding-panel animate-fade-in" style={{ zIndex: 10 }}>
        <div className="logo-container">
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
