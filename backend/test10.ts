process.env.LOCAL_MODE = "true";
import express from 'express';
import { runDirectAnalysis } from './src/services/analyze';
const app = express(); app.listen(3011, () => console.log('Listening 11'));
