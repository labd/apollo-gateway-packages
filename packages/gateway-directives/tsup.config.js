import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		clean: true,
		splitting: false,
		dts: true,
		sourcemap: false,
		format: ["esm"],
		outDir: "dist",
		shims: true,
	},
]);
