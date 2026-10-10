import { Router } from 'express';
import swaggerUi, { type SwaggerUiOptions } from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

const uiOptions: SwaggerUiOptions = {
  customSiteTitle: 'Layora API docs',
  swaggerOptions: { persistAuthorization: true },
};

/**
 * `GET /openapi.json` serves the OpenAPI document and `/docs/` renders it with Swagger UI.
 *
 * Swagger UI loads its scripts (including the generated `swagger-ui-init.js`) as
 * same-origin files, so it works under the API's strict `script-src 'self'` policy.
 */
export function createDocsRouter() {
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });

  // `serveFiles` serves the UI assets and the init script, which carries `swaggerOptions`,
  // so it needs the same options as `setup`. It also redirects `/docs` to `/docs/`, which
  // the page's relative asset URLs rely on.
  router.use('/docs', swaggerUi.serveFiles(openApiDocument, uiOptions));
  router.get('/docs', swaggerUi.setup(openApiDocument, uiOptions));

  return router;
}
