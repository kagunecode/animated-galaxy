import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Leva, useControls } from 'leva';
import { Perf } from 'r3f-perf';
import { useEffect, useMemo, useRef } from 'react';

import fragmentShader from './shaders/fragmentShader.frag';
import vertexShader from './shaders/vertexShader.vert';

function Galaxy() {
  const { viewport } = useThree();
  const {
    count,
    radius,
    branches,
    randomness,
    randomnessPower,
    insideColor,
    outsideColor,
  } = useControls('Galaxy', {
    count: { value: 200000, min: 1000, max: 1000000 },
    radius: { value: 5, min: 0.01, max: 20 },
    branches: { value: 3, min: 2, max: 20 },
    randomness: { value: 0.2, min: 0, max: 2 },
    randomnessPower: { value: 3, min: 1, max: 10 },
    insideColor: { value: '#ff6030' },
    outsideColor: { value: '#1b3984' },
  });

  const parameters = useMemo(() => {
    return {
      count,
      size: 0.005,
      radius,
      branches,
      spin: 1,
      randomness,
      randomnessPower,
      insideColor,
      outsideColor,
    };
  }, [
    count,
    radius,
    branches,
    randomness,
    randomnessPower,
    insideColor,
    outsideColor,
  ]);

  const uniforms = useMemo(
    () => ({
      uSize: { value: 30 * viewport.dpr },
      uTime: { value: 0 },
    }),
    []
  );

  const { positions, colors, scales, random } = useMemo(() => {
    const newPositions = new Float32Array(parameters.count * 3);
    const newColors = new Float32Array(parameters.count * 3);
    const newScales = new Float32Array(parameters.count * 1);
    const newRandom = new Float32Array(parameters.count * 3);

    const insideColor = new THREE.Color(parameters.insideColor);
    const outsideColor = new THREE.Color(parameters.outsideColor);

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;

      const radius = Math.random() * parameters.radius;

      const branchAngle =
        ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

      const randomX =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius;
      const randomY =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius;
      const randomZ =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        parameters.randomness *
        radius;

      newPositions[i3] = Math.cos(branchAngle) * radius;
      newPositions[i3 + 1] = 0;
      newPositions[i3 + 2] = Math.sin(branchAngle) * radius;

      newRandom[i3] = randomX;
      newRandom[i3 + 1] = randomY;
      newRandom[i3 + 2] = randomZ;

      const mixedColor = insideColor.clone();
      mixedColor.lerp(outsideColor, radius / parameters.radius);

      newColors[i3] = mixedColor.r;
      newColors[i3 + 1] = mixedColor.g;
      newColors[i3 + 2] = mixedColor.b;

      newScales[i] = Math.random();
    }

    return {
      positions: newPositions,
      colors: newColors,
      scales: newScales,
      random: newRandom,
    };
  }, [parameters]);

  const geometryRef = useRef();
  const materialRef = useRef();

  useEffect(() => {
    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometryRef.current.setAttribute(
      'aRandomness',
      new THREE.BufferAttribute(random, 3)
    );
    geometryRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    geometryRef.current.setAttribute(
      'aScale',
      new THREE.BufferAttribute(scales, 1)
    );
  }, [positions, colors, scales, random]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = elapsedTime;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}

function Scene() {
  const { showPerf } = useControls('Performance', {
    showPerf: false,
  });
  return (
    <Canvas camera={{ position: [3, 3, 3] }}>
      <OrbitControls />
      {showPerf && <Perf position='top-left' />}
      <Galaxy />
    </Canvas>
  );
}

export default function App() {
  return (
    <>
      <Leva collapsed />
      <Scene />
    </>
  );
}
