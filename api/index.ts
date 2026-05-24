import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    message: "MyFitnessPal Clone API",
    status: "running",
    timestamp: new Date().toISOString()
  });
}
