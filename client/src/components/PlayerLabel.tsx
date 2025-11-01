import { Html } from '@react-three/drei';

interface PlayerLabelProps {
  username: string;
  position: [number, number, number];
}

export function PlayerLabel({ username, position }: PlayerLabelProps) {
  return (
    <Html position={[position[0], position[1] + 3, position[2]]} center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        userSelect: 'none'
      }}>
        {username}
      </div>
    </Html>
  );
}
