import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';


// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // This plugin will only be used in development ('npm run dev')
    command === 'serve' && {
      name: 'custom-api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // We only care about requests to /api/*
          if (req.url && req.url.startsWith('/api/')) {
            const urlWithoutQuery = req.url.split('?')[0];
            const modulePath = path.resolve(__dirname, `.${urlWithoutQuery}.ts`);
            
            try {
              // ssrLoadModule is the right way to load a TS module in Vite's dev server
              const module = await server.ssrLoadModule(modulePath);
              
              if (module.default && typeof module.default === 'function') {
                await module.default(req, res); // Assumes a default export handler
              } else {
                console.error(`API module ${modulePath} does not have a default export.`);
                res.statusCode = 404;
                res.end('Not Found');
              }
            } catch (error) {
              // Vite's ssrLoadModule will print a nicely formatted error to the console
              // We just need to handle the response.
              console.error(`Error processing API request for ${req.url}:`, error);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          } else {
            // Not an API call, pass it to the next middleware (usually Vite's own)
            next();
          }
        });
      },
    },
  ],
  
}));
