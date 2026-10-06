import express from 'express';
import { handler as explain } from './src/handlers/explain';
const app = express(); app.listen(3012, () => console.log('Listening 12'));
