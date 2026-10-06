import express from 'express';
import { runDirectAnalysis } from './src/services/analyze';
const app = express();
app.listen(3002, () => console.log('Listening'));
