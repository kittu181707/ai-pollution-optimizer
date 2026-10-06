import express from 'express';
import { environmentAt } from './src/services/environment';
const app = express(); app.listen(3008, () => console.log('Listening 8'));
