import { serve } from "inngest/next";

import { functions } from "@/jobs/document-processing";
import { inngest } from "@/jobs/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions
});
