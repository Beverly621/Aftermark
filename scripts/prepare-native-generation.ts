import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  compileNativeGenerationPlan,
  parseNativeSourceAnalysis,
  sourceSha256,
} from "../src/lib/rendering/native-imagegen";
import {
  atomicWriteJson,
  loadStudioRuntimeContext,
  safeProjectPath,
  writeStudioStatus,
} from "../src/lib/studio/runtime.server";

async function main(): Promise<void> {
  const projectArgument = argumentValue("--project");
  if (!projectArgument) throw new Error("Usage: npm run studio:prepare -- --project <absolute-project-path>");
  const context = await loadStudioRuntimeContext(projectArgument);
  if (!context.request) throw new Error("The Studio request is not ready.");
  if (context.status.state === "complete") {
    process.stdout.write(`${JSON.stringify({ resumed: true, state: "complete", output: context.status.output })}\n`);
    return;
  }

  try {
    await writeStudioStatus(context.projectRoot, context.session, "planning_art", "Turning the source analysis into a generation plan.");
    const source = await readFile(safeProjectPath(context.projectRoot, context.request.sourceImagePath));
    const analysisValue = JSON.parse(await readFile(safeProjectPath(context.projectRoot, "analysis.json"), "utf8"));
    const analysis = parseNativeSourceAnalysis(analysisValue, context.request);
    if (analysis.sourceImageSha256 !== sourceSha256(source)) {
      throw new Error("analysis.json does not describe the current source image.");
    }
    const plan = compileNativeGenerationPlan(context.request, analysis);
    await atomicWriteJson(safeProjectPath(context.projectRoot, "generation-plan.json"), plan);
    await writeStudioStatus(context.projectRoot, context.session, "generating_outer_art", "The built-in image generation step is ready.");
    process.stdout.write(`${JSON.stringify({
      resumed: false,
      state: "generating_outer_art",
      analysisPath: "analysis.json",
      generationPlanPath: "generation-plan.json",
      rawOutputPath: "assets/outer-art.raw.png",
      compiledPrompt: plan.compiledPrompt,
    })}\n`);
  } catch (error) {
    await writeStudioStatus(context.projectRoot, context.session, "error", "The source analysis or generation plan could not be validated.");
    throw error;
  }
}

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
