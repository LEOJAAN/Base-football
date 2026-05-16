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
      default: return { striker: 'Striker', keeper: 'Keeper', kit: '#1a1a1a', skin: '#fbbf24' };
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
      y: 60, 
      x: '-80%', 
      scale: 1.2, 
      rotate: 10,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    running: { 
      y: -240, 
      x: '-50%', 
      scale: 0.45,
      rotate: 0,
      opacity: 1,
      transition: { 
        duration: 0.9, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    kicking: { 
      y: -240,
      x: '-50%',
      scale: 0.45,
      rotate: 0,
      opacity: 1,
      transition: { duration: 0.1 } 
    },
    exit: {
      opacity: 0,
      scale: 0.25,
      y: -270,
      transition: { duration: 0.4 }
    }
  };

  const keeperVariants: Variants = {
    center: { x: '-50%', y: 0, rotate: 0, scale: 1 },
    left: { 
      x: '-140%', 
      y: 20, 
      rotate: -95, 
      scale: 0.8,
      transition: { type: "spring", stiffness: 180, damping: 15 }
    },
    right: { 
      x: '40%', 
      y: 20, 
      rotate: 95, 
      scale: 0.8,
      transition: { type: "spring", stiffness: 180, damping: 15 }
    }
  };

  const ballVariants: Variants = {
    center: { bottom: '15%', left: '50%', scale: 1.3, rotate: 0 },
    left: { 
      bottom: '75%', 
      left: '37%', 
      scale: 0.15, 
      rotate: 1440,
      transition: { duration: 0.6, ease: "easeOut" } 
    },
    right: { 
      bottom: '75%', 
      left: '63%', 
      scale: 0.15, 
      rotate: -1440,
      transition: { duration: 0.6, ease: "easeOut" } 
    },
    'center-goal': { 
      bottom: '75%', 
      left: '50%', 
      scale: 0.15, 
      rotate: 1080,
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
            <div className="goal-back">
               <div className="net"></div>
            </div>
          </div>
          
          <motion.div 
            className="keeper"
            variants={keeperVariants}
            animate={keeperPos === 'center' ? 'center' : keeperPos}
            initial="center"
          >
             <div className={`keeper-character reaction-${keeperReaction}`}>
                <svg viewBox="0 0 100 145" className="keeper-svg">
                  {/* High Detail Body Structure */}
                  <g className="keeper-legs">
                    <path d="M32 105 L30 140 L45 140 L44 105 Z" fill={characters.skin} />
                    <path d="M56 105 L55 140 L70 140 L68 105 Z" fill={characters.skin} />
                    <rect x="28" y="135" width="18" height="8" rx="2" fill="#000" />
                    <rect x="54" y="135" width="18" height="8" rx="2" fill="#000" />
                  </g>
                  
                  <g className="keeper-torso">
                    <rect x="25" y="40" width="50" height="68" rx="10" fill={characters.kit} />
                    {/* Jersey Detail */}
                    <path d="M25 55 L75 55" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <path d="M50 40 L50 108" stroke="rgba(0,0,0,0.05)" strokeWidth="2" />
                  </g>
                  
                  <g className="keeper-head">
                    <circle cx="50" cy="22" r="17" fill={characters.skin} />
                    {/* Hair Detail */}
                    <path d="M33 15 Q50 2 67 15 L67 22 Q50 28 33 22 Z" fill="#2d1d1d" />
                    {/* Eyes */}
                    <circle cx="43" cy="22" r="1.5" fill="#000" />
                    <circle cx="57" cy="22" r="1.5" fill="#000" />
                  </g>

                  <g className="keeper-arms">
                    <path d="M8 55 L25 65 L25 85 L8 75 Z" fill="#fff" className="arm-left" />
                    <path d="M92 55 L75 65 L75 85 L92 75 Z" fill="#fff" className="arm-right" />
                  </g>
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
            <div className="standard-ball">
              <svg viewBox="0 0 100 100" className="base-ball-svg">
                <circle cx="50" cy="50" r="45" fill="#fff" stroke="#000" strokeWidth="3" />
                <path d="M50 20 L65 40 L50 60 L35 40 Z" fill="#000" />
                <path d="M50 60 L70 75 L80 50 L65 40 Z" fill="#000" />
                <path d="M50 60 L30 75 L20 50 L35 40 Z" fill="#000" />
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
                  <svg viewBox="0 0 100 165" className="striker-svg">
                    {/* Detailed Striker Body */}
                    <g className="striker-legs">
                      <path d="M34 115 L31 155 L46 155 L45 115 Z" fill={characters.skin} className="leg-left" />
                      <path d="M55 115 L54 155 L69 155 L66 115 Z" fill={characters.skin} className="leg-right" />
                      <rect x="29" y="152" width="20" height="10" rx="3" fill="#111" className="boot-left" />
                      <rect x="53" y="152" width="20" height="10" rx="3" fill="#111" className="boot-right" />
                    </g>
                    
                    <g className="striker-torso">
                      <rect x="25" y="45" width="50" height="75" rx="12" fill={characters.kit} />
                      <text x="50" y="100" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="32" fontWeight="900" style={{ pointerEvents: 'none' }}>
                        {characters.striker === 'Ronaldo' ? '7' : '10'}
                      </text>
                    </g>
                    
                    <g className="striker-head">
                       <circle cx="50" cy="25" r="18" fill={characters.skin} />
                       {/* Hair Texture */}
                       <path d="M32 18 Q50 5 68 18 L68 25 Q50 32 32 25 Z" fill="#2d1d1d" />
                       <circle cx="43" cy="25" r="1.5" fill="#000" />
                       <circle cx="57" cy="25" r="1.5" fill="#000" />
                    </g>

                    <g className="striker-arms">
                      <path d="M10 60 L25 70 L25 100 L10 90 Z" fill={characters.kit} className="arm-left" />
                      <path d="M90 60 L75 70 L75 100 L90 90 Z" fill={characters.kit} className="arm-right" />
                    </g>
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
