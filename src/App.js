import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Wallet, Smile, Trophy, X } from 'lucide-react';

export default function ZionMessenger() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [anonNumber, setAnonNumber] = useState(null);
  const [wins, setWins] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [revealedNickname, setRevealedNickname] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Tic-tac-toe state
  const [gameRequests, setGameRequests] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  
  const messagesEndRef = useRef(null);
  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🚀', '👋', '💪', '🙏', '😎', '🤔', '😍', '🎮'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update countdown timer for game requests
  useEffect(() => {
    const interval = setInterval(() => {
      setGameRequests(prev => [...prev]); // Force re-render for countdown
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setActiveGame(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const connectWallet = async (type) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setWalletAddress(mockAddress);
      setWalletConnected(true);
      
      // Assign anon number based on wallet address
      const savedAnonNumber = localStorage.getItem(`anon_${mockAddress}`);
      
      if (savedAnonNumber) {
        // This wallet already has an anon number
        setAnonNumber(parseInt(savedAnonNumber));
      } else {
        // New wallet - assign next available anon number
        const currentCount = parseInt(localStorage.getItem('anonCount') || '0');
        setAnonNumber(currentCount);
        localStorage.setItem(`anon_${mockAddress}`, currentCount.toString());
        localStorage.setItem('anonCount', (currentCount + 1).toString());
      }
      
      // Load user data for this specific wallet
      const savedWins = parseInt(localStorage.getItem(`wins_${mockAddress}`) || '0');
      const savedNickname = localStorage.getItem(`nickname_${mockAddress}`) || '';
      
      setWins(savedWins);
      setHasAccess(savedWins >= 3);
      
      if (savedWins >= 3 && savedNickname) {
        setRevealedNickname(savedNickname);
      }
      
      // Load messages
      const savedMessages = JSON.parse(localStorage.getItem('publicChatMessages') || '[]');
      setMessages(savedMessages);
      
      setIsLoading(false);
    }, 1500);
  };

  const sendMessage = (emoji) => {
    if (!walletConnected) return;
    
    const newMessage = {
      id: Date.now().toString(),
      emoji: emoji,
      sender: hasAccess && revealedNickname ? revealedNickname : `anon${anonNumber}`,
      timestamp: Date.now(),
      reactions: {},
      replyTo: replyingTo ? {
        id: replyingTo.id,
        emoji: replyingTo.emoji,
        sender: replyingTo.sender
      } : null
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('publicChatMessages', JSON.stringify(updatedMessages));
    setReplyingTo(null);
  };

  const sendTextMessage = () => {
    if (!hasAccess || !messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: messageInput,
      sender: revealedNickname || `anon${anonNumber}`,
      timestamp: Date.now(),
      reactions: {},
      isText: true
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('publicChatMessages', JSON.stringify(updatedMessages));
    setMessageInput('');
  };

  const addReaction = (messageId, emoji) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        const userKey = hasAccess && revealedNickname ? revealedNickname : `anon${anonNumber}`;
        if (reactions[emoji]) {
          if (reactions[emoji].includes(userKey)) {
            reactions[emoji] = reactions[emoji].filter(u => u !== userKey);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...reactions[emoji], userKey];
          }
        } else {
          reactions[emoji] = [userKey];
        }
        return { ...msg, reactions };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    localStorage.setItem('publicChatMessages', JSON.stringify(updatedMessages));
  };

  const requestGame = () => {
    if (hasActiveRequest) {
      alert('⏳ You already have an active game request. Please wait for someone to accept or for it to expire.');
      return;
    }

    const newRequest = {
      id: Date.now().toString(),
      challenger: `anon${anonNumber}`,
      timestamp: Date.now()
    };
    
    const updatedRequests = [...gameRequests, newRequest];
    setGameRequests(updatedRequests);
    setHasActiveRequest(true);
    
    // Auto-remove after 5 minutes (300 seconds)
    setTimeout(() => {
      setGameRequests(prev => {
        const filtered = prev.filter(r => r.id !== newRequest.id);
        // Check if user still has any active requests
        const userHasRequest = filtered.some(r => r.challenger === `anon${anonNumber}`);
        if (!userHasRequest) {
          setHasActiveRequest(false);
        }
        return filtered;
      });
    }, 300000); // 5 minutes
  };

  const acceptGame = (request) => {
    setActiveGame({
      challenger: request.challenger,
      opponent: `anon${anonNumber}`,
      isChallenger: false
    });
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    
    // Remove the accepted request
    setGameRequests(prev => prev.filter(r => r.id !== request.id));
    
    // Clear the requester's active request flag if it's their request
    if (request.challenger === `anon${anonNumber}`) {
      setHasActiveRequest(false);
    }
  };

  const handleSquareClick = (index) => {
    if (!activeGame || board[index] || calculateWinner(board)) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    const winner = calculateWinner(newBoard);
    if (winner) {
      setTimeout(() => {
        const playerSymbol = activeGame.isChallenger ? 'X' : 'O';
        if (winner === playerSymbol) {
          const newWins = wins + 1;
          setWins(newWins);
          localStorage.setItem(`wins_${walletAddress}`, newWins.toString());
          
          if (newWins >= 3 && !hasAccess) {
            setHasAccess(true);
            // Prompt for nickname
            const chosenNickname = prompt('🎉 Congratulations! You unlocked the Secret Chat!\n\nChoose your nickname (max 8 characters, letters and numbers only):');
            
            if (chosenNickname) {
              const alphanumeric = /^[a-zA-Z0-9]*$/;
              if (chosenNickname.length <= 8 && alphanumeric.test(chosenNickname)) {
                setRevealedNickname(chosenNickname);
                localStorage.setItem(`nickname_${walletAddress}`, chosenNickname);
                alert(`✨ Welcome to the Secret Chat, ${chosenNickname}! You can now send text messages and your nickname is visible!`);
              } else {
                alert('Invalid nickname. Using default. You can set it later.');
                setRevealedNickname(`User${anonNumber}`);
                localStorage.setItem(`nickname_${walletAddress}`, `User${anonNumber}`);
              }
            } else {
              setRevealedNickname(`User${anonNumber}`);
              localStorage.setItem(`nickname_${walletAddress}`, `User${anonNumber}`);
            }
          } else if (newWins < 3) {
            alert(`🎮 You won! Keep playing to unlock Secret Chat!`);
          } else {
            alert('🎮 You won!');
          }
        } else {
          alert('😔 You lost this round. Try again!');
        }
        setActiveGame(null);
        setBoard(Array(9).fill(null));
      }, 500);
    } else if (newBoard.every(square => square !== null)) {
      setTimeout(() => {
        alert('🤝 Draw! Try again!');
        setActiveGame(null);
        setBoard(Array(9).fill(null));
      }, 500);
    }
  };

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const renderSquare = (index) => {
    const winner = calculateWinner(board);
    return (
      <button
        onClick={() => handleSquareClick(index)}
        className={`w-20 h-20 bg-gray-800 border-2 border-green-600 rounded-lg flex items-center justify-center text-3xl font-bold transition-all hover:bg-gray-700 ${
          winner ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        disabled={!!winner}
      >
        {board[index] === 'X' && <span className="text-green-400 font-mono text-4xl">Z</span>}
        {board[index] === 'O' && (
          <span className="text-emerald-400 font-mono text-4xl relative inline-block">
            0
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="block w-8 h-0.5 bg-emerald-400 rotate-45"></span>
            </span>
          </span>
        )}
      </button>
    );
  };

  // Landing Page
  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Matrix rain effect background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
          animation: 'matrix-rain 20s linear infinite'
        }}></div>
        
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-12 max-w-md w-full border-2 border-green-500 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-3xl mb-6 shadow-xl border-2 border-green-500">
              <MessageSquare className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-5xl font-bold text-green-400 mb-3 font-mono">ZION</h1>
            <p className="text-green-300 font-mono text-sm">Enter the Matrix</p>
          </div>

          {!showWalletOptions ? (
            <button
              onClick={() => setShowWalletOptions(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg border-2 border-green-400"
            >
              <Wallet className="w-6 h-6" />
              CONNECT
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => connectWallet('argentx')}
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Wallet className="w-5 h-5" />
                {isLoading ? 'CONNECTING...' : 'ArgentX'}
              </button>

              <button
                onClick={() => connectWallet('braavos')}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border-2 border-green-400"
              >
                <Wallet className="w-5 h-5" />
                {isLoading ? 'CONNECTING...' : 'Braavos'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Public Chat
  return (
    <div className="min-h-screen bg-black flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b-2 border-green-500 px-4 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border-2 border-green-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <span className="font-bold text-xl text-green-400 font-mono">ZION</span>
              <p className="text-xs text-green-500 font-mono">{hasAccess ? 'SECRET CHAT' : 'PUBLIC CHAT'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-green-400 font-mono font-bold">
                {hasAccess && revealedNickname ? revealedNickname : `anon${anonNumber}`}
              </p>
              {hasAccess && (
                <p className="text-xs text-yellow-400 font-mono">✨ Secret Access</p>
              )}
            </div>
            <span className="text-xs text-green-600 bg-gray-800 px-3 py-1.5 rounded-lg border border-green-700 font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed height container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="max-w-7xl mx-auto w-full flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-black min-h-0">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === `anon${anonNumber}` ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="max-w-xs md:max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-green-500 font-mono">{msg.sender}</span>
                    <span className="text-xs text-green-700 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div
                    className={`px-4 py-3 rounded-2xl relative ${
                      msg.sender === `anon${anonNumber}`
                        ? 'bg-green-900 border-2 border-green-600 text-green-100'
                        : 'bg-gray-900 border-2 border-green-800 text-green-200'
                    }`}
                  >
                    {msg.replyTo && (
                      <div className="mb-2 pb-2 border-l-2 border-green-600 pl-2 text-xs opacity-70">
                        <p className="font-semibold">{msg.replyTo.sender}</p>
                        <p className="text-2xl">{msg.replyTo.emoji || msg.replyTo.text}</p>
                      </div>
                    )}
                    
                    {msg.isText ? (
                      <p className="font-mono break-words">{msg.text}</p>
                    ) : (
                      <p className="text-4xl">{msg.emoji}</p>
                    )}
                    
                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`bg-gray-800 border ${
                              users.includes(`anon${anonNumber}`) ? 'border-green-500' : 'border-green-800'
                            } px-2 py-0.5 rounded-full text-sm flex items-center gap-1 hover:border-green-400 transition-colors`}
                          >
                            {emoji} <span className="text-green-400 font-mono text-xs">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Reaction Buttons */}
                    <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 rounded bg-gray-800 border border-green-700 text-green-400 hover:bg-gray-700"
                        title="Reply"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => addReaction(msg.id, '❤️')}
                        className="p-1 rounded bg-gray-800 border border-green-700 hover:bg-gray-700"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => addReaction(msg.id, '👍')}
                        className="p-1 rounded bg-gray-800 border border-green-700 hover:bg-gray-700"
                      >
                        👍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Game Requests */}
          {gameRequests.length > 0 && (
            <div className="bg-gray-900 border-t-2 border-green-700 p-3 flex-shrink-0">
              <p className="text-green-400 text-sm font-mono mb-2">🎮 GAME REQUESTS:</p>
              <div className="space-y-2">
                {gameRequests.map(req => {
                  const timeLeft = Math.max(0, 300 - Math.floor((Date.now() - req.timestamp) / 1000));
                  const minutes = Math.floor(timeLeft / 60);
                  const seconds = timeLeft % 60;
                  
                  return (
                    <div key={req.id} className="flex items-center justify-between bg-gray-800 border border-green-700 rounded-lg p-3">
                      <div>
                        <span className="text-green-300 font-mono text-sm">{req.challenger} wants to play Tic-Tac-Toe!</span>
                        <p className="text-xs text-green-600 font-mono mt-1">
                          ⏱️ Expires in {minutes}:{seconds.toString().padStart(2, '0')}
                        </p>
                      </div>
                      {req.challenger !== `anon${anonNumber}` && req.challenger !== revealedNickname && (
                        <button
                          onClick={() => acceptGame(req)}
                          className="bg-green-600 hover:bg-green-700 text-black font-bold py-1 px-4 rounded-lg text-sm"
                        >
                          ACCEPT
                        </button>
                      )}
                      {(req.challenger === `anon${anonNumber}` || req.challenger === revealedNickname) && (
                        <span className="text-yellow-400 font-mono text-xs">Waiting...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reply Preview */}
          {replyingTo && (
            <div className="bg-gray-900 border-t border-green-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs text-green-500 font-mono">Replying to {replyingTo.sender}</p>
                <p className="text-lg">{replyingTo.emoji || replyingTo.text}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-green-400 hover:text-green-300">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-gray-900 border-t-2 border-green-500 p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={requestGame}
                disabled={hasActiveRequest}
                className={`${
                  hasActiveRequest 
                    ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 border-2 ${
                  hasActiveRequest ? 'border-gray-600' : 'border-yellow-400'
                }`}
              >
                🎮 {hasActiveRequest ? 'REQUEST PENDING...' : 'REQUEST GAME'}
              </button>
              {hasAccess && (
                <span className="bg-green-900 text-green-300 px-3 py-2 rounded-lg border border-green-600 text-sm font-mono">
                  ✨ SECRET CHAT UNLOCKED
                </span>
              )}
            </div>

            {hasAccess ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-800 border-2 border-green-700 rounded-xl focus:border-green-500 focus:outline-none text-green-100 placeholder-green-600 font-mono"
                />
                <button
                  onClick={sendTextMessage}
                  className="bg-green-600 hover:bg-green-700 text-black font-bold px-6 rounded-xl border-2 border-green-400"
                >
                  SEND
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(emoji)}
                    className="text-4xl hover:scale-125 transition-transform bg-gray-800 border-2 border-green-800 hover:border-green-500 rounded-lg p-2"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tic-Tac-Zion Game Modal */}
      {activeGame && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-green-500">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-green-400 font-mono mb-2">TIC-TAC-ZION</h3>
              <p className="text-green-300 font-mono text-sm">
                {activeGame.challenger} vs {activeGame.opponent}
              </p>
              <p className="text-yellow-400 font-mono text-sm mt-2">
                You are: <span className="text-xl font-bold">{activeGame.isChallenger ? 'Z' : '0̸'}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => renderSquare(i))}
            </div>

            <button
              onClick={() => {
                setActiveGame(null);
                setBoard(Array(9).fill(null));
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
            >
              CLOSE GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}