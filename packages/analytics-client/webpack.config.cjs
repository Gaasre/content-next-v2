const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'analytics.js',
      library: {
        name: 'ContentNextAnalytics',
        type: 'var',
        export: 'default'
      },
      globalObject: 'this',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              // Don't generate declaration files for browser script
              compilerOptions: {
                declaration: false,
                declarationMap: false
              }
            }
          },
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            mangle: {
              // Obfuscate variable names
              properties: {
                regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
              }
            },
            compress: {
              // Remove console.log in production
              drop_console: isProduction,
              // Remove debugger statements
              drop_debugger: isProduction,
              // Remove unused code
              dead_code: true,
              // Optimize conditionals
              conditionals: true,
              // Optimize boolean contexts
              booleans: true,
              // Optimize loops
              loops: true,
              // Optimize unused variables
              unused: true
            },
            format: {
              // Remove comments
              comments: false
            }
          },
          extractComments: false
        })
      ]
    },
    devtool: isProduction ? false : 'source-map',
    target: 'web',
    mode: isProduction ? 'production' : 'development'
  };
};
