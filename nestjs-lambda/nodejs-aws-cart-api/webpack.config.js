const webpack = require('webpack');
const path = require('path');

module.exports = function (options) {
  const { plugins, ...config } = options;
  return {
    ...config,
    entry: ['./src/lambda.ts'], // Entry file for Lambda
    target: 'node', // Target Node.js environment
    externals: [
      /* Add any external libraries if needed */
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lambda.js',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      ...plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            'cache-manager',
            'class-validator',
            'class-transformer',
            '@nestjs/websockets/socket-module',
            '@nestjs/microservices/microservices-module',
            'fastify-swagger',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource, {
              paths: [process.cwd()],
            });
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
    resolve: {
      extensions: ['.ts', '.js'], // Resolve TypeScript and JavaScript files
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  };
};
