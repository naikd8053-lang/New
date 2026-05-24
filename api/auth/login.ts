import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    let email: any = undefined;
    let password: any = undefined;
    let body: any = req.body;

    if (!body) {
      // read raw body stream
      body = "";
      for await (const chunk of req) {
        body += chunk;
      }
    }

    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        email = parsed.email;
        password = parsed.password;
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    } else if (body && typeof body === "object") {
      email = body.email;
      password = body.password;
    }

    // Simple demo credentials support for the public demo account
    if (email === "demo@myfitnesspal.com" && password === "password") {
      const user = {
        id: "demo-user",
        email: "demo@myfitnesspal.com",
        name: "Demo User"
      };

      return res.status(200).json({ token: "demo-token", user });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (err: any) {
    // Debug info for deployment troubleshooting
    const bodyType = typeof req.body;
    const preview = bodyType === 'string' ? (req.body as string).slice(0,200) : (req.body ? Object.keys(req.body).slice(0,20) : null);
    return res.status(500).json({ error: String(err), bodyType, bodyPreview: preview, headers: req.headers });
  }
}
