import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

const DEBUG = false;

export default {
  async fetch(request, env, ctx) {
    try {
      if (DEBUG) {
        console.log(request.method + ' ' + request.url);
      }

      if (request.url.includes('/api/')) {
        return fetch(request);
      }

      let options = {};

      const page = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );

      const response = new Response(page.body, page);
      response.headers.set('Cache-Control', 'public, max-age=3600');
      return response;
    } catch (e) {
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
