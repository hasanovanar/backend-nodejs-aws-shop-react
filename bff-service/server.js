const fastify = require("fastify")({ logger: true });
const axios = require("axios");
require("dotenv").config();

fastify.all("/:recipient", async (request, reply) => {
  const { recipient } = request.params;
  const recipientURL = process.env[`${recipient.toUpperCase()}_SERVICE_URL`];

  if (!recipientURL) {
    return reply.status(502).send({ error: "Cannot process request" });
  }

  try {
    const { method, query, body } = request;
    const response = await axios({
      method,
      url: recipientURL,
      params: query,
      data: body,
    });
    reply.status(response.status).send(response.data);
  } catch (error) {
    const statusCode = error.response ? error.response.status : 500;
    const message = error.response
      ? error.response.data
      : "Internal Server Error";
    reply.status(statusCode).send({ error: message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info(`Server listening on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
