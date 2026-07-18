import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing-router";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
