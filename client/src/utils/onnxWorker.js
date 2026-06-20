import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = 1; 
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
let session = null;
let isProcessing = false;

// --- MEMORY LEAK FIX: Instantiate the Canvas exactly ONCE ---
const TENSOR_SIZE = 384;
const canvas = new OffscreenCanvas(TENSOR_SIZE, TENSOR_SIZE);
const ctx = canvas.getContext('2d', { willReadFrequently: true }); 

function preprocessImage(imageBitmap) {
    ctx.clearRect(0, 0, TENSOR_SIZE, TENSOR_SIZE);
    ctx.drawImage(imageBitmap, 0, 0, TENSOR_SIZE, TENSOR_SIZE);
    
    const imageData = ctx.getImageData(0, 0, TENSOR_SIZE, TENSOR_SIZE).data;
    
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const float32Data = new Float32Array(3 * TENSOR_SIZE * TENSOR_SIZE);

    for (let y = 0; y < TENSOR_SIZE; y++) {
        for (let x = 0; x < TENSOR_SIZE; x++) {
            const index = (y * TENSOR_SIZE + x) * 4;
            const r = imageData[index] / 255.0;
            const g = imageData[index + 1] / 255.0;
            const b = imageData[index + 2] / 255.0;

            float32Data[y * TENSOR_SIZE + x] = (r - mean[0]) / std[0]; 
            float32Data[TENSOR_SIZE * TENSOR_SIZE + y * TENSOR_SIZE + x] = (g - mean[1]) / std[1]; 
            float32Data[2 * TENSOR_SIZE * TENSOR_SIZE + y * TENSOR_SIZE + x] = (b - mean[2]) / std[2]; 
        }
    }
    return new ort.Tensor('float32', float32Data, [1, 3, TENSOR_SIZE, TENSOR_SIZE]);
}

self.onmessage = async (event) => {
    const { imageBitmap, action } = event.data;
    if (action !== 'analyze') return;
    if (isProcessing) return; 

    isProcessing = true; 

    try {
        if (!session) {
            self.postMessage({ status: 'loading', message: 'Downloading AI Blueprint...' });
            const modelResponse = await fetch('/models/exifgrid_v1_production.onnx');
            const modelBuffer = await modelResponse.arrayBuffer();

            // THE FIX: Fetch the heavy weights file again
            self.postMessage({ status: 'loading', message: 'Downloading AI Weights...' });
            const dataResponse = await fetch('/models/exifgrid_v1_production.onnx.data');
            const dataBuffer = await dataResponse.arrayBuffer();
            const dataArray = new Uint8Array(dataBuffer);

            self.postMessage({ status: 'loading', message: 'Stitching AI in Memory...' });
            
            // THE FIX: Mount both files into the WebAssembly engine
            session = await ort.InferenceSession.create(modelBuffer, { 
                executionProviders: ['wasm'],
                externalData: [
                    {
                        data: dataArray,
                        path: 'exifgrid_v1_production.onnx.data' 
                    }
                ]
            });
        }

        self.postMessage({ status: 'processing', message: 'Analyzing Kinematics & Light...' });
        const tensor = preprocessImage(imageBitmap);
        
        const feeds = { input_image: tensor };
        const results = await session.run(feeds);

        const poseData = Array.from(results.pose_keypoints.data);
        const lightingData = Array.from(results.lighting_histogram.data);
        const attrData = Array.from(results.human_attributes.data); 

        self.postMessage({
            status: 'success',
            pose: poseData,
            lighting: lightingData,
            attributes: attrData
        });

    } catch (error) {
        console.error("ONNX Worker Error:", error);
        self.postMessage({ status: 'error', error: error.message });
    } finally {
        isProcessing = false; 
    }
};