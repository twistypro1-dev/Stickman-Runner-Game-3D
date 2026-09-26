// 1. Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 2. Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// 3. Create the Road and Environment
const roadGeometry = new THREE.PlaneGeometry(6, 500);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.z = -100;
scene.add(road);

const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xb7b7b7 });
const sidewalkLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 500), sidewalkMaterial);
sidewalkLeft.position.set(-3.9, 0.05, -100);
scene.add(sidewalkLeft);

const sidewalkRight = sidewalkLeft.clone();
sidewalkRight.position.x = 3.9;
scene.add(sidewalkRight);

const roadBorderMaterial = new THREE.MeshStandardMaterial({ color: 0xd2d2d2, roughness: 0.9 });
const leftRoadBorder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 500), roadBorderMaterial);
leftRoadBorder.position.set(-2.95, 0.08, -100);
scene.add(leftRoadBorder);

const rightRoadBorder = leftRoadBorder.clone();
rightRoadBorder.position.x = 2.95;
scene.add(rightRoadBorder);

const laneLineMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
for (let z = -260; z <= 40; z += 12) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 5), laneLineMaterial);
    line.position.set(0, 0.06, z);
    scene.add(line);
}

for (let z = -260; z <= 40; z += 10) {
    const buildingLeft = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3 + Math.random() * 5, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xd9d9d9 })
    );
    buildingLeft.position.set(-7.5, 1.5 + Math.random() * 2, z);
    scene.add(buildingLeft);

    const buildingRight = buildingLeft.clone();
    buildingRight.position.x = 7.5;
    scene.add(buildingRight);

    if (Math.random() < 0.5) {
        const extraLeft = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 2 + Math.random() * 3, 1.8),
            new THREE.MeshStandardMaterial({ color: 0xc7c7c7 })
        );
        extraLeft.position.set(-10.8, 1 + Math.random() * 1.5, z + 6);
        scene.add(extraLeft);

        const extraRight = extraLeft.clone();
        extraRight.position.x = 10.8;
        scene.add(extraRight);
    }
}

// 4. Create the Player as a stickman
function createStickman() {
    const stickman = new THREE.Group();
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const limbMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMaterial);
    head.position.y = 1.65;
    stickman.add(head);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 10), limbMaterial);
    torso.position.y = 1.0;
    stickman.add(torso);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 10), limbMaterial);
    leftArm.position.set(-0.16, 0.94, 0);
    leftArm.rotation.x = 0.8;
    stickman.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 10), limbMaterial);
    rightArm.position.set(0.16, 0.94, 0);
    rightArm.rotation.x = -0.8;
    stickman.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 10), limbMaterial);
    leftLeg.position.set(-0.12, 0.38, 0);
    leftLeg.rotation.x = 0.15;
    stickman.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 10), limbMaterial);
    rightLeg.position.set(0.12, 0.38, 0);
    rightLeg.rotation.x = -0.15;
    stickman.add(rightLeg);

    stickman.head = head;
    stickman.torso = torso;
    stickman.leftArm = leftArm;
    stickman.rightArm = rightArm;
    stickman.leftLeg = leftLeg;
    stickman.rightLeg = rightLeg;

    return stickman;
}

const player = createStickman();
player.position.set(0, 0.5, 0);
scene.add(player);

// Lane positions (Left, Center, Right)
const lanes = [-2, 0, 2];
let currentLaneIndex = 1; // Start in the middle lane

// Game state variables
let isRunning = false;
let isPaused = false;
let gameState = "menu";
let obstacles = [];
let pickupItems = [];
let playerJetpack = null;
let hasJetpack = false;
let jetpackTimer = 0;
let gameSpeed = 0.4;
let distanceMeters = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);
let isFalling = false;
let fallStartTime = 0;
const fallDuration = 250;

const audioState = {
    ctx: null,
    masterGain: null,
    menuMusicTimer: null,
    gameMusicTimer: null,
    runningTimer: null,
    jetpackTimer: null,
    musicStep: 0,
    lastRunningStep: 0,
};

function ensureAudio() {
    if (audioState.ctx) {
        if (audioState.ctx.state === "suspended") {
            audioState.ctx.resume();
        }
        return audioState.ctx;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;

    const ctx = new AudioCtor();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(ctx.destination);

    audioState.ctx = ctx;
    audioState.masterGain = masterGain;
    return ctx;
}

function playTone({ frequency = 440, duration = 0.12, type = "sine", volume = 10, sweep = 0, delay = 0 }) {
    const ctx = ensureAudio();
    if (!ctx || !audioState.masterGain) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    if (sweep) {
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(30, frequency + sweep),
            ctx.currentTime + delay + duration
        );
    }

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioState.masterGain);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration + 0.04);
}

const SFX_VOLUME = 6;
const RUNNING_VOLUME = 0.15;
const JETPACK_VOLUME = 0.15;

function playJumpSound() {
    playTone({ frequency: 360, duration: 0.11, type: "square", volume: SFX_VOLUME, sweep: 160 });
    playTone({ frequency: 540, duration: 0.09, type: "triangle", volume: SFX_VOLUME, sweep: 130, delay: 0.03 });
}

function playPickupSound() {
    playTone({ frequency: 660, duration: 0.08, type: "triangle", volume: SFX_VOLUME, sweep: 200 });
    playTone({ frequency: 880, duration: 0.1, type: "triangle", volume: SFX_VOLUME, sweep: 250, delay: 0.08 });
}

function playHitSound() {
    playTone({ frequency: 170, duration: 0.18, type: "sawtooth", volume: SFX_VOLUME, sweep: -100 });
    playTone({ frequency: 90, duration: 0.22, type: "square", volume: SFX_VOLUME, sweep: -60, delay: 0.06 });
}

function playStartSound() {
    playTone({ frequency: 440, duration: 0.12, type: "triangle", volume: SFX_VOLUME, sweep: 110 });
    playTone({ frequency: 660, duration: 0.12, type: "triangle", volume: SFX_VOLUME, sweep: 180, delay: 0.09 });
}

function playPauseSound() {
    playTone({ frequency: 260, duration: 0.09, type: "square", volume: SFX_VOLUME, sweep: 40 });
}

function playRunningStep() {
    const base = hasJetpack ? 140 : 210;
    const volume = RUNNING_VOLUME;
    playTone({ frequency: base, duration: 0.065, type: "square", volume, sweep: hasJetpack ? 110 : 70 });
    playTone({ frequency: base * 1.7, duration: 0.048, type: "triangle", volume: volume * 0.7, sweep: 25, delay: 0.02 });
}

function playJetpackLoopSound() {
    playTone({ frequency: 120, duration: 0.08, type: "sawtooth", volume: JETPACK_VOLUME, sweep: 80 });
    playTone({ frequency: 80, duration: 0.09, type: "square", volume: JETPACK_VOLUME, sweep: 60, delay: 0.04 });
}

function stopAllMusic() {
    if (audioState.menuMusicTimer) {
        clearInterval(audioState.menuMusicTimer);
        audioState.menuMusicTimer = null;
    }
    if (audioState.gameMusicTimer) {
        clearInterval(audioState.gameMusicTimer);
        audioState.gameMusicTimer = null;
    }
}

function startMenuMusic() {
    stopAllMusic();
}

function startGameplayMusic() {
    stopAllMusic();
}

function stopBackgroundMusic() {
    stopAllMusic();
}

function stopRunningSfx() {
    if (audioState.runningTimer) {
        clearInterval(audioState.runningTimer);
        audioState.runningTimer = null;
    }
}

function startRunningSfx() {
    if (audioState.runningTimer) return;
    audioState.runningTimer = setInterval(() => {
        if (!isRunning || isPaused || hasJetpack) {
            stopRunningSfx();
            return;
        }
        playRunningStep();
    }, 160);
}

function stopJetpackSfx() {
    if (audioState.jetpackTimer) {
        clearInterval(audioState.jetpackTimer);
        audioState.jetpackTimer = null;
    }
}

function startJetpackSfx() {
    if (audioState.jetpackTimer) return;
    audioState.jetpackTimer = setInterval(() => {
        if (!hasJetpack || !isRunning || isPaused) {
            stopJetpackSfx();
            return;
        }
        playJetpackLoopSound();
    }, 120);
}

function updateLoopingAudio() {
    stopAllMusic();

    if (gameState === "menu") {
        stopRunningSfx();
        stopJetpackSfx();
        return;
    }

    if (gameState === "running" && !isPaused) {
        if (hasJetpack) {
            startJetpackSfx();
            stopRunningSfx();
        } else {
            startRunningSfx();
            stopJetpackSfx();
        }
        return;
    }

    if (gameState === "paused") {
        stopRunningSfx();
        stopJetpackSfx();
        return;
    }

    if (gameState === "gameover") {
        stopBackgroundMusic();
        stopRunningSfx();
        stopJetpackSfx();
    }
}

// UI Overlay for messages
const ui = document.getElementById("ui");
const controls = document.getElementById("controls");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const startScreen = document.getElementById("start-screen");
const startTitle = document.getElementById("start-title");
const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");

function formatDistance(meters) {
    if (meters < 1000) return `${Math.floor(meters)}m`;

    const km = meters / 1000;
    if (Number.isInteger(km)) return `${Math.floor(km)}km`;
    return `${km.toFixed(1).replace(/\.0$/, "")}km`;
}

function getRunSpeed() {
    if (distanceMeters < 500) return 0.4;
    if (distanceMeters < 1000) return 0.5;
    if (distanceMeters < 2000) return 0.7;
    return 0.9 + Math.min(0.9, (distanceMeters - 2000) / 2500 * 0.9);
}

function updateScoreUI() {
    if (scoreEl) scoreEl.textContent = `Score: ${formatDistance(distanceMeters)}`;
    if (bestScoreEl) bestScoreEl.textContent = `Best: ${formatDistance(bestScore)}`;
}

function updatePauseButton() {
    if (!pauseButton) return;

    const shouldShow = gameState === "running" || gameState === "paused";
    pauseButton.classList.toggle("hidden", !shouldShow);
    pauseButton.textContent = gameState === "paused" ? "Resume (Shift)" : "Pause (Shift)";
}

function updateUiState() {
    if (!ui) return;
    ui.classList.toggle("game-over", gameState === "gameover");
    if (controls) controls.style.opacity = gameState === "gameover" ? "0.3" : "1";
}

function triggerPlayerDefeat() {
    if (isFalling) return;

    isRunning = false;
    gameState = "gameover";
    isPaused = false;
    isFalling = true;
    fallStartTime = performance.now();
    updateLoopingAudio();
    playHitSound();

    ui.innerText = "Game Over! Press SPACE to Restart.";
    ui.classList.add("game-over");
    if (scoreEl) scoreEl.style.visibility = "hidden";
    if (bestScoreEl) bestScoreEl.style.visibility = "hidden";
    updatePauseButton();
}

function showStartScreen() {
    if (startScreen) startScreen.classList.remove("hidden");
    if (startTitle) startTitle.textContent = "Stickman Runner Game 3D";
    if (playButton) playButton.textContent = "Play";
    if (scoreEl) scoreEl.style.visibility = "hidden";
    if (bestScoreEl) bestScoreEl.style.visibility = "hidden";
    gameState = "menu";
    updateLoopingAudio();
    updateUiState();
    updatePauseButton();
}

function hideStartScreen() {
    if (startScreen) startScreen.classList.add("hidden");
    if (scoreEl) scoreEl.style.visibility = "visible";
    if (bestScoreEl) bestScoreEl.style.visibility = "visible";
    updatePauseButton();
}

window.addEventListener("pointerdown", () => {
    ensureAudio();
    if (gameState === "menu") {
        updateLoopingAudio();
    }
}, { once: true });

window.addEventListener("keydown", () => {
    ensureAudio();
    if (gameState === "menu") {
        updateLoopingAudio();
    }
}, { once: true });

updateScoreUI();

// 5. Handle Keyboard Controls
window.addEventListener("keydown", (e) => {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        e.preventDefault();

        if (gameState === "running" || gameState === "paused") {
            togglePause();
        }
        return;
    }

    if (e.code === "ArrowUp") {
        e.preventDefault();

        if (gameState === "menu") {
            startGame();
            return;
        }

        if (gameState === "paused") {
            togglePause();
            return;
        }

        if (gameState === "running") {
            jump();
        }
    }

    if (e.code === "Space") {
        e.preventDefault();

        if (gameState === "menu") {
            startGame();
            return;
        }

        if (gameState === "gameover") {
            startGame();
            return;
        }

        if (gameState === "paused") {
            togglePause();
            return;
        }
    }

    // Left & Right Lane Switching
    if (gameState !== "running" || isPaused) {
        return;
    }

    if (e.key === "ArrowLeft" && currentLaneIndex > 0) {
        currentLaneIndex--;
    } else if (e.key === "ArrowRight" && currentLaneIndex < lanes.length - 1) {
        currentLaneIndex++;
    }
    player.position.x = lanes[currentLaneIndex];
});

// Jump mechanic with smooth arc
let isJumping = false;
function jump() {
    if (isJumping || hasJetpack) return;
    isJumping = true;
    playJumpSound();
    
    let jumpProgress = 0;
    const jumpDuration = 450; // milliseconds
    const startTime = performance.now();
    const startY = player.position.y;
    const peakHeight = 1.8;

    function animateJump(currentTime) {
        const elapsed = currentTime - startTime;
        jumpProgress = elapsed / jumpDuration;

        if (jumpProgress < 1) {
            // Parabola formula for smooth up and down motion: 4 * x * (1 - x)
            player.position.y = startY + peakHeight * (4 * jumpProgress * (1 - jumpProgress));
            requestAnimationFrame(animateJump);
        } else {
            player.position.y = startY; // Land back down safely
            isJumping = false;
        }
    }

    requestAnimationFrame(animateJump);
}

// 6. Spawn Obstacles
function getVehicleColor(isBus) {
    const carColors = [0xff2d2d, 0xf5f5f5, 0x111111, 0x1a3d73, 0x7a7a7a];
    const busColors = [0xf5f5f5, 0xffd000, 0x2f5ee8, 0xf28c28];
    const palette = isBus ? busColors : carColors;
    return palette[Math.floor(Math.random() * palette.length)];
}

function createVehicle() {
    const vehicle = new THREE.Group();
    const isBus = Math.random() < 0.45;
    const color = getVehicleColor(isBus);

    const bodyLength = isBus ? 3.2 : 2.15;
    const bodyHeight = isBus ? 1.5 : 0.95;
    const bodyWidth = isBus ? 1.35 : 1.0;

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.28,
        roughness: 0.52
    });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.55, roughness: 0.4 });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xbfe3ff,
        transparent: true,
        opacity: 0.8,
        metalness: 0.2,
        roughness: 0.15
    });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xf8f2cf, emissive: 0xf8f2cf, emissiveIntensity: 0.35 });
    const tailLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff473a, emissive: 0xff473a, emissiveIntensity: 0.75 });

    const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(bodyLength * 0.98, bodyHeight * 0.78, bodyWidth * 0.95),
        bodyMaterial
    );
    chassis.position.y = 0.72;
    vehicle.add(chassis);

    const lowerTrim = new THREE.Mesh(
        new THREE.BoxGeometry(bodyLength * 0.9, 0.12, bodyWidth * 0.96),
        trimMaterial
    );
    lowerTrim.position.set(0, 0.34, 0);
    vehicle.add(lowerTrim);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(isBus ? bodyLength * 0.72 : bodyLength * 0.7, isBus ? 0.55 : 0.5, bodyWidth * 0.8),
        bodyMaterial
    );
    cabin.position.set(0, 1.18, 0);
    vehicle.add(cabin);

    const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(isBus ? bodyLength * 0.2 : bodyLength * 0.24, isBus ? 0.45 : 0.38, bodyWidth * 0.78),
        glassMaterial
    );
    windshield.position.set(isBus ? bodyLength * 0.24 : bodyLength * 0.2, 1.2, 0);
    windshield.rotation.y = isBus ? -0.18 : -0.21;
    vehicle.add(windshield);

    const rearGlass = windshield.clone();
    rearGlass.position.x = -bodyLength * 0.24;
    rearGlass.rotation.y = isBus ? 0.18 : 0.21;
    vehicle.add(rearGlass);

    const sideWindowLeft = new THREE.Mesh(
        new THREE.BoxGeometry(isBus ? bodyLength * 0.52 : bodyLength * 0.48, isBus ? 0.32 : 0.28, 0.04),
        glassMaterial
    );
    sideWindowLeft.position.set(0, 1.18, bodyWidth * 0.42);
    vehicle.add(sideWindowLeft);

    const sideWindowRight = sideWindowLeft.clone();
    sideWindowRight.position.z = -bodyWidth * 0.42;
    vehicle.add(sideWindowRight);

    const bumperFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, bodyWidth * 0.9),
        trimMaterial
    );
    bumperFront.position.set(bodyLength * 0.53, 0.56, 0);
    vehicle.add(bumperFront);

    const bumperRear = bumperFront.clone();
    bumperRear.position.x = -bodyLength * 0.53;
    vehicle.add(bumperRear);

    const grill = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.28, bodyWidth * 0.6),
        darkMaterial
    );
    grill.position.set(bodyLength * 0.54, 0.72, 0);
    vehicle.add(grill);

    const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.12), lightMaterial);
    headlightLeft.position.set(bodyLength * 0.54, 0.78, bodyWidth * 0.24);
    vehicle.add(headlightLeft);

    const headlightRight = headlightLeft.clone();
    headlightRight.position.z = -bodyWidth * 0.24;
    vehicle.add(headlightRight);

    const tailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.12), tailLightMaterial);
    tailLeft.position.set(-bodyLength * 0.54, 0.78, bodyWidth * 0.24);
    vehicle.add(tailLeft);

    const tailRight = tailLeft.clone();
    tailRight.position.z = -bodyWidth * 0.24;
    vehicle.add(tailRight);

    const mirrorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), trimMaterial);
    mirrorLeft.position.set(bodyLength * 0.2, 1.18, bodyWidth * 0.58);
    vehicle.add(mirrorLeft);

    const mirrorRight = mirrorLeft.clone();
    mirrorRight.position.z = -bodyWidth * 0.58;
    vehicle.add(mirrorRight);

    const wheelGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 22);
    const wheelOffsets = [
        [-bodyLength * 0.28, 0.23, bodyWidth * 0.58],
        [bodyLength * 0.29, 0.23, bodyWidth * 0.58],
        [-bodyLength * 0.28, 0.23, -bodyWidth * 0.58],
        [bodyLength * 0.29, 0.23, -bodyWidth * 0.58],
    ];

    const wheelRimMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8d8d, metalness: 0.7, roughness: 0.4 });

    wheelOffsets.forEach(([x, y, z]) => {
        const tyre = new THREE.Mesh(wheelGeometry, wheelMaterial);
        tyre.rotation.x = Math.PI / 2;
        tyre.position.set(x, y, z);
        vehicle.add(tyre);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.19, 16), wheelRimMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(x, y, z);
        vehicle.add(rim);
    });

    const roofRack = new THREE.Mesh(
        new THREE.BoxGeometry(isBus ? bodyLength * 0.55 : bodyLength * 0.38, 0.06, bodyWidth * 0.72),
        trimMaterial
    );
    roofRack.position.set(0, 1.58, 0);
    if (!isBus) {
        vehicle.add(roofRack);
    } else {
        const busRailing = roofRack.clone();
        busRailing.position.set(0, 1.58, 0);
        vehicle.add(busRailing);
    }

    vehicle.scale.set(1.15, 1.15, 1.15);
    vehicle.rotation.y = -Math.PI / 2;

    return vehicle;
}

function spawnObstacle() {
    if (!isRunning || isPaused) return;

    const maxSpawnCount = Math.random() < 0.35 ? 3 : 2;
    const spawnCount = Math.random() < 0.6 ? 1 : Math.floor(Math.random() * (maxSpawnCount - 1)) + 2;

    for (let i = 0; i < spawnCount; i++) {
        const obstacle = createVehicle();
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

        obstacle.position.set(randomLane, 0.5, -150 - i * 8);

        // Keep every vehicle facing the same backward direction so they never appear
        // reversed on the road.
        obstacle.rotation.y = -Math.PI / 2;

        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

function createJetpackItem() {
    const item = new THREE.Group();

    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x2a5d8f, metalness: 0.75, roughness: 0.35 });
    const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x1d2a36, metalness: 0.8, roughness: 0.25 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54a, emissive: 0xffd54a, emissiveIntensity: 0.45 });
    const glowMaterial = new THREE.MeshStandardMaterial({ color: 0x99e6ff, emissive: 0x99e6ff, emissiveIntensity: 0.9 });
    const strapMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4b3d, roughness: 0.8 });

    const tankMain = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.7, 0.26), metalMaterial);
    tankMain.position.set(0, 0.6, 0);
    item.add(tankMain);

    const tankFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.24), darkMetalMaterial);
    tankFront.position.set(0.22, 0.6, 0);
    item.add(tankFront);

    const tankAccent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.12), accentMaterial);
    tankAccent.position.set(0.34, 0.6, 0);
    item.add(tankAccent);

    const dorsalPlate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.44), darkMetalMaterial);
    dorsalPlate.position.set(0, 1.12, 0);
    item.add(dorsalPlate);

    const nozzleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), glowMaterial);
    nozzleLeft.rotation.z = Math.PI / 2;
    nozzleLeft.position.set(-0.22, 0.35, 0.2);
    item.add(nozzleLeft);

    const nozzleRight = nozzleLeft.clone();
    nozzleRight.position.x = 0.22;
    item.add(nozzleRight);

    const nozzleCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 12), darkMetalMaterial);
    nozzleCenter.rotation.z = Math.PI / 2;
    nozzleCenter.position.set(0, 0.3, 0.2);
    item.add(nozzleCenter);

    const nozzleBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), accentMaterial);
    nozzleBack.position.set(0, 0.34, -0.15);
    item.add(nozzleBack);

    const strapLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.04), strapMaterial);
    strapLeft.position.set(-0.24, 0.68, 0);
    strapLeft.rotation.z = 0.18;
    item.add(strapLeft);

    const strapRight = strapLeft.clone();
    strapRight.position.x = 0.24;
    strapRight.rotation.z = -0.18;
    item.add(strapRight);

    const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.04), strapMaterial);
    chestStrap.position.set(0, 0.84, 0.02);
    item.add(chestStrap);

    const ventLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.05), glowMaterial);
    ventLeft.position.set(-0.18, 0.62, 0.14);
    item.add(ventLeft);

    const ventRight = ventLeft.clone();
    ventRight.position.x = 0.18;
    item.add(ventRight);

    const flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa200,
        emissive: 0xff8a00,
        emissiveIntensity: 1.3,
        transparent: true,
        opacity: 0.9
    });

    const flameLeft = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 12), flameMaterial);
    flameLeft.position.set(-0.18, -0.04, 0.1);
    flameLeft.rotation.x = Math.PI;
    item.add(flameLeft);

    const flameRight = flameLeft.clone();
    flameRight.position.x = 0.18;
    item.add(flameRight);

    item.userData.flames = [flameLeft, flameRight];
    item.rotation.x = -0.7;
    item.rotation.z = 0.2;

    return item;
}

function setPlayerStickmanVisibility(visible) {
    player.children.forEach((child) => {
        if (child !== playerJetpack) {
            child.visible = visible;
        }
    });
}

function clearJetpack() {
    if (playerJetpack && playerJetpack.parent) {
        player.remove(playerJetpack);
    }
    playerJetpack = null;
    hasJetpack = false;
    jetpackTimer = 0;
    updateLoopingAudio();
}

function activateJetpack() {
    if (hasJetpack) return;
    hasJetpack = true;
    jetpackTimer = 10;
    playerJetpack = createJetpackItem();
    playerJetpack.scale.set(0.65, 0.65, 0.65);
    playerJetpack.position.set(0.2, 0.85, 0.1);
    player.add(playerJetpack);
    playPickupSound();
    updateLoopingAudio();
}

function spawnJetpackPickup() {
    if (!isRunning || isPaused || hasJetpack || Math.random() > 0.18) return;

    const item = createJetpackItem();
    item.scale.set(1.45, 1.45, 1.45);
    const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
    item.position.set(randomLane, 0.9, -150);
    scene.add(item);
    pickupItems.push(item);
}

function togglePause() {
    if (gameState === "running") {
        gameState = "paused";
        isPaused = true;
        ui.textContent = "Stickman Runner Game 3D";
        playPauseSound();
        updateLoopingAudio();
    } else if (gameState === "paused") {
        gameState = "running";
        isPaused = false;
        ui.textContent = "Stickman Runner Game 3D";
        playPauseSound();
        updateLoopingAudio();
    }
    ui.classList.remove("game-over");
    updateUiState();
    updatePauseButton();
}

setInterval(spawnObstacle, 800);
setInterval(spawnJetpackPickup, 6500);

// 7. Game Loop
function animate() {
    requestAnimationFrame(animate);

    const runCycle = Date.now() * 0.015;
    const armSwing = Math.sin(runCycle) * 0.9;
    const legSwing = Math.sin(runCycle) * 0.7;

    if (isFalling) {
        const elapsed = performance.now() - fallStartTime;
        const t = Math.min(elapsed / fallDuration, 1);
        const fallCurve = Math.sin((t * Math.PI) / 2);

        player.position.y = 0.5 - 0.6 * fallCurve;
        player.rotation.x = 1.2 * t;
        player.rotation.z = -1.5 * t;
        player.leftArm.rotation.x = 0.5 + 0.8 * t;
        player.rightArm.rotation.x = -0.5 - 0.8 * t;
        player.leftLeg.rotation.x = 0.4 * t;
        player.rightLeg.rotation.x = -0.4 * t;

        if (t >= 1) {
            isFalling = false;
            player.position.y = 0.08;
            player.rotation.x = 1.55;
            player.rotation.z = -1.55;
            player.leftArm.rotation.x = 0.8;
            player.rightArm.rotation.x = -0.8;
            player.leftLeg.rotation.x = 0.2;
            player.rightLeg.rotation.x = -0.2;
        }
    } else if (isRunning && !isPaused) {
        player.leftArm.rotation.x = 0.8 + armSwing;
        player.rightArm.rotation.x = -0.8 - armSwing;
        player.leftLeg.rotation.x = 0.15 - legSwing;
        player.rightLeg.rotation.x = -0.15 + legSwing;
        player.head.position.y = 1.65 + Math.sin(runCycle) * 0.04;

        if (hasJetpack) {
            jetpackTimer -= 0.016;
            player.position.y = 2 + Math.sin(runCycle * 2) * 0.6;

            if (playerJetpack && playerJetpack.userData.flames) {
                playerJetpack.userData.flames.forEach((flame, index) => {
                    const flicker = 0.8 + Math.sin(Date.now() * 0.045 + index * 1.5) * 0.35;
                    flame.scale.set(1 * flicker, 1.2 + flicker * 0.7, 1 * flicker);
                    flame.position.y = -0.04 + Math.sin(Date.now() * 0.05 + index) * 0.06;
                });
            }

            if (jetpackTimer <= 0) {
                clearJetpack();
                player.position.y = 0.5;
            }
        } else if (!isJumping) {
            player.position.y = 0.5;
        }

        const currentRunSpeed = getRunSpeed();
        const activeSpeed = hasJetpack ? currentRunSpeed * 5.0 : currentRunSpeed;
        distanceMeters += activeSpeed * 0.35;
        if (distanceMeters > bestScore) {
            bestScore = distanceMeters;
            localStorage.setItem("bestScore", String(bestScore));
        }
        updateScoreUI();

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].position.z += activeSpeed * 2;

            const isPowerupInvulnerable = hasJetpack;
            const obstacleHitsPlayer =
                Math.abs(obstacles[i].position.z - player.position.z) < 2.2 &&
                Math.abs(obstacles[i].position.x - player.position.x) < 1.6 &&
                player.position.y < 1.8;

            if (!isPowerupInvulnerable && obstacleHitsPlayer) {
                triggerPlayerDefeat();
                return;
            }

            if (obstacles[i].position.z > 10) {
                scene.remove(obstacles[i]);
                obstacles.splice(i, 1);
            }
        }

        for (let i = pickupItems.length - 1; i >= 0; i--) {
            pickupItems[i].position.z += activeSpeed * 2;

            if (
                Math.abs(pickupItems[i].position.z - player.position.z) < 2.8 &&
                Math.abs(pickupItems[i].position.x - player.position.x) < 1.8 &&
                Math.abs(pickupItems[i].position.y - player.position.y) < 1.8
            ) {
                activateJetpack();
                scene.remove(pickupItems[i]);
                pickupItems.splice(i, 1);
            } else if (pickupItems[i].position.z > 10) {
                scene.remove(pickupItems[i]);
                pickupItems.splice(i, 1);
            }
        }
    } else {
        player.leftArm.rotation.x = 0.8;
        player.rightArm.rotation.x = -0.8;
        player.leftLeg.rotation.x = 0.15;
        player.rightLeg.rotation.x = -0.15;
        player.head.position.y = 1.65;
        player.position.y = 0.5;
    }

    renderer.render(scene, camera);
}

function resetGame() {
    obstacles.forEach(obs => scene.remove(obs));
    pickupItems.forEach(item => scene.remove(item));
    obstacles = [];
    pickupItems = [];
    distanceMeters = 0;
    currentLaneIndex = 1;
    player.position.set(lanes[currentLaneIndex], 0.5, 0);
    player.rotation.set(0, 0, 0);
    clearJetpack();
    isPaused = false;
    isFalling = false;
    updateScoreUI();
    updatePauseButton();
}

function startGame() {
    ensureAudio();
    playStartSound();
    resetGame();
    hideStartScreen();
    isRunning = true;
    isPaused = false;
    gameState = "running";
    updateLoopingAudio();
    ui.textContent = "Stickman Runner Game 3D";
    ui.classList.remove("game-over");
    updateUiState();
    updatePauseButton();
}

if (playButton) {
    playButton.addEventListener("click", () => {
        startGame();
    });
}

if (pauseButton) {
    pauseButton.addEventListener("click", () => {
        if (gameState === "running" || gameState === "paused") {
            togglePause();
        }
    });
}

showStartScreen();
resetGame();
gameState = "menu";
updateLoopingAudio();
updatePauseButton();
animate();

// Handle window resizing
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});