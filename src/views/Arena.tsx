import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useBaseTransaction } from '../hooks/useBaseTransaction';
import type { Team } from './TeamSelection';
import './Arena.css';

type Direction = 'left' | 'center' | 'right';
type Role = 'striker' | 'goalkeeper';
type MatchState = 'playing' | 'round_result' | 'game_over';
type StrikerState = 'idle' | 'running' | 'kicking' | 'exit';
type KeeperReaction = 'idle' | 'catch' | 'missed';

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

  const [isNetShaking, setIsNetShaking] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [keeperReaction, setKeeperReaction] = useState<KeeperReaction>('idle');
  
  // Character mapping based on protocol
  const getCharacters = () => {
    switch(selectedTeam.id) {
      case 'aerodrome': return { striker: 'Messi', keeper: 'Donnarumma', kit: '#0052FF', skin: '#fbbf24' };
      case 'aave': return { striker: 'Neymar', keeper: 'Courtois', kit: '#B6509E', skin: '#8d5524' };
      case 'across': return { striker: 'Ronaldo', keeper: 'Sommer', kit: '#00223A', skin: '#f1c27d' };
      case '0xsplits': return { striker: 'Mbappé', keeper: 'Raya', kit: '#00C48C', skin: '#e0ac69' };
      default: return { striker: 'Striker', keeper: 'Keeper', kit: '#3b82f6', skin: '#fbbf24' };
    }
  };

  const characters = getCharacters();

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
      setStrikerState('running');
      await new Promise(resolve => setTimeout(resolve, 750));

      setStrikerState('kicking');
      setIsZoomed(true);
      setBallPos(direction);
      setKeeperPos(aiChoice);
      
      // Sync striker exit
      setTimeout(() => setStrikerState('exit'), 200);

      if (direction === aiChoice) {
        success = false;
        setKeeperReaction('catch');
        showFeedback('MASTER SAVED! 🧤', 'danger');
      } else {
        success = true;
        setKeeperReaction('missed');
        showFeedback(`${characters.striker.toUpperCase()} SCORES! ⚽`, 'info');
      }
    } else {
      setIsBotThinking(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsBotThinking(false);

      setStrikerState('running');
      await new Promise(resolve => setTimeout(resolve, 750));
      setStrikerState('kicking');
      setIsZoomed(true);
      
      setKeeperPos(direction);
      setBallPos(aiChoice);
      
      setTimeout(() => setStrikerState('exit'), 200);

      if (direction === aiChoice) {
        success = true;
        setKeeperReaction('catch');
        showFeedback('HUGE SAVE! 🧤', 'success');
      } else {
        success = false;
        setKeeperReaction('missed');
        showFeedback(`${characters.striker.toUpperCase()} BLASTS IT!`, 'danger');
      }
    }

    // High velocity ball reach
    await new Promise(resolve => setTimeout(resolve, 600));

    if (success) {
      setIsNetShaking(true);
      setTimeout(() => setIsNetShaking(false), 800);
      
      if (role === 'striker') {
        setPlayerScore(prev => prev + 1);
        setLastResult('GOAL!');
        setCrowdState('cheer');
        triggerShake();
      } else {
        setAiScore(prev => prev + 1);
        setLastResult('SCORED!');
        setCrowdState('slump');
        triggerShake();
      }
    } else {
      setLastResult('SAVED!');
      if (role === 'striker') {
        setCrowdState('slump');
      } else {
        setCrowdState('cheer');
      }
    }

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
    setKeeperReaction('idle');
    setIsZoomed(false);
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
  const cameraVariants: Variants = {
    idle: { scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    zoomed: { scale: 1.4, y: 180, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }
  };

  const strikerVariants: Variants = {
    idle: { 
      y: 40, 
      x: '-80%', 
      scale: 1.1, 
      rotate: 10,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    running: { 
      y: -180, 
      x: '-50%', 
      scale: 0.55,
      rotate: 0,
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    kicking: { 
      y: -180,
      x: '-50%',
      scale: 0.55,
      rotate: 0,
      opacity: 1,
      transition: { duration: 0.1 } 
    },
    exit: {
      opacity: 0,
      scale: 0.3,
      y: -210,
      transition: { duration: 0.4 }
    }
  };

  const keeperVariants: Variants = {
    center: { x: '-50%', y: 0, rotate: 0, scale: 1 },
    left: { 
      x: '-220%', 
      y: 50, 
      rotate: -95, 
      scale: 0.85,
      transition: { type: "spring", stiffness: 180, damping: 15 }
    },
    right: { 
      x: '120%', 
      y: 50, 
      rotate: 95, 
      scale: 0.85,
      transition: { type: "spring", stiffness: 180, damping: 15 }
    }
  };

  const ballVariants: Variants = {
    center: { bottom: '25%', left: '50%', scale: 1, rotate: 0 },
    left: { 
      bottom: '68%', 
      left: '25%', 
      scale: 0.25, 
      rotate: 1440,
      transition: { duration: 0.5, ease: "easeOut" } 
    },
    right: { 
      bottom: '68%', 
      left: '75%', 
      scale: 0.25, 
      rotate: -1440,
      transition: { duration: 0.5, ease: "easeOut" } 
    },
    'center-goal': { 
      bottom: '68%', 
      left: '50%', 
      scale: 0.25, 
      rotate: 1080,
      transition: { duration: 0.5, ease: "easeOut" } 
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
               {username.toUpperCase()}
            </div>
            <div className={`indicator bot ${matchState === 'playing' && (role === 'goalkeeper' || isBotThinking) ? 'active pulse' : ''}`}>
               {characters.keeper.toUpperCase()}
            </div>
          </div>
          <div className="score-main">
            <div className="score-team">{characters.striker.toUpperCase()}</div>
            <div className="score-center">
              <span>{playerScore}</span>
              <span>:</span>
              <span>{aiScore}</span>
            </div>
            <div className="score-team">KEEPER</div>
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
              <span className="text-striker">Goal focus active. Take your shot, {characters.striker}! ⚽</span>
            ) : (
              <span className="text-keeper">Watch the approach! Defend with {characters.keeper}! 🧤</span>
            )}
          </div>
        </div>
      </div>

      <motion.div 
        className="pitch-camera-wrapper"
        variants={cameraVariants}
        animate={isZoomed ? 'zoomed' : 'idle'}
        initial="idle"
      >
        <div className="pitch">
          <div className={`goal-post ${isNetShaking ? 'net-shaking' : ''}`}>
            <div className="net"></div>
          </div>
          
          <motion.div 
            className="keeper"
            variants={keeperVariants}
            animate={keeperPos === 'center' ? 'center' : keeperPos}
            initial="center"
          >
             <div className={`keeper-character reaction-${keeperReaction}`}>
                <svg viewBox="0 0 100 120" className="keeper-svg">
                  <rect x="25" y="40" width="50" height="60" rx="10" fill={characters.kit} stroke="#000" strokeWidth="2" />
                  <circle cx="50" cy="25" r="15" fill={characters.skin} stroke="#000" strokeWidth="2" />
                  
                  {/* Adaptive Arms based on reaction */}
                  <g className="keeper-arms">
                    <rect x="10" y="50" width="15" height="20" rx="4" fill="#fff" stroke="#000" strokeWidth="2" className="arm-left" />
                    <rect x="75" y="50" width="15" height="20" rx="4" fill="#fff" stroke="#000" strokeWidth="2" className="arm-right" />
                  </g>
                  
                  <rect x="25" y="85" width="50" height="15" fill="#000" />
                </svg>
                <div className="keeper-name-label">{characters.keeper}</div>
             </div>
          </motion.div>
          
          <motion.div 
            className={`ball ${role === 'striker' ? 'ball-user' : 'ball-bot'}`}
            variants={ballVariants}
            animate={ballPos === 'center' ? (matchState === 'playing' ? 'center' : 'center-goal') : ballPos}
            initial="center"
          >
            <div className="base-logo-ball">
              <svg viewBox="0 0 100 100" className="base-ball-svg">
                <circle cx="50" cy="50" r="45" fill="#0052FF" />
                <circle cx="50" cy="50" r="25" fill="#fff" />
              </svg>
            </div>
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

          {(role === 'striker' || matchState === 'playing') && (
            <motion.div 
              className={`striker-foreground ${strikerState}`}
              variants={strikerVariants}
              animate={strikerState}
              initial="idle"
            >
               <div className="striker-character">
                  <svg viewBox="0 0 100 150" className="striker-svg">
                    <g className="striker-legs">
                      <rect x="30" y="100" width="15" height="40" fill={characters.skin} className="leg-left" />
                      <rect x="55" y="100" width="15" height="40" fill={characters.skin} className="leg-right" />
                    </g>
                    <rect x="20" y="40" width="60" height="70" rx="12" fill={characters.kit} stroke="#000" strokeWidth="2" />
                    <circle cx="50" cy="25" r="18" fill={characters.skin} stroke="#000" strokeWidth="2" />
                    <rect x="5" y="50" width="15" height="40" rx="5" fill={characters.kit} stroke="#000" strokeWidth="1" className="arm-left" />
                    <rect x="80" y="50" width="15" height="40" rx="5" fill={characters.kit} stroke="#000" strokeWidth="1" className="arm-right" />
                    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="900" style={{ textShadow: '1px 1px 0 #000' }}>
                      {characters.striker === 'Ronaldo' ? '7' : '10'}
                    </text>
                  </svg>
                  <div className="striker-name-label">{characters.striker}</div>
               </div>
            </motion.div>
          )}
        </div>
      </motion.div>

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
