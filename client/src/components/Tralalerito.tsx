import { useRef, useMemo } from 'react';
import { Group, Mesh } from 'three';
import * as THREE from 'three';

interface TralaleritoProps {
  position: [number, number, number];
  rotation: number;
  isMoving?: boolean;
  walkCycle?: number;
}

export function Tralalerito({ position, rotation, isMoving = false, walkCycle = 0 }: TralaleritoProps) {
  const groupRef = useRef<Group>(null);
  const leftShoeRef = useRef<Mesh>(null);
  const rightShoeRef = useRef<Mesh>(null);

  // Calculate shoe bounce based on walk cycle
  const leftShoeY = isMoving ? 0.14 + Math.abs(Math.sin(walkCycle)) * 0.18 : 0.14;
  const rightShoeY = isMoving ? 0.14 + Math.abs(Math.sin(walkCycle + Math.PI)) * 0.18 : 0.14;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Body - blue box */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1, 1, 1.1]} />
        <meshLambertMaterial color={0x3399ff} />
      </mesh>

      {/* Face - tan box */}
      <mesh position={[0, 1.25, -0.55]}>
        <boxGeometry args={[1, 0.5, 0.8]} />
        <meshLambertMaterial color={0xd2b48c} />
      </mesh>

      {/* Left Eye - black sphere */}
      <mesh position={[-0.28, 1.38, -0.9]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshPhongMaterial color={0x000000} shininess={80} />
      </mesh>

      {/* Right Eye - black sphere */}
      <mesh position={[0.28, 1.38, -0.9]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshPhongMaterial color={0x000000} shininess={80} />
      </mesh>

      {/* Left Shoe - white box with bounce */}
      <mesh ref={leftShoeRef} position={[-0.36, leftShoeY, 0.36]}>
        <boxGeometry args={[0.6, 0.28, 0.9]} />
        <meshLambertMaterial color={0xffffff} />
      </mesh>

      {/* Right Shoe - white box with bounce */}
      <mesh ref={rightShoeRef} position={[0.36, rightShoeY, 0.36]}>
        <boxGeometry args={[0.6, 0.28, 0.9]} />
        <meshLambertMaterial color={0xffffff} />
      </mesh>
    </group>
  );
}
