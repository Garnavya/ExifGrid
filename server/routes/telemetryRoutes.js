import express from 'express';
import { incrementTelemetry, getTelemetry } from '../controllers/telemetryController.js';

const router = express.Router();

router.post('/', incrementTelemetry);
router.get('/', getTelemetry);

export default router;