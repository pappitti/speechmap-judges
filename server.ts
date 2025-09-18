import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 7860; // Hugging Face Spaces use port 7860


// 1. Handle API calls
app.use('/api', async (req: Request, res: Response) => {
  const urlWithoutQuery = req.originalUrl.split('?')[0];
  const modulePath = path.resolve(__dirname, `.${urlWithoutQuery}.js`); 

  try {
    const module = await import(modulePath);
    type ApiHandler = (req: Request, res: Response) => Promise<void> | void;

    const handler: ApiHandler = module.default;

    if (typeof handler === 'function') {
      await handler(req, res);
    } else {
      console.error(`API module ${modulePath} does not have a valid default export.`);
      res.status(404).send('Not Found');
    }
  } catch (error) {
    const isModuleNotFoundError = (e: unknown): e is { code: string } => {
      return typeof e === 'object' && e !== null && 'code' in e;
    };

    if (isModuleNotFoundError(error) && error.code === 'ERR_MODULE_NOT_FOUND') {
      res.status(404).send('Not Found');
    } else {
      console.error(`Error processing API request for ${req.originalUrl}:`, error);
      res.status(500).send('Internal Server Error');
    }
  }
});

// 2. Serve the built React app (frontend)
app.use(express.static(path.join(__dirname)));

// 3. Fallback for client-side routing
app.get(/.*/, (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});