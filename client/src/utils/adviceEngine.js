const KP = {
    NOSE: 0, L_EYE: 1, R_EYE: 2, L_EAR: 3, R_EAR: 4,
    L_SHOULDER: 5, R_SHOULDER: 6, L_ELBOW: 7, R_ELBOW: 8,
    L_WRIST: 9, R_WRIST: 10, L_HIP: 11, R_HIP: 12
};

function getJoint(poseArray, jointIndex) {
    const x = poseArray[jointIndex * 2];
    const y = poseArray[jointIndex * 2 + 1];
    if (x <= 5 && y <= 5) return null; 
    return { x, y };
}

function getDistance(p1, p2) {
    if (!p1 || !p2) return null;
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getAngle(p1, p2) {
    if (!p1 || !p2) return null;
    const dy = p2.y - p1.y;
    const dx = p2.x - p1.x;
    return Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
}

function getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// --- THE BIOMETRIC GATE: Prevents hallucinating on flowers/buildings ---
function isStructurallyHuman(pose) {
    const lShoulder = getJoint(pose, KP.L_SHOULDER);
    const rShoulder = getJoint(pose, KP.R_SHOULDER);
    const lHip = getJoint(pose, KP.L_HIP);

    // 1. Core structural points must exist
    if (!lShoulder || !rShoulder || !lHip) return false;

    // 2. Shoulders must be somewhat horizontal (width > height diff)
    const shoulderWidth = getDistance(lShoulder, rShoulder);
    const shoulderHeightDiff = Math.abs(lShoulder.y - rShoulder.y);
    if (shoulderWidth < 20 || shoulderHeightDiff > shoulderWidth * 1.5) return false;

    // 3. Hips MUST be physically below the shoulders (Y axis increases downwards)
    if (lHip.y < lShoulder.y) return false;

    return true; 
}

export function generateAdvice(pose, lighting, attributes) {
    const adviceList = [];
    const IMG_SIZE = 384; 

    // --- 1. AESTHETICS (Lighting) ---
    let expectedScore = 0;
    for (let i = 0; i < 10; i++) expectedScore += lighting[i] * (i + 1);

    if (expectedScore < 4.5) {
        adviceList.push(getRandomResponse([
            "💡 Lighting: The image feels a bit flat. Try seeking stronger directional light or boosting the shadows in post.",
            "💡 Tone: The contrast is relatively low. Re-positioning the subject near a window could add dramatic depth.",
            "💡 Exposure: The AI detected muddy tonal distribution. Consider bumping the exposure slightly."
        ]));
    } else if (expectedScore > 6.8) {
        adviceList.push(getRandomResponse([
            "✨ Quality: Excellent aesthetic balance! The lighting distribution looks highly professional.",
            "✨ Vibe: Strong dynamic range detected. The contrast between subject and background is superb.",
            "✨ Aesthetics: The lighting geometry here is fantastic. Very cinematic."
        ]));
    } else {
        adviceList.push(getRandomResponse([
            "📸 Lighting: A solid, standard exposure. It's safe, but adding a rim-light could make the subject pop more.",
            "📸 Balance: The lighting is decent, though playing with the white balance could give it a stronger mood.",
            "📸 Exposure: Good overall capture, easily workable in editing software."
        ]));
    }

    // --- 2. THE HUMAN CHECK ---
    if (!isStructurallyHuman(pose)) {
        adviceList.push(getRandomResponse([
            "🌿 Composition: Evaluated as a landscape, macro, or still-life. Pay attention to the rule of thirds to anchor the scene.",
            "🏛️ Subject: No clear human pose found. Look for leading lines in the environment to draw the viewer's eye.",
            "🎨 Frame: Evaluated as an abstract/environmental shot. The lighting holds the weight of the composition here."
        ]));
        return adviceList; // EXIT EARLY: Do not calculate posture on non-humans!
    }

    // --- 3. MICRO-POSE (Only runs if human) ---
    const nose = getJoint(pose, KP.NOSE);
    if (nose) {
        const center = IMG_SIZE / 2;
        if (nose.y > center - 40 && nose.y < center + 40) {
            adviceList.push(getRandomResponse([
                "📐 Framing: The subject's face is dead-center. Try placing their eyes near the upper third line for a classic portrait look.",
                "📐 Headroom: There might be too much dead space above the head. Try tilting the camera down slightly."
            ]));
        }
    }

    const lShoulder = getJoint(pose, KP.L_SHOULDER);
    const rShoulder = getJoint(pose, KP.R_SHOULDER);
    
    if (lShoulder && rShoulder) {
        const shoulderAngle = getAngle(lShoulder, rShoulder);
        const deviation = Math.min(shoulderAngle, Math.abs(180 - shoulderAngle));
        
        if (deviation > 12 && deviation < 45) {
            adviceList.push(getRandomResponse([
                "🧍 Posture: The shoulders are noticeably uneven. Ask the subject to square up to project more confidence.",
                "🧍 Lean: The subject is slouching slightly to one side. Having them shift their weight can balance the frame."
            ]));
        }
    }

    const lElbow = getJoint(pose, KP.L_ELBOW);
    const rElbow = getJoint(pose, KP.R_ELBOW);
    const torsoWidth = getDistance(lShoulder, rShoulder); 
    
    if (lElbow && rElbow && lShoulder) {
        const lGap = getDistance(lElbow, lShoulder);
        const rGap = getDistance(rElbow, rShoulder);
        
        // If elbows are super close to the shoulders, arms are pinned down
        if (lGap < torsoWidth * 0.8 && rGap < torsoWidth * 0.8) {
            adviceList.push(getRandomResponse([
                "🦾 Body Language: The arms are pinned stiffly. Creating negative space around the waist (like a hand in a pocket) works wonders.",
                "🦾 Silhouette: The pose feels a bit rigid. Asking them to interact with a prop or bend an elbow adds instant energy."
            ]));
        }
    }

    return adviceList;
}