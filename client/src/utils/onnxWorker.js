import * as ort from 'onnxruntime-web';

// Set ONNX to use WebAssembly for maximum browser compatibility and speed
ort.env.wasm.numThreads = 1; 
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
let session = null;
let isProcessing = false;

// --- STEP 1: The Tensor Converter ---
// Translates a raw ImageBitmap into the exact Float32 mathematical matrix PyTorch expects
function preprocessImage(imageBitmap) {
    const width = 224;
    const height = 224;

    // Create an invisible canvas to resize the image
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw and forcefully scale the image to 224x224
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Extract the raw RGBA pixel data
    const imageData = ctx.getImageData(0, 0, width, height).data;
    
    // PyTorch ImageNet Normalization values
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // Create a Float32Array to hold the tensor data (3 channels * 224 * 224)
    const float32Data = new Float32Array(3 * width * height);

    // PyTorch expects channels first: [Red matrix, Green matrix, Blue matrix]
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imageData[index] / 255.0;
            const g = imageData[index + 1] / 255.0;
            const b = imageData[index + 2] / 255.0;

            // Normalize and assign to the correct channel blocks
            float32Data[y * width + x] = (r - mean[0]) / std[0]; // Red
            float32Data[width * height + y * width + x] = (g - mean[1]) / std[1]; // Green
            float32Data[2 * width * height + y * width + x] = (b - mean[2]) / std[2]; // Blue
        }
    }

    // Create and return the ONNX Tensor object
    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

// --- STEP 2: The Main Inference Loop ---
// Listens for messages from the React UI
self.onmessage = async (event) => {
    const { imageBitmap, action } = event.data;

    if (action !== 'analyze') return;

    // --- THE SHIELD: If already processing, ignore duplicate React strict-mode calls ---
    if (isProcessing) {
        console.log("[ONNX] Engine is busy. Ignoring duplicate request.");
        return; 
    }

    isProcessing = true; // Lock the engine

    try {
        // 1. Load the model into memory (only happens once per session)
        if (!session) {
            self.postMessage({ status: 'loading', message: 'Downloading AI Blueprint...' });
            
            // Step A: Manually fetch the raw bytes of the ONNX blueprint
            const modelResponse = await fetch('/models/exifgrid_v1_production.onnx');
            const modelBuffer = await modelResponse.arrayBuffer();

            self.postMessage({ status: 'loading', message: 'Downloading AI Weights...' });

            // Step B: Manually fetch the raw bytes of the heavy data file
            const dataResponse = await fetch('/models/exifgrid_v1_production.onnx.data');
            const dataBuffer = await dataResponse.arrayBuffer();
            const dataArray = new Uint8Array(dataBuffer);

            self.postMessage({ status: 'loading', message: 'Stitching AI in Memory...' });

            // Step C: Force-feed both files directly into the WebAssembly engine
            session = await ort.InferenceSession.create(modelBuffer, {
                executionProviders: ['wasm'],
                externalData: [
                    {
                        data: dataArray,
                        path: 'exifgrid_v1_production.onnx.data' // Maps the binary directly to the requested filename
                    }
                ]
            });
        }

        self.postMessage({ status: 'processing', message: 'Analyzing Kinematics & Light...' });

        // 2. Convert the image to math
        const tensor = preprocessImage(imageBitmap);

        // 3. Run the AI! 
        const feeds = { input_image: tensor };
        const results = await session.run(feeds);

        // 4. Extract the raw arrays
        const poseData = Array.from(results.pose_keypoints.data);
        const lightingData = Array.from(results.lighting_histogram.data);

        // --- NEW: LOG THE RAW MATH TO THE CONSOLE ---
        console.log("🧠 [AI DEBUG] Raw Pose Array (34 coordinates):", poseData);
        console.log("🧠 [AI DEBUG] Raw Lighting Histogram (10 bins):", lightingData);

        // 5. Send the finished math back
        self.postMessage({
            status: 'success',
            pose: poseData,
            lighting: lightingData
        });

    } catch (error) {
        console.error("ONNX Worker Error:", error);
        self.postMessage({ status: 'error', error: error.message });
    } finally {
        isProcessing = false; // --- UNLOCK THE ENGINE WHEN FINISHED ---
    }
};