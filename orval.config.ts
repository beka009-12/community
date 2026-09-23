module.exports = {
  "my-startup-api": {
    input: "http://localhost:5003/docs-json",
    output: {
      mode: "tags-split",
      target: "./src/api/generated/endpoints",
      schemas: "./src/api/generated/models",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./src/api/index.ts",
          name: "customInstance",
        },
      },
    },
  },
};
