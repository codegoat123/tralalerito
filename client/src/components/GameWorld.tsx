import { useMemo } from 'react';
import * as THREE from 'three';

export function GameWorld() {
  // Generate trees with pre-calculated positions (no Math.random in render)
  const trees = useMemo(() => {
    const treePositions = [];
    for (let i = 0; i < 50; i++) {
      const tx = Math.random() * 160 - 80;
      const tz = Math.random() * 160 - 80;
      if (Math.abs(tx) < 8 && Math.abs(tz) < 8) continue;
      treePositions.push({ x: tx, z: tz });
    }
    return treePositions;
  }, []);

  // Generate bases with pre-calculated positions
  const bases = useMemo(() => {
    const basePositions = [];
    for (let i = 0; i < 4; i++) {
      const size = 12;
      const x = Math.round((Math.random() * 120 - 60) / 4) * 4;
      const z = Math.round((Math.random() * 120 - 60) / 4) * 4;
      basePositions.push({ x, z, size });
    }
    return basePositions;
  }, []);

  return (
    <>
      {/* Lighting */}
      <directionalLight position={[10, 20, 10]} intensity={1.0} />
      <ambientLight intensity={0.4} />

      {/* Sky color and fog */}
      <color attach="background" args={[0x99ccff]} />
      <fog attach="fog" args={[0x99ccff, 60, 160]} />

      {/* Ground */}
      <mesh position={[0, -1, 0]} userData={{ isTerrain: true }}>
        <boxGeometry args={[200, 2, 200]} />
        <meshLambertMaterial color={0x55aa55} />
      </mesh>

      {/* Bases (rooms with doors) */}
      {bases.map((base, idx) => (
        <group key={`base-${idx}`} position={[base.x, 0, base.z]}>
          {/* Floor */}
          <mesh position={[0, 0, 0]} userData={{ isSolid: true }}>
            <boxGeometry args={[base.size, 1, base.size]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Ceiling */}
          <mesh position={[0, 5, 0]} userData={{ isSolid: true }}>
            <boxGeometry args={[base.size, 1, base.size]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Back Wall */}
          <mesh position={[0, 2.5, base.size / 2]} userData={{ isSolid: true }}>
            <boxGeometry args={[base.size, 5, 1]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Left Wall */}
          <mesh position={[-base.size / 2, 2.5, 0]} userData={{ isSolid: true }}>
            <boxGeometry args={[1, 5, base.size]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Right Wall */}
          <mesh position={[base.size / 2, 2.5, 0]} userData={{ isSolid: true }}>
            <boxGeometry args={[1, 5, base.size]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Door segments (front wall with gap) */}
          <mesh position={[-(3 / 2 + (base.size - 3) / 4), 2.5, -base.size / 2]} userData={{ isSolid: true }}>
            <boxGeometry args={[(base.size - 3) / 2, 5, 1]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>
          <mesh position={[3 / 2 + (base.size - 3) / 4, 2.5, -base.size / 2]} userData={{ isSolid: true }}>
            <boxGeometry args={[(base.size - 3) / 2, 5, 1]} />
            <meshLambertMaterial color={0x333333} />
          </mesh>

          {/* Interior lamp */}
          <mesh position={[0, 4.6, 0]}>
            <boxGeometry args={[0.8, 0.2, 0.8]} />
            <meshLambertMaterial color={0xffee88} />
          </mesh>
        </group>
      ))}

      {/* Trees */}
      {trees.map((tree, idx) => (
        <group key={`tree-${idx}`} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[0.6, 2.6, 0.6]} />
            <meshLambertMaterial color={0x8B4513} />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 3.0, 0]}>
            <sphereGeometry args={[1.4, 10, 8]} />
            <meshLambertMaterial color={0x228B22} />
          </mesh>
        </group>
      ))}

      {/* Mountain Perimeter */}
      {(() => {
        const mountains = [];
        const mapSize = 100;
        const wallHeight = 20;
        const wallSize = 10;

        // North and South edges
        for (let x = -mapSize; x <= mapSize; x += wallSize) {
          mountains.push(
            <mesh key={`mountain-n-${x}`} position={[x, wallHeight / 2 - 1, -mapSize]} userData={{ isSolid: true }}>
              <boxGeometry args={[wallSize, wallHeight, wallSize]} />
              <meshLambertMaterial color={0x777777} />
            </mesh>
          );
          mountains.push(
            <mesh key={`mountain-s-${x}`} position={[x, wallHeight / 2 - 1, mapSize]} userData={{ isSolid: true }}>
              <boxGeometry args={[wallSize, wallHeight, wallSize]} />
              <meshLambertMaterial color={0x777777} />
            </mesh>
          );
        }

        // West and East edges
        for (let z = -mapSize + wallSize; z <= mapSize - wallSize; z += wallSize) {
          mountains.push(
            <mesh key={`mountain-w-${z}`} position={[-mapSize, wallHeight / 2 - 1, z]} userData={{ isSolid: true }}>
              <boxGeometry args={[wallSize, wallHeight, wallSize]} />
              <meshLambertMaterial color={0x777777} />
            </mesh>
          );
          mountains.push(
            <mesh key={`mountain-e-${z}`} position={[mapSize, wallHeight / 2 - 1, z]} userData={{ isSolid: true }}>
              <boxGeometry args={[wallSize, wallHeight, wallSize]} />
              <meshLambertMaterial color={0x777777} />
            </mesh>
          );
        }

        return mountains;
      })()}
    </>
  );
}
