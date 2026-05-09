import { useState } from 'react';
import { useBaseTransaction } from '../hooks/useBaseTransaction';
import type { Team } from './TeamSelection';
import './Arena.css';

type Direction = 'left' | 'center' | 'right';
type Role = 'striker' | 'goalkeeper';
type MatchState = 'playing' | 'round_result' | 'game_over';

interface ArenaProps {
  selectedTeam: Team;
  username: string;
  onRestart: () => void;
}

export function Arena({ selectedTeam, username, onRestart }: ArenaProps) {
  const [round, setRound] = useState<number>(1);
  const [role, setRole] = useState<Role>('striker');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [shotHistory, setShotHistory] = useState<('scored' | 'missed' | null)[]>(new Array(5).fill(null));
  const [crowdState, setCrowdState] = useState<'idle' | 'cheer' | 'slump'>('idle');
  
  const [matchState, setMatchState] = useState<MatchState>('playing');
  const [lastResult, setLastResult] = useState<string>('');
  const [ballPos, setBallPos] = useState<string>('center');
  const [keeperPos, setKeeperPos] = useState<string>('center');

  const { sendActivityTransaction, isPending, isConfirming, isConfirmed, error } = useBaseTransaction();

  const handleAction = (direction: Direction) => {
    const aiChoice = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as Direction;
    let success = false;

    if (role === 'striker') {
      setBallPos(direction);
      setKeeperPos(aiChoice);
      if (direction !== aiChoice) {
        setPlayerScore(prev => prev + 1);
        setLastResult('GOAL!');
        success = true;
        setCrowdState('cheer');
      } else {
        setLastResult('SAVED!');
        setCrowdState('slump');
      }
    } else {
      setKeeperPos(direction);
      setBallPos(aiChoice);
      if (direction !== aiChoice) {
        setAiScore(prev => prev + 1);
        setLastResult('SCORED!');
        setCrowdState('slump');
      } else {
        setLastResult('SAVED!');
        success = true;
        setCrowdState('cheer');
      }
    }

    // Update shot history for the first 5 rounds (UI limit)
    if (round <= 5) {
      const newHistory = [...shotHistory];
      newHistory[round - 1] = success ? 'scored' : 'missed';
      setShotHistory(newHistory);
    }

    setMatchState('round_result');

    setTimeout(() => {
      advanceRound();
    }, 2500);
  };

  const advanceRound = () => {
    setBallPos('center');
    setKeeperPos('center');
    setCrowdState('idle');
    
    if (role === 'striker') {
      setRole('goalkeeper');
      setMatchState('playing');
    } else {
      if (round >= 5) { // Played 5 rounds as per the scoreboard UI
        setMatchState('game_over');
      } else {
        setRole('striker');
        setRound(prev => prev + 1);
        setMatchState('playing');
      }
    }
  };

  const isWin = playerScore > aiScore;
  const isDraw = playerScore === aiScore;

  return (
    <div 
      className="arena-container" 
      style={{ '--team-color': selectedTeam.primaryColor } as React.CSSProperties}
    >
      <div className="stadium-bg">
        <div className="crowd-stands">
          <div className={`pixel-crowd ${crowdState}`}></div>
          <div className={`pixel-crowd ${crowdState} team-section`}></div>
          <div className={`pixel-crowd ${crowdState}`}></div>
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
      
      <div className="hud">
        <div className="score-board">
          <div className="score-main">
            <div className="score-team">{username.toUpperCase() || 'BASED STRIKER'}</div>
            <div className="score-center">
              <span>{playerScore}</span>
              <span>:</span>
              <span>{aiScore}</span>
            </div>
            <div className="score-team">BOT</div>
          </div>
          <div className="score-history">
            <div className="history-set">
              {shotHistory.map((status, i) => (
                <div key={i} className={`history-dot ${status || ''}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div className="pitch">
        <div className="goal-post">
          <div className="net"></div>
        </div>
        
        <div className={`keeper pos-${keeperPos}`}>
           <div className="keeper-body"></div>
        </div>
        
        <div className={`ball pos-${ballPos}`}></div>

        {role === 'striker' && matchState === 'playing' && (
          <div className="striker-foreground animate-fade-in">
             <div className="striker-body">
                <span className="striker-number">9</span>
             </div>
          </div>
        )}
      </div>

      {matchState === 'playing' && (
        <div className="controls">
          <div className="control-buttons">
            <button className="control-btn" onClick={() => handleAction('left')}>LEFT</button>
            <button className="control-btn" onClick={() => handleAction('center')}>CENTER</button>
            <button className="control-btn" onClick={() => handleAction('right')}>RIGHT</button>
          </div>
        </div>
      )}

      {matchState === 'round_result' && (
        <div className="result-overlay animate-fade-in">
          <h1 className={lastResult.includes('GOAL') || (lastResult === 'SAVED!' && role === 'goalkeeper') ? 'text-success' : 'text-danger'}>
            {lastResult}
          </h1>
        </div>
      )}

      {matchState === 'game_over' && (
        <div className={`game-over-overlay animate-fade-in ${isWin ? 'victory-screen' : ''}`}>
          {isWin && (
            <div className="celebration-layer">
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
            </div>
          )}
          
          <div className="end-game-content">
            <h2 className={isWin ? 'victory-text' : ''}>
              {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
            </h2>
            
            <p className="final-score">Final Score: {playerScore} - {aiScore}</p>
            
            <div className="end-game-actions">
              {!isConfirmed ? (
                <button 
                  className="futuristic-panel-btn action-primary"
                  onClick={() => sendActivityTransaction()}
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? 'CONNECTING...' : 'SUBMIT PERFORMANCE'}
                </button>
              ) : (
                <div className="tx-status-panel">
                  RECORDED ON-CHAIN
                </div>
              )}
              
              <button className="futuristic-panel-btn action-secondary" onClick={onRestart}>
                PLAY AGAIN
              </button>
            </div>

            {error && <p className="error-text">Failed. Try again.</p>}
          </div>
        </div>
      )}

    </div>
  );
}


