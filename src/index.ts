"use strict";

import express, { type Express } from 'express';

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
