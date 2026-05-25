import { useCallback, useRef } from 'react';
import * as THREE from 'three';

const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 900 || /Mobi|Android/i.test(navigator.userAgent));

const gridCols = isMobile ? 280 : 300;
const gridRows = isMobile ? 140 : 150;
const stalksPerCell = 4;
const totalCount = gridCols * gridRows * stalksPerCell;
const groundWidth = 180;
const groundHeight = 90;

export function useThreeScene() {
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const stalkMeshRef = useRef<THREE.InstancedMesh | null>(null);
    const tipMeshRef = useRef<THREE.InstancedMesh | null>(null);
    const mouseLightRef = useRef<THREE.PointLight | null>(null);
    const dustParticlesRef = useRef<THREE.Points | null>(null);
    const interactiveDustRef = useRef<THREE.Points | null>(null);

    // Shared data arrays
    const positions = useRef(new Float32Array(totalCount * 3));
    const baseEulers = useRef(new Float32Array(totalCount * 3));
    const startScalesRef = useRef(new Float32Array(totalCount));
    const targetScalesRef = useRef(new Float32Array(totalCount));
    const noiseValues = useRef(new Float32Array(totalCount));
    const illuminationRef = useRef(new Float32Array(totalCount));
    const bendsRef = useRef(new Float32Array(totalCount * 2));
    const delaysRef = useRef(new Float32Array(totalCount));

    const maxInteractiveDust = isMobile ? 1000 : 3000;
    const activeDustPositionsRef = useRef(new Float32Array(maxInteractiveDust * 3).fill(9999));
    const activeDustVelocitiesRef = useRef(new Float32Array(maxInteractiveDust * 3));
    const activeDustLifetimesRef = useRef(new Float32Array(maxInteractiveDust));
    const activeDustIndexRef = useRef(0);

    // Shader uniforms
    const shaderUniformsRef = useRef({
        uTime: { value: 0 },
        uNow: { value: 0 },
        uHeightFactor: { value: isMobile ? 0.6 : 1.0 },
        uTurbulence: { value: 1.0 },
        uPlantWavePhase: { value: 0 },
        uGlobalBioActivity: { value: 0 },
        uColorGrnd1: { value: new THREE.Color(0x033f35) },
        uColorGrnd2: { value: new THREE.Color(0x339eec) },
        uColorEdge: { value: new THREE.Color(0xff5500) },
        uColorPeak: { value: new THREE.Color(0xffcc00) },
    });

    // Color state
    const colorState = useRef({
        colorGrnd1: new THREE.Color(0x033f35),
        colorGrnd2: new THREE.Color(0x339eec),
        colorEdge: new THREE.Color(0xff5500),
        colorPeak: new THREE.Color(0xffcc00),
        targetColorGrnd1: new THREE.Color(0x033f35),
        targetColorGrnd2: new THREE.Color(0x339eec),
        targetColorEdge: new THREE.Color(0xff5500),
        targetColorPeak: new THREE.Color(0xffcc00),
    });

    function setupDust(scene: THREE.Scene) {
        // Generate soft circular texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        const particleTex = new THREE.CanvasTexture(canvas);

        // Atmospheric dust
        const geom = new THREE.BufferGeometry();
        const count = isMobile ? 2500 : 8000;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            pos[i] = (Math.random() - 0.5) * 180;
            pos[i + 1] = (Math.random() - 0.5) * 100;
            pos[i + 2] = (Math.random() - 0.5) * 35 + 2;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffeebb,
            size: 0.12,
            transparent: true,
            opacity: 0.15,
            map: particleTex,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const dustParticles = new THREE.Points(geom, mat);
        scene.add(dustParticles);
        dustParticlesRef.current = dustParticles;

        // Interactive dust
        const interactiveGeom = new THREE.BufferGeometry();
        interactiveGeom.setAttribute('position', new THREE.BufferAttribute(activeDustPositionsRef.current, 3));
        const interactiveMat = new THREE.PointsMaterial({
            color: colorState.current.colorPeak,
            size: 0.75,
            transparent: true,
            opacity: 1.0,
            map: particleTex,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const interactiveDust = new THREE.Points(interactiveGeom, interactiveMat);
        scene.add(interactiveDust);
        interactiveDustRef.current = interactiveDust;
    }

    function setupGeometry(scene: THREE.Scene) {
        const stalkRadiusTop = isMobile ? 0.03 : 0.02;
        const stalkRadiusBot = isMobile ? 0.05 : 0.035;
        const stalkRadial = isMobile ? 3 : 5;
        const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBot, 1, stalkRadial);
        stalkGeom.rotateX(Math.PI / 2);
        stalkGeom.translate(0, 0, 0.5);

        const tipRadial = isMobile ? 3 : 5;
        const tipHeight = isMobile ? 2 : 4;
        const tipRadius = isMobile ? 0.1 : 0.08;
        const tipGeom = new THREE.SphereGeometry(tipRadius, tipRadial, tipHeight);

        const materialOpts = { roughness: 0.85, metalness: 0.05, vertexColors: true };

        const createShaderMaterial = (isTip: boolean) => {
            const mat = new THREE.MeshStandardMaterial(materialOpts);
            mat.onBeforeCompile = (shader) => {
                // Inject uniforms
                shader.uniforms.uTime = shaderUniformsRef.current.uTime;
                shader.uniforms.uNow = shaderUniformsRef.current.uNow;
                shader.uniforms.uHeightFactor = shaderUniformsRef.current.uHeightFactor;
                shader.uniforms.uTurbulence = shaderUniformsRef.current.uTurbulence;
                shader.uniforms.uPlantWavePhase = shaderUniformsRef.current.uPlantWavePhase;
                shader.uniforms.uGlobalBioActivity = shaderUniformsRef.current.uGlobalBioActivity;
                shader.uniforms.uColorGrnd1 = shaderUniformsRef.current.uColorGrnd1;
                shader.uniforms.uColorGrnd2 = shaderUniformsRef.current.uColorGrnd2;
                shader.uniforms.uColorEdge = shaderUniformsRef.current.uColorEdge;
                shader.uniforms.uColorPeak = shaderUniformsRef.current.uColorPeak;

                // Vertex shader modifications
                shader.vertexShader = `
          #define IS_TIP ${isTip ? 1 : 0}

          uniform float uTime;
          uniform float uNow;
          uniform float uHeightFactor;
          uniform float uTurbulence;
          uniform float uPlantWavePhase;
          uniform float uGlobalBioActivity;
          uniform vec3 uColorGrnd1;
          uniform vec3 uColorGrnd2;
          uniform vec3 uColorEdge;
          uniform vec3 uColorPeak;

          attribute vec3 aBasePosition;
          attribute vec3 aBaseEuler;
          attribute float aStartScale;
          attribute float aTargetScale;
          attribute float aDelay;
          attribute float aNoise;
          attribute vec2 aBend;
          attribute float aIllumination;

          varying float vDisplayHeight;
          varying float vNoise;
          varying float vIllum;

          mat3 gpuRotation;
          float gpuDisplayHeight;

          mat3 rotX(float a) {
            float c = cos(a), s = sin(a);
            return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
          }
          mat3 rotY(float a) {
            float c = cos(a), s = sin(a);
            return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
          }
          mat3 rotZ(float a) {
            float c = cos(a), s = sin(a);
            return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
          }

          ${shader.vertexShader}
        `;

                shader.vertexShader = shader.vertexShader.replace(
                    '#include <defaultnormal_vertex>',
                    `
          float progress = clamp((uTime - aDelay) / 2000.0, 0.0, 1.0);
          float easeFactor = 1.0 - pow(1.0 - progress, 3.0);
          gpuDisplayHeight = (aStartScale + (aTargetScale - aStartScale) * easeFactor) * uHeightFactor;

          float turbulenceX = sin(aBasePosition.x * 0.2 + uPlantWavePhase * 3.0) * 0.06 * gpuDisplayHeight * (0.3 + uGlobalBioActivity * 0.7) * uTurbulence;
          float turbulenceY = cos(aBasePosition.y * 0.2 + uPlantWavePhase * 3.5) * 0.06 * gpuDisplayHeight * (0.3 + uGlobalBioActivity * 0.7) * uTurbulence;

          float wriggleX = 0.0;
          float wriggleY = 0.0;
          if (aTargetScale > aStartScale && aTargetScale * uHeightFactor > 3.0) {
            float p = clamp((uTime - aDelay) / 2000.0, 0.0, 1.0);
            float wriggleAmt = sin(p * 3.14159) * 0.25;
            wriggleX = sin(uNow * 0.006 + aBasePosition.x) * wriggleAmt;
            wriggleY = cos(uNow * 0.005 + aBasePosition.y) * wriggleAmt;
          }

          vec3 euler = aBaseEuler + vec3(aBend.x + turbulenceX + wriggleX, aBend.y + turbulenceY + wriggleY, 0.0);
          gpuRotation = rotZ(euler.z) * rotY(euler.y) * rotX(euler.x);

          vec3 transformedNormal = normalMatrix * (gpuRotation * objectNormal);
          #ifdef FLIP_SIDED
            transformedNormal = - transformedNormal;
          #endif
          #ifdef USE_TANGENT
            vec3 transformedTangent = normalMatrix * (gpuRotation * objectTangent);
            #ifdef FLIP_SIDED
              transformedTangent = - transformedTangent;
            #endif
          #endif
          `,
                );

                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
          vec3 transformed = vec3( position );

          vDisplayHeight = gpuDisplayHeight;
          vNoise = aNoise;
          vIllum = aIllumination;

          #if IS_TIP == 1
            float tipScale = min(1.0, gpuDisplayHeight * 3.0);
            transformed *= tipScale;
            transformed += vec3(0.0, 0.0, gpuDisplayHeight);
          #else
            transformed *= vec3(1.0, 1.0, gpuDisplayHeight);
          #endif

          transformed = gpuRotation * transformed;
          transformed += aBasePosition;

          vec3 baseColor = mix(uColorGrnd1, uColorGrnd2, vNoise);
          vec3 finalColor = baseColor;

          float h = gpuDisplayHeight;
          if (h < 1.5) {
            float shadow = (h < 0.8) ? (0.6 + h * 0.5) : 1.0;
            finalColor *= shadow;
          } else if (h < 3.5) {
            float t = (h - 1.5) / 2.0;
            float smoothT = t * t * (3.0 - 2.0 * t);
            finalColor = mix(baseColor, uColorEdge, smoothT);
          } else {
            float t = min(1.0, (h - 3.5) / 1.5);
            finalColor = mix(uColorEdge, uColorPeak, t);
            if (h > 5.0) {
              float w = min(1.0, (h - 5.0) * 0.15);
              finalColor = mix(finalColor, vec3(1.0), w);
            }
          }

          vec3 tipColorBase;
          if (h < 1.5) {
            tipColorBase = min(vec3(1.0), finalColor * 1.1 + vec3(0.15));
          } else {
            tipColorBase = min(vec3(1.0), finalColor * 1.2);
          }

          #if IS_TIP == 1
            finalColor = tipColorBase;
          #endif

          if (vIllum > 0.0) {
            float illum = vIllum;
            #if IS_TIP == 0
              finalColor = mix(finalColor, uColorPeak, illum * 0.6);
            #else
              finalColor = mix(finalColor, vec3(1.0), illum);
            #endif
          }

          vColor = finalColor;
          `,
                );
            };
            return mat;
        };

        const stalkMat = createShaderMaterial(false);
        const tipMat = createShaderMaterial(true);

        const stalkMesh = new THREE.InstancedMesh(stalkGeom, stalkMat, totalCount);
        const tipMesh = new THREE.InstancedMesh(tipGeom, tipMat, totalCount);

        stalkMesh.castShadow = true;
        stalkMesh.receiveShadow = true;
        tipMesh.castShadow = true;
        tipMesh.receiveShadow = true;

        stalkMesh.frustumCulled = false;
        tipMesh.frustumCulled = false;

        // Initialize instance matrices
        const stalkMatArr = stalkMesh.instanceMatrix.array;
        const tipMatArr = tipMesh.instanceMatrix.array;
        for (let i = 0; i < totalCount; i++) {
            const o = i * 16;
            stalkMatArr[o] = 1;
            stalkMatArr[o + 5] = 1;
            stalkMatArr[o + 10] = 1;
            stalkMatArr[o + 15] = 1;
            tipMatArr[o] = 1;
            tipMatArr[o + 5] = 1;
            tipMatArr[o + 10] = 1;
            tipMatArr[o + 15] = 1;
        }
        stalkMesh.instanceMatrix.needsUpdate = true;
        tipMesh.instanceMatrix.needsUpdate = true;

        // Initialize position data
        let idx = 0;
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const worldX = (c / gridCols - 0.5) * groundWidth;
                const worldY = -(r / gridRows - 0.5) * groundHeight;
                const noise = Math.sin(worldX * 0.4) + Math.cos(worldY * 0.4) + Math.sin((worldX + worldY) * 0.25) + Math.random() * 0.6;

                for (let s = 0; s < stalksPerCell; s++) {
                    if (idx >= totalCount) break;

                    positions.current[idx * 3] = worldX + (Math.random() - 0.5) * 0.1;
                    positions.current[idx * 3 + 1] = worldY + (Math.random() - 0.5) * 0.1;
                    positions.current[idx * 3 + 2] = (Math.random() - 0.5) * 0.4;

                    const angle = Math.random() * Math.PI * 2;
                    const tilt = Math.random() * 0.55;

                    baseEulers.current[idx * 3] = Math.sin(angle) * tilt;
                    baseEulers.current[idx * 3 + 1] = Math.cos(angle) * tilt;
                    baseEulers.current[idx * 3 + 2] = Math.random() * Math.PI;

                    startScalesRef.current[idx] = 0;
                    targetScalesRef.current[idx] = 0;
                    noiseValues.current[idx] = Math.max(0, Math.min(1, noise * 0.5 + 0.25));

                    idx++;
                }
            }
        }

        // Set attributes
        const positionAttr = new THREE.InstancedBufferAttribute(positions.current, 3);
        const eulerAttr = new THREE.InstancedBufferAttribute(baseEulers.current, 3);
        const startScaleAttr = new THREE.InstancedBufferAttribute(startScalesRef.current, 1);
        const targetScaleAttr = new THREE.InstancedBufferAttribute(targetScalesRef.current, 1);
        const delayAttr = new THREE.InstancedBufferAttribute(delaysRef.current, 1);
        const noiseAttr = new THREE.InstancedBufferAttribute(noiseValues.current, 1);
        const bendAttr = new THREE.InstancedBufferAttribute(bendsRef.current, 2);
        const illumAttr = new THREE.InstancedBufferAttribute(illuminationRef.current, 1);

        stalkMesh.geometry.setAttribute('aBasePosition', positionAttr);
        stalkMesh.geometry.setAttribute('aBaseEuler', eulerAttr);
        stalkMesh.geometry.setAttribute('aStartScale', startScaleAttr);
        stalkMesh.geometry.setAttribute('aTargetScale', targetScaleAttr);
        stalkMesh.geometry.setAttribute('aDelay', delayAttr);
        stalkMesh.geometry.setAttribute('aNoise', noiseAttr);
        stalkMesh.geometry.setAttribute('aBend', bendAttr);
        stalkMesh.geometry.setAttribute('aIllumination', illumAttr);

        tipMesh.geometry.setAttribute('aBasePosition', positionAttr);
        tipMesh.geometry.setAttribute('aBaseEuler', eulerAttr);
        tipMesh.geometry.setAttribute('aStartScale', startScaleAttr);
        tipMesh.geometry.setAttribute('aTargetScale', targetScaleAttr);
        tipMesh.geometry.setAttribute('aDelay', delayAttr);
        tipMesh.geometry.setAttribute('aNoise', noiseAttr);
        tipMesh.geometry.setAttribute('aBend', bendAttr);
        tipMesh.geometry.setAttribute('aIllumination', illumAttr);

        scene.add(stalkMesh);
        scene.add(tipMesh);

        stalkMeshRef.current = stalkMesh;
        tipMeshRef.current = tipMesh;
    }

    const initScene = useCallback((container: HTMLElement) => {
        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050505, 0.015);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 44);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
        renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x1a1c12, 0.2);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x101505, 0.1);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.5);
        dirLight.position.set(12, 22, 14);
        dirLight.castShadow = !isMobile;
        if (!isMobile) {
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.bias = -0.0005;
        }
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0xdfff00, 0.2);
        rimLight.position.set(-15, -10, -5);
        scene.add(rimLight);

        // Mouse light
        const mouseLight = new THREE.PointLight(colorState.current.colorPeak, 4.0, 90, 2.0);
        scene.add(mouseLight);
        mouseLightRef.current = mouseLight;

        // Setup dust and geometry
        setupDust(scene);
        setupGeometry(scene);
    }, []);

    const cleanupScene = useCallback(() => {
        if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current.domElement.remove();
        }
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
    }, []);

    return {
        sceneRef,
        cameraRef,
        rendererRef,
        stalkMeshRef,
        tipMeshRef,
        mouseLightRef,
        dustParticlesRef,
        interactiveDustRef,
        shaderUniformsRef,
        positions,
        baseEulers,
        startScalesRef,
        targetScalesRef,
        noiseValues,
        illuminationRef,
        bendsRef,
        delaysRef,
        activeDustPositionsRef,
        activeDustVelocitiesRef,
        activeDustLifetimesRef,
        activeDustIndexRef,
        colorState,
        initScene,
        cleanupScene,
    };
}
