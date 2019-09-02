// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'main.js',
  output: {
    file: 'index.js',
    format: 'esm',
    name: 'MyModule'
  },
  plugins: [
    resolve()
  ]
};