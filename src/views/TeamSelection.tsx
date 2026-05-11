import React, { useState } from 'react';
import './TeamSelection.css';
import './Arena.css'; // Import Arena styles for the background

export interface Team {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  logo: React.ReactNode;
}

export const teams: Team[] = [
  {
    id: 'aerodrome',
    name: 'Aerodrome',
    primaryColor: '#0052FF',
    secondaryColor: '#FFFFFF',
    description: 'The central trading and liquidity marketplace on Base.',
    logo: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  {
    id: 'aave',
    name: 'Aave',
    primaryColor: '#B6509E',
    secondaryColor: '#F1E1EC',
    description: 'A decentralized non-custodial liquidity market protocol.',
    logo: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.134 2 5 5.134 5 9v11a2 2 0 002 2h2v-3h2v3h2v-3h2v3h2a2 2 0 002-2V9c0-3.866-3.134-7-7-7zm-3 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
      </svg>
    ) // Aave ghost representation
  },
  {
    id: 'across',
    name: 'Across Protocol',
    primaryColor: '#00223A',
    secondaryColor: '#FF3366',
    description: 'Fastest, cheapest and most secure cross-chain bridge.',
    logo: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h16M4 12l4-4m-4 4l4 4M20 12l-4-4m4 4l-4 4" />
      </svg>
    ) // Simple bridge/across arrows
  },
  {
    id: '0xsplits',
    name: '0xSplits',
    primaryColor: '#00C48C',
    secondaryColor: '#FFFFFF',
    description: 'Trustless, composable, and gas-efficient routing.',
    logo: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
      </svg>
    ) // Splitting representation
  }
];

interface TeamSelectionProps {
  onSelectTeam: (teamId: string) => void;
  username: string;
}

export function TeamSelection({ onSelectTeam, username }: TeamSelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelectTeam(selectedId);
    }
  };

  return (
    <div className="team-selection-container arena-container">
      <div className="stadium-bg" style={{ opacity: 0.7 }}>
        <div className="crowd-stands">
          <div className="pixel-crowd idle"></div>
          <div className="pixel-crowd idle"></div>
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

      <div className="pitch-camera-wrapper" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.7 }}>
        <div className="pitch">
          <div className="goal-post">
            <div className="net"></div>
          </div>
        </div>
      </div>

      <div className="header-section animate-fade-in" style={{ position: 'relative', zIndex: 10 }}>
        <h2 style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Welcome, {username}!</h2>
        <p style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Select your protocol to represent in the Arena.</p>
      </div>

      <div className="teams-grid" style={{ position: 'relative', zIndex: 10 }}>
        {teams.map((team, index) => (
          <div 
            key={team.id}
            className={`team-card glass-panel ${selectedId === team.id ? 'selected' : ''}`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              borderColor: selectedId === team.id ? team.primaryColor : 'var(--glass-border)',
              boxShadow: selectedId === team.id ? `0 0 25px ${team.primaryColor}80` : 'none'
            }}
            onClick={() => setSelectedId(team.id)}
          >
            <div 
              className="team-logo-container" 
              style={{ background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})` }}
            >
              {team.logo}
            </div>
            <h3>{team.name}</h3>
            <p className="team-desc">{team.description}</p>
            
            <div className="kit-preview">
              <span className="kit-shirt" style={{ background: team.primaryColor }}></span>
              <span className="kit-shorts" style={{ background: team.secondaryColor }}></span>
            </div>
          </div>
        ))}
      </div>

      <div className="action-bar animate-fade-in" style={{ animationDelay: '0.5s', position: 'relative', zIndex: 10 }}>
        <button 
          className="primary-btn confirm-team-btn" 
          disabled={!selectedId}
          onClick={handleConfirm}
        >
          Enter Arena
        </button>
      </div>
    </div>
  );
}
