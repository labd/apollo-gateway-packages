import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	publint: true,
	failOnWarn: true,
	// TypeScript 7 is used on purpose; its "experimental API" notice is not actionable
	suppressWarnings: [
		"TypeScript 7.0 does not yet have a stable API",
		// tsdown >=0.23.7 deprecates the tsgo generator on TS 7.0; remove once on TS 7.1
		"The `tsgo` generator on TypeScript 7.0 is deprecated",
	],
	clean: true,
	dts: true,
	sourcemap: false,
	format: ["esm"],
	outDir: "dist",
	// Keep dist/index.js and dist/index.d.ts (matching package.json main/types)
	fixedExtension: false,
	// Keep type imports from dependencies external, like the previous tsup output
	deps: { dts: { neverBundle: true } },
	shims: false,
});
