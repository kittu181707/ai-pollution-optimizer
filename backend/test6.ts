import express from 'express';
import { optimizeCandidateSets } from './src/core/optimizer';
const app = express(); app.listen(3007, () => console.log('Listening 7'));
