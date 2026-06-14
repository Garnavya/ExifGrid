// COCO Keypoint Map (x, y pairs, so index * 2)
const KP = {
    NOSE: 0,
    L_SHOULDER: 5, R_SHOULDER: 6,
    L_ELBOW: 7, R_ELBOW: 8,
    L_WRIST: 9, R_WRIST: 10,
    L_HIP: 11, R_HIP: 12
};

// Helper: Calculates the physical bend of a joint (in degrees)
function calculateAngle(a, b, c, pose) {
    const ax = pose[a * 2], ay = pose[a * 2 + 1];
    const bx = pose[b * 2], by = pose[b * 2 + 1];
    const cx = pose[c * 2], cy = pose[c * 2 + 1];

    const radians = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

export function generateAdvice(pose, lighting) {
    const adviceList = [];

    // --- 1. AESTHETICS / LIGHTING ANALYSIS ---
    let expectedScore = 0;
    for (let i = 0; i < 10; i++) {
        expectedScore += lighting[i] * (i + 1);
    }
    
    console.log(`🧠 [AI DEBUG] Calculated Aesthetic Score: ${expectedScore.toFixed(2)} / 10`);

    if (expectedScore < 4.5) {
        adviceList.push("💡 The AI detected flat lighting or poor composition. Try moving the subject closer to a natural light source or reducing background clutter.");
    } else if (expectedScore > 6.5) {
        adviceList.push("✨ Great aesthetic balance! The lighting and framing look highly professional.");
    } else {
        adviceList.push("📸 The lighting is decent, but you could add a bit more contrast or adjust your camera angle to make the subject pop.");
    }

    // --- 2. KINEMATICS / POSE ANALYSIS ---
    // SANITY CHECK: Calculate the physical spread between the Left Shoulder and Right Hip
    const torsoSpreadX = Math.abs(pose[KP.L_SHOULDER * 2] - pose[KP.R_HIP * 2]);
    const torsoSpreadY = Math.abs(pose[KP.L_SHOULDER * 2 + 1] - pose[KP.R_HIP * 2 + 1]);

    console.log(`🧠 [AI DEBUG] Torso Spread - X: ${torsoSpreadX.toFixed(1)}px, Y: ${torsoSpreadY.toFixed(1)}px`);

    // If the spread is tiny, the AI is hallucinating a skeleton on a non-human object
    if (torsoSpreadX < 15 && torsoSpreadY < 15) {
        console.log("🧠 [AI DEBUG] Pose rejected: Spread too small. Likely a landscape or macro shot.");
        adviceList.push("🌿 No clear human pose detected. Evaluating as Landscape/Macro.");
        return adviceList; // Exit early so we don't calculate arm angles on a flower!
    }

    // Check if shoulders are level
    const lShoulderY = pose[KP.L_SHOULDER * 2 + 1];
    const rShoulderY = pose[KP.R_SHOULDER * 2 + 1];
    
    if (Math.abs(lShoulderY - rShoulderY) > 15) {
        adviceList.push("🧍 The subject's shoulders are tilted. Ask them to square their shoulders for a clean portrait, or lean further into the tilt for a dynamic fashion look.");
    }

    // Check arm rigidity
    const leftArmAngle = calculateAngle(KP.L_SHOULDER, KP.L_ELBOW, KP.L_WRIST, pose);
    const rightArmAngle = calculateAngle(KP.R_SHOULDER, KP.R_ELBOW, KP.R_WRIST, pose);

    console.log(`🧠 [AI DEBUG] Arm Angles - Left: ${leftArmAngle.toFixed(1)}°, Right: ${rightArmAngle.toFixed(1)}°`);

    if (leftArmAngle > 165 && rightArmAngle > 165) {
        adviceList.push("🦾 Both arms are stiff and straight, creating a tense look. Have the subject put a hand in their pocket or interact with a prop.");
    } else if (leftArmAngle < 90 || rightArmAngle < 90) {
        adviceList.push("💪 Dynamic arm posture detected! Bending the elbows adds great energy to the composition.");
    }

    return adviceList;
}