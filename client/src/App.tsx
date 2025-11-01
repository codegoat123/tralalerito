import { useEffect, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import "@fontsource/inter";
import { Game } from "./components/Game";
import { GameUI } from "./components/GameUI";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Auto-focus canvas so keyboard controls work immediately
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.focus();
      canvas.setAttribute('tabindex', '0');
      // Re-focus on click
      canvas.addEventListener('click', () => canvas.focus());
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{
          position: [0, 6, 12],
          fov: 70,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <Suspense fallback={null}>
          <Game />
        </Suspense>
      </Canvas>
      <GameUI />
    </div>
  );
}

export default App;