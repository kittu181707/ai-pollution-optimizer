import express from 'express';
const app = express();
app.get('/foo', async (req, res) => res.json({}));
app.listen(3015, () => console.log('Listening 15'));
