import { useState } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';

export function GameUI() {
  const { myUsername, players, isConnected } = useMultiplayer();
  const [chatVisible, setChatVisible] = useState(true);

  const handleToggleChat = () => {
    setChatVisible(!chatVisible);
  };

  const handlePopout = () => {
    window.open('https://betogxzw.netlify.app', '_blank', 'noopener,noreferrer');
  };

  // Handle keyboard toggle with 'C'
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setChatVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const playerCount = Object.keys(players).length + (myUsername ? 1 : 0);

  return (
    <>
      {/* Controls info */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(255, 255, 255, 0.92)',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#111',
        zIndex: 60
      }}>
        WASD: move (faster) • Arrow ←/→: rotate camera • Space: jump
      </div>

      {/* Player list */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '18px',
        background: 'rgba(255, 255, 255, 0.92)',
        padding: '10px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#111',
        zIndex: 60,
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '180px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '6px' }}>
          Players Online ({playerCount}/20)
        </div>
        <div style={{ fontSize: '12px' }}>
          {myUsername && (
            <div style={{ 
              padding: '2px 0', 
              color: '#3399ff',
              fontWeight: '600'
            }}>
              {myUsername} (You)
            </div>
          )}
          {Object.values(players).map(player => (
            <div key={player.id} style={{ padding: '2px 0' }}>
              {player.username}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '8px',
          paddingTop: '6px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          fontSize: '11px',
          color: isConnected ? '#00aa00' : '#aa0000',
          fontWeight: '600'
        }}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </div>
      </div>

      {/* Chat UI */}
      <div style={{
        position: 'absolute',
        right: '18px',
        bottom: '18px',
        width: '460px',
        height: '720px',
        zIndex: 55,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto',
        transition: 'transform 220ms ease, opacity 200ms ease',
        transformOrigin: '100% 100%'
      }}>
        <div style={{
          height: '52px',
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)',
          fontSize: '14px',
          color: '#111'
        }}>
          <div style={{ fontWeight: '600' }}>Game Chat</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePopout}
              style={{
                background: '#ffffffcc',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Pop out
            </button>
            <button
              style={{
                background: '#ffffffcc',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Settings
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          padding: '0 6px'
        }}>
          <button
            onClick={handleToggleChat}
            style={{
              background: '#ffffffcc',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {chatVisible ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>

        {chatVisible && (
          <iframe
            src="https://betogxzw.netlify.app"
            title="Chat"
            style={{
              width: '100%',
              height: 'calc(100% - 106px)',
              border: 'none',
              borderRadius: '10px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)',
              background: 'white',
              overflow: 'hidden'
            }}
          />
        )}
      </div>
    </>
  );
}
