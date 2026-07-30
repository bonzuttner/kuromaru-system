export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/kuromaru")) {
      url.pathname = url.pathname.replace(/^\/kuromaru/, "") || "/";
    }
    return env.ASSETS.fetch(new Request(url, request));
  },
};
