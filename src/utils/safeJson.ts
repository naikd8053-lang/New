export default async function safeJson(res: Response): Promise<any | null> {
  if (!res) return null;
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}
