import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to quickly see changes
 * 2. we will return an error message on exception in your Worker code
 */
const DEBUG = false;

export default {
  async fetch(request, env, ctx) {
    try {
      // Add custom logic here before serving the request
      if (DEBUG) {
        console.log(request.method + ' ' + request.url);
      }

      // Customize caching
      if (request.url.includes('/api/')) {
        return fetch(request);
      }

      // mapRequestToAsset lets us match paths to files in our KV bucket. Useful
      // for mapping `/assets/logo.png` to `/assets/logo.png`, or `/` to `/index.html`
      let options = {};

      /**
       * You'll need to add `type: "CompiledContentType"` to your `wrangler.toml` file
       * after you configure it to build the application. We do this because we want to
       * cache WASM files in the Worker side
       */
      // options.cacheControl = {
      //   bypassCache: DEBUG,
      // };

      const page = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );

      // allow headers to be altered
      const response = new Response(page.body, page);
      response.headers.set('Cache-Control', 'public, max-age=3600');
      return response;
    } catch (e) {
      // if an error is thrown try to serve the asset at 404.html
      if (!DEBUG) {
        const notFoundResponse = await getAssetFromKV(
          {
            mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req),
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          options
        );

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
      }

      return new Response(`An error occurred: ${e.message}`, { status: 500 });
    }
  },
};
