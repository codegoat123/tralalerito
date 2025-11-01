import { useRef } from 'react';
import { Group } from 'three';
import { Html } from '@react-three/drei';

interface SnakeProps {
  position: [number, number, number];
}

export function Snake({ position }: SnakeProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={position}>
      {/* Snake body - green cylinder */}
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
        <meshLambertMaterial color={0x00aa00} />
      </mesh>

      {/* Snake head - green sphere */}
      <mesh position={[1.5, 0.3, 0]}>
        <sphereGeometry args={[0.4, 12, 10]} />
        <meshLambertMaterial color={0x00cc00} />
      </mesh>

      {/* Eyes */}
      <mesh position={[1.7, 0.4, 0.15]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshPhongMaterial color={0xff0000} shininess={80} />
      </mesh>
      <mesh position={[1.7, 0.4, -0.15]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshPhongMaterial color={0xff0000} shininess={80} />
      </mesh>

      {/* Danger sign above snake */}
      <Html position={[0, 2, 0]} center>
        <div style={{
          background: 'rgba(255, 50, 50, 0.95)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '20px',
          fontWeight: 'bold',
          border: '2px solid #cc0000',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}>
          ⚠️ DANGER
        </div>
      </Html>
    </group>
  );
}
