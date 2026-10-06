import express from 'express';
import { handler as prepare } from './src/handlers/prepare';
const app = express(); app.listen(3010, () => console.log('Listening 10'));
