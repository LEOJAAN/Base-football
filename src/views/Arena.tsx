import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useBaseTransaction } from '../hooks/useBaseTransaction';
import type { Team } from './TeamSelection';
import './Arena.css';

type Direction = 'left' | 'center' | 'right';
type Role = 'striker' | 'goalkeeper';
type MatchState = 'playing' | 'round_result' | 'game_over';
type StrikerState = 'idle' | 'running' | 'kicking';

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
  const [shotHistory, setShotHistory] = useState<('scored' | 'missed' | null)[]>(new Array(3).fill(null));
  const [crowdState, setCrowdState] = useState<'idle' | 'cheer' | 'slump'>('idle');
  
  const [matchState, setMatchState] = useState<MatchState>('playing');
  const [lastResult, setLastResult] = useState<string>('');
  const [ballPos, setBallPos] = useState<Direction | 'center'>('center');
  const [keeperPos, setKeeperPos] = useState<Direction | 'center'>('center');
  
  const [showTurnOverlay, setShowTurnOverlay] = useState(false);
  const [turnOverlayText, setTurnOverlayText] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [floatingFeedback, setFloatingFeedback] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // New animation states
  const [strikerState, setStrikerState] = useState<StrikerState>('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (matchState === 'playing') {
      const isPlayerTurn = role === 'striker';
      setTurnOverlayText(isPlayerTurn ? 'YOU ATTACK' : 'YOU DEFEND');
      setShowTurnOverlay(true);
      
      const timer = setTimeout(() => {
        setShowTurnOverlay(false);
        if (!isPlayerTurn) {
          setIsBotThinking(true);
          // Bot logic for choosing direction when it's the bot's turn to shoot
          setTimeout(() => {
            setIsBotThinking(false);
          }, 1200);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [role, round, matchState]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const showFeedback = (text: string, type: 'success' | 'danger' | 'info') => {
    setFloatingFeedback({ text, type });
    setTimeout(() => setFloatingFeedback(null), 1500);
  };

  const { sendActivityTransaction, isPending, isConfirming, isConfirmed, error } = useBaseTransaction();

  const handleAction = async (direction: Direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const aiChoice = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as Direction;
    let success = false;

    if (role === 'striker') {
      // 1. Start Running
      setStrikerState('running');
      // Wait for run to almost complete
      await new Promise(resolve => setTimeout(resolve, 750));

      // 2. Impact Frame (Kick) - Perfectly Synced
      setStrikerState('kicking');
      setBallPos(direction);
      setKeeperPos(aiChoice);
      showFeedback('BOOM! ⚽', 'info');

      if (direction !== aiChoice) {
        success = true;
      }
    } else {
      // Bot is striker
      setIsBotThinking(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsBotThinking(false);

      setKeeperPos(direction);
      setBallPos(aiChoice);
      showFeedback('INCOMING!', 'danger');

      if (direction !== aiChoice) {
        success = false;
      } else {
        success = true;
      }
    }

    // Wait for ball to reach goal
    await new Promise(resolve => setTimeout(resolve, 800));

    if (role === 'striker') {
      if (success) {
        setPlayerScore(prev => prev + 1);
        setLastResult('GOAL!');
        setCrowdState('cheer');
        triggerShake();
      } else {
        setLastResult('SAVED!');
        setCrowdState('slump');
        showFeedback('DENIED!', 'danger');
      }
    } else {
      if (!success) {
        setAiScore(prev => prev + 1);
        setLastResult('SCORED!');
        setCrowdState('slump');
        triggerShake();
      } else {
        setLastResult('SAVED!');
        setCrowdState('cheer');
        showFeedback('MASTERCLASS!', 'success');
      }
    }

    // Update shot history
    if (round <= 3) {
      const newHistory = [...shotHistory];
      newHistory[round - 1] = success ? 'scored' : 'missed';
      setShotHistory(newHistory);
    }

    setMatchState('round_result');
    setIsAnimating(false);

    setTimeout(() => {
      advanceRound();
    }, 2000);
  };

  const advanceRound = () => {
    setBallPos('center');
    setKeeperPos('center');
    setStrikerState('idle');
    setCrowdState('idle');
    
    if (role === 'striker') {
      setRole('goalkeeper');
      setMatchState('playing');
    } else {
      if (round >= 3) {
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

  // Animation Variants
  const strikerVariants: Variants = {
    idle: { 
      y: 0, 
      x: '-50%', 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    running: { 
      y: -155, 
      x: '-50%', 
      scale: 0.55,
      transition: { 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    kicking: { 
      y: -155,
      x: '-50%',
      scale: 0.55,
      transition: { duration: 0.1 } 
    }
  };

  const keeperVariants: Variants = {
    center: { x: '-50%', y: 0, rotate: 0, scale: 1 },
    left: { 
      x: '-220%', 
      y: 60, 
      rotate: -95, 
      scale: 0.85,
      transition: { type: "spring", stiffness: 150, damping: 15 }
    },
    right: { 
      x: '120%', 
      y: 60, 
      rotate: 95, 
      scale: 0.85,
      transition: { type: "spring", stiffness: 150, damping: 15 }
    }
  };

  const ballVariants: Variants = {
    center: { bottom: '25%', left: '50%', scale: 1, rotate: 0 },
    left: { 
      bottom: '68%', 
      left: '25%', 
      scale: 0.35, 
      rotate: 1080,
      transition: { duration: 0.6, ease: "easeOut" } 
    },
    right: { 
      bottom: '68%', 
      left: '75%', 
      scale: 0.35, 
      rotate: -1080,
      transition: { duration: 0.6, ease: "easeOut" } 
    },
    'center-goal': { 
      bottom: '68%', 
      left: '50%', 
      scale: 0.35, 
      rotate: 720,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  return (
    <div 
      className={`arena-container role-${role} ${isShaking ? 'shake-active' : ''}`} 
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
          <div className="turn-indicators">
            <div className={`indicator player ${matchState === 'playing' && role === 'striker' && !isBotThinking ? 'active pulse' : ''}`}>
               YOUR TURN
            </div>
            <div className={`indicator bot ${matchState === 'playing' && (role === 'goalkeeper' || isBotThinking) ? 'active pulse' : ''}`}>
               BOT'S TURN
            </div>
          </div>
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

        <div className="status-label-container">
          <div className="status-label animate-fade-in">
            {role === 'striker' ? (
              <span className="text-striker">YOUR TURN: Choose where to shoot! ⚽</span>
            ) : (
              <span className="text-keeper">WATCH OUT: Guess where the bot will kick! 🧤</span>
            )}
          </div>
        </div>
      </div>

      <div className="pitch">
        <div className="goal-post">
          <div className="net"></div>
        </div>
        
        <motion.div 
          className="keeper"
          variants={keeperVariants}
          animate={keeperPos === 'center' ? 'center' : keeperPos}
          initial="center"
        >
           <div className="keeper-character">
              <svg viewBox="0 0 100 120" className="keeper-svg">
                {/* Body */}
                <rect x="25" y="40" width="50" height="60" rx="10" fill="#f97316" stroke="#000" strokeWidth="2" />
                {/* Head */}
                <circle cx="50" cy="25" r="15" fill="#fb923c" stroke="#000" strokeWidth="2" />
                {/* Gloves */}
                <rect x="10" y="50" width="15" height="20" rx="4" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="75" y="50" width="15" height="20" rx="4" fill="#fff" stroke="#000" strokeWidth="2" />
                {/* Shorts */}
                <rect x="25" y="85" width="50" height="15" fill="#000" />
              </svg>
           </div>
        </motion.div>
        
        <motion.div 
          className={`ball ${role === 'striker' ? 'ball-user' : 'ball-bot'}`}
          variants={ballVariants}
          animate={ballPos === 'center' ? (matchState === 'playing' ? 'center' : 'center-goal') : ballPos}
          initial="center"
        >
          <div className="ball-trail"></div>
        </motion.div>

        <AnimatePresence>
          {floatingFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 0, x: '-50%' }}
              animate={{ opacity: 1, y: -100, x: '-50%' }}
              exit={{ opacity: 0 }}
              className={`floating-feedback feedback-${floatingFeedback.type}`}
            >
              {floatingFeedback.text}
            </motion.div>
          )}
        </AnimatePresence>

        {role === 'striker' && (
          <motion.div 
            className={`striker-foreground ${strikerState}`}
            variants={strikerVariants}
            animate={strikerState}
            initial="idle"
          >
             <div className="striker-character">
                <svg viewBox="0 0 100 150" className="striker-svg">
                  {/* Legs */}
                  <g className="striker-legs">
                    <rect x="30" y="100" width="15" height="40" fill="#222" className="leg-left" />
                    <rect x="55" y="100" width="15" height="40" fill="#222" className="leg-right" />
                  </g>
                  {/* Body */}
                  <rect x="20" y="40" width="60" height="70" rx="12" fill="var(--team-color)" stroke="#000" strokeWidth="2" />
                  {/* Head */}
                  <circle cx="50" cy="25" r="18" fill="#fbbf24" stroke="#000" strokeWidth="2" />
                  {/* Arms */}
                  <rect x="5" y="50" width="15" height="40" rx="5" fill="var(--team-color)" stroke="#000" strokeWidth="1" className="arm-left" />
                  <rect x="80" y="50" width="15" height="40" rx="5" fill="var(--team-color)" stroke="#000" strokeWidth="1" className="arm-right" />
                  {/* Number 9 */}
                  <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="35" fontWeight="900">9</text>
                </svg>
             </div>
          </motion.div>
        )}
      </div>

      {matchState === 'playing' && (
        <div className={`controls ${isBotThinking || isAnimating ? 'disabled' : ''}`}>
          <div className="control-buttons">
            <button className="control-btn" onClick={() => handleAction('left')} disabled={isBotThinking || isAnimating}>
              {role === 'striker' ? 'SHOOT LEFT' : 'DIVE LEFT'}
            </button>
            <button className="control-btn" onClick={() => handleAction('center')} disabled={isBotThinking || isAnimating}>
              {role === 'striker' ? 'SHOOT CENTER' : 'STAY CENTER'}
            </button>
            <button className="control-btn" onClick={() => handleAction('right')} disabled={isBotThinking || isAnimating}>
              {role === 'striker' ? 'SHOOT RIGHT' : 'DIVE RIGHT'}
            </button>
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

      {showTurnOverlay && (
        <div className="turn-overlay animate-fade-in-out">
          <h1>{turnOverlayText}</h1>
        </div>
      )}
    </div>
  );
}
