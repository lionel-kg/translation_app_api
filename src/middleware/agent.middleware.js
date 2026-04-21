/**
 * Middleware d'authentification pour l'agent n8n.
 * Vérifie le header "x-agent-key" contre la variable d'env AGENT_API_KEY.
 *
 * Usage dans n8n : ajouter un header HTTP
 *   x-agent-key: <valeur de AGENT_API_KEY>
 */
const agentAuth = (req, res, next) => {
  const key = req.headers["x-agent-key"];

  if (!process.env.AGENT_API_KEY) {
    return res.status(500).json({ error: "AGENT_API_KEY not configured on server" });
  }

  if (!key) {
    return res.status(401).json({ error: "Missing x-agent-key header" });
  }

  if (key !== process.env.AGENT_API_KEY) {
    return res.status(403).json({ error: "Invalid agent key" });
  }

  // Mark request as coming from the agent
  req.agent = true;
  next();
};

module.exports = agentAuth;
