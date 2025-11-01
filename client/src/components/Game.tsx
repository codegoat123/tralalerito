import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Tralalerito } from './Tralalerito';
import { GameWorld } from './GameWorld';
import { Snake } from './Snake';
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
  const { myPlayerId, myUsername, players, snakes, updatePosition } = useMultiplayer();

  const [position, setPosition] = useState(new THREE.Vector3(0, 2.2, 0));
  const [velocity, setVelocity] = useState(0);
  const [canJump, setCanJump] = useState(true);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [walkCycle, setWalkCycle] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

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

  // Check collision
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    const halfW = 0.45;
    const halfD = 0.45;
    const min = new THREE.Vector3(newPos.x - halfW, newPos.y, newPos.z - halfD);
    const max = new THREE.Vector3(newPos.x + halfW, newPos.y + 1.8, newPos.z + halfD);
    const charBox = new THREE.Box3(min, max);

    for (const obj of collisionCandidates.current) {
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

    // Collision detection per axis
    let finalDX = dx, finalDZ = dz;
    if (dx !== 0) {
      const testPosX = new THREE.Vector3(position.x + dx, position.y, position.z);
      if (checkCollision(testPosX)) finalDX = 0;
    }
    if (dz !== 0) {
      const testPosZ = new THREE.Vector3(position.x, position.y, position.z + dz);
      if (checkCollision(testPosZ)) finalDZ = 0;
    }
    const testPosBoth = new THREE.Vector3(position.x + finalDX, position.y, position.z + finalDZ);
    if (checkCollision(testPosBoth)) {
      finalDX = 0;
      finalDZ = 0;
    }

    const newPosition = position.clone();
    newPosition.x += finalDX;
    newPosition.z += finalDZ;

    // Jump
    let newVelocity = velocity;
    let newCanJump = canJump;
    if (keys.jump && canJump) {
      newVelocity = 0.32;
      newCanJump = false;
    }

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
          break;
        }
      }
    }

    const snapThreshold = 0.06;
    if (newPosition.y <= groundUnder + snapThreshold) {
      newPosition.y = groundUnder;
      newVelocity = 0;
      newCanJump = true;
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

    // Update multiplayer position (throttled by frame rate)
    if (Math.random() < 0.1) {
      updatePosition(
        { x: newPosition.x, y: newPosition.y, z: newPosition.z },
        newAngle,
        moving
      );
    }

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
      {Object.entries(players).map(([id, player]) => {
        if (id === myPlayerId) return null;
        return (
          <group key={id}>
            <Tralalerito
              position={[player.position.x, player.position.y, player.position.z]}
              rotation={player.rotation}
              isMoving={player.isMoving}
              walkCycle={0}
            />
            <PlayerLabel
              username={player.username}
              position={[player.position.x, player.position.y, player.position.z]}
            />
          </group>
        );
      })}

      {/* Snakes */}
      {snakes.map((snake) => (
        <Snake key={snake.id} position={[snake.position.x, snake.position.y, snake.position.z]} />
      ))}
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
