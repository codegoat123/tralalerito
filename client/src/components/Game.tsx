import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Tralalerito } from './Tralalerito';
import { GameWorld } from './GameWorld';
import { PlayerLabel } from './PlayerLabel';
import { useMultiplayer } from '../hooks/useMultiplayer';

enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
  rotateLeft = 'rotateLeft',
  rotateRight = 'rotateRight',
}

const keyMap = [
  { name: Controls.forward, keys: ['KeyW'] },
  { name: Controls.back, keys: ['KeyS'] },
  { name: Controls.left, keys: ['KeyA'] },
  { name: Controls.right, keys: ['KeyD'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.rotateLeft, keys: ['ArrowLeft'] },
  { name: Controls.rotateRight, keys: ['ArrowRight'] },
];

function GameScene() {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();
  const { myPlayerId, myUsername, players, updatePosition } = useMultiplayer();

  const [position, setPosition] = useState(new THREE.Vector3(0, 2.2, 0));
  const [velocity, setVelocity] = useState(0);
  const [canJump, setCanJump] = useState(true);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [walkCycle, setWalkCycle] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [remoteWalkCycles, setRemoteWalkCycles] = useState<Record<string, number>>({});
  const [interpolatedPlayers, setInterpolatedPlayers] = useState<Record<string, PlayerState>>({});

  const raycaster = useRef(new THREE.Raycaster());
  const collisionCandidates = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    camera.position.set(0, 6, 12);
  }, [camera]);

  // Build collision candidates after scene is ready
  useFrame(({ scene }) => {
    if (collisionCandidates.current.length === 0) {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.userData.isSolid || obj.userData.isTerrain) {
            collisionCandidates.current.push(obj);
          } else {
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const minSize = Math.min(size.x, size.y, size.z);
            if (minSize > 0.45) {
              collisionCandidates.current.push(obj);
            }
          }
        }
      });
    }
  });

  // Check collision (exclude terrain for horizontal movement checks)
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    const halfW = 0.45;
    const halfD = 0.45;
    const min = new THREE.Vector3(newPos.x - halfW, newPos.y, newPos.z - halfD);
    const max = new THREE.Vector3(newPos.x + halfW, newPos.y + 1.8, newPos.z + halfD);
    const charBox = new THREE.Box3(min, max);

    for (const obj of collisionCandidates.current) {
      // Skip terrain objects for horizontal collision (only check walls/structures)
      if (obj.userData.isTerrain) continue;
      
      const box = new THREE.Box3().setFromObject(obj);
      if (box.intersectsBox(charBox)) return true;
    }
    return false;
  };

  useFrame((state, delta) => {
    const keys = getKeys();
    const moveSpeed = 0.16;
    const rotateSpeed = 0.05;
    let moving = false;

    // Rotation
    let newAngle = cameraAngle;
    if (keys.rotateLeft) newAngle += rotateSpeed;
    if (keys.rotateRight) newAngle -= rotateSpeed;
    
    if (newAngle > Math.PI) newAngle -= Math.PI * 2;
    if (newAngle < -Math.PI) newAngle += Math.PI * 2;
    setCameraAngle(newAngle);

    // Movement
    let dx = 0, dz = 0;
    if (keys.forward) {
      dx -= Math.sin(newAngle) * moveSpeed;
      dz -= Math.cos(newAngle) * moveSpeed;
      moving = true;
    }
    if (keys.back) {
      dx += Math.sin(newAngle) * moveSpeed;
      dz += Math.cos(newAngle) * moveSpeed;
      moving = true;
    }
    if (keys.left) {
      dx -= Math.cos(newAngle) * moveSpeed;
      dz += Math.sin(newAngle) * moveSpeed;
      moving = true;
    }
    if (keys.right) {
      dx += Math.cos(newAngle) * moveSpeed;
      dz -= Math.sin(newAngle) * moveSpeed;
      moving = true;
    }

    setIsMoving(moving);

    // Collision detection disabled - free movement
    const newPosition = position.clone();
    newPosition.x += dx;
    newPosition.z += dz;

    // Jump - only if on ground and key was released
    let newVelocity = velocity;
    let newCanJump = canJump;
    
    // Track if space is currently pressed
    const spacePressed = keys.jump;
    
    // Only jump if: on ground AND space pressed AND wasn't pressed last frame
    if (spacePressed && canJump) {
      newVelocity = 0.32;
      newCanJump = false;
    }
    
    // Reset canJump only when actually on ground (handled below in ground detection)

    // Gravity
    newVelocity -= 0.016;
    const maxFall = -1.2;
    if (newVelocity < maxFall) newVelocity = maxFall;
    newPosition.y += newVelocity;

    // Ground detection with raycast
    const rayOrigin = new THREE.Vector3(newPosition.x, newPosition.y + 1.8, newPosition.z);
    raycaster.current.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    raycaster.current.far = 3.0;
    const intersects = raycaster.current.intersectObjects(collisionCandidates.current, true);

    let groundUnder = 0;
    let foundGround = false;
    if (intersects.length > 0) {
      for (const hit of intersects) {
        const hitPoint = hit.point;
        const hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        hitNormal.transformDirection((hit.object as THREE.Mesh).matrixWorld);
        const upDot = hitNormal.dot(new THREE.Vector3(0, 1, 0));
        const isBelow = hitPoint.y <= newPosition.y + 1.0;
        const horizDistSq = (hitPoint.x - newPosition.x) ** 2 + (hitPoint.z - newPosition.z) ** 2;

        if (upDot > 0.7 && isBelow && horizDistSq < 1.1 * 1.1) {
          groundUnder = hitPoint.y;
          foundGround = true;
          break;
        }
      }
    }

    const snapThreshold = 0.06;
    if (foundGround && newPosition.y <= groundUnder + snapThreshold) {
      newPosition.y = groundUnder;
      newVelocity = 0;
      // Only allow jumping again when space is released
      if (!keys.jump) {
        newCanJump = true;
      }
    } else {
      // In the air - can't jump
      newCanJump = false;
    }

    // Safety reset
    if (newPosition.y < -40) {
      newPosition.set(0, 6, 0);
      newVelocity = 0;
      newCanJump = true;
    }

    setPosition(newPosition);
    setVelocity(newVelocity);
    setCanJump(newCanJump);

    // Walk cycle
    if (moving) {
      setWalkCycle(prev => prev + 0.28);
    }

    // Interpolate remote player positions and update walk cycles
    setRemoteWalkCycles(prev => {
      const updated = { ...prev };
      Object.entries(players).forEach(([id, player]) => {
        if (id !== myPlayerId && player.isMoving) {
          updated[id] = (prev[id] || 0) + 0.28;
        } else if (id !== myPlayerId) {
          // Reset walk cycle when not moving
          updated[id] = 0;
        }
      });
      return updated;
    });

    // Smooth interpolation for remote players
    setInterpolatedPlayers(prev => {
      const updated: Record<string, PlayerState> = {};
      Object.entries(players).forEach(([id, player]) => {
        if (id !== myPlayerId) {
          const prevPlayer = prev[id];
          if (prevPlayer) {
            // Lerp position for smooth movement with faster interpolation
            updated[id] = {
              ...player,
              position: {
                x: prevPlayer.position.x + (player.position.x - prevPlayer.position.x) * 0.5,
                y: prevPlayer.position.y + (player.position.y - prevPlayer.position.y) * 0.5,
                z: prevPlayer.position.z + (player.position.z - prevPlayer.position.z) * 0.5,
              }
            };
          } else {
            updated[id] = player;
          }
        }
      });
      return updated;
    });

    // Update multiplayer position (throttled in useMultiplayer hook)
    updatePosition(
      { x: newPosition.x, y: newPosition.y, z: newPosition.z },
      newAngle,
      moving
    );

    // Camera follow
    const desiredCamY = Math.min(newPosition.y + 3.6, newPosition.y + 12);
    const camX = newPosition.x + 6 * Math.sin(newAngle);
    const camY = desiredCamY;
    const camZ = newPosition.z + 6 * Math.cos(newAngle);
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
    const maxCameraHeight = newPosition.y + 14;
    if (camera.position.y > maxCameraHeight) camera.position.y = maxCameraHeight;
    camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y + 1.1, newPosition.z));
  });

  return (
    <>
      <GameWorld />

      {/* Local player */}
      <Tralalerito
        position={[position.x, position.y, position.z]}
        rotation={cameraAngle}
        isMoving={isMoving}
        walkCycle={walkCycle}
      />
      {myUsername && (
        <PlayerLabel username={myUsername} position={[position.x, position.y, position.z]} />
      )}

      {/* Other players */}
      {Object.entries(interpolatedPlayers).map(([id, player]) => {
        if (id === myPlayerId) return null;
        return (
          <group key={id}>
            <Tralalerito
              position={[player.position.x, player.position.y, player.position.z]}
              rotation={player.rotation}
              isMoving={player.isMoving}
              walkCycle={remoteWalkCycles[id] || 0}
            />
            <PlayerLabel
              username={player.username}
              position={[player.position.x, player.position.y, player.position.z]}
            />
          </group>
        );
      })}
    </>
  );
}

export function Game() {
  return (
    <KeyboardControls map={keyMap}>
      <GameScene />
    </KeyboardControls>
  );
}
