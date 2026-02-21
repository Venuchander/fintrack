export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const BLAND_API_KEY = process.env.BLAND_API_KEY;

  if (!BLAND_API_KEY) {
    return res
      .status(500)
      .json({ error: "Bland AI API key not configured on server" });
  }

  try {
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BLAND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Bland AI proxy error:", error);
    return res
      .status(500)
      .json({ error: "Failed to reach Bland AI", message: error.message });
  }
}
