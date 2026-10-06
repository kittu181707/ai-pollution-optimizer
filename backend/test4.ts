import express from 'express';
import { geocode } from './src/services/geocode';
const app = express(); app.listen(3005, () => console.log('Listening 5'));
