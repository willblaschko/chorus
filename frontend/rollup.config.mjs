import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

// Bundles the Lit panel into the served, committed asset the integration ships.
// HACS installs the repo as-is, so this output must be committed.
export default {
  input: "src/chorus-panel.ts",
  output: {
    file: "../custom_components/chorus/frontend/chorus-panel.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    // outDir must live inside the rollup output file's directory (plugin constraint).
    typescript({ tsconfig: "./tsconfig.json", outDir: "../custom_components/chorus/frontend" }),
    terser({ format: { comments: false } }),
  ],
};
