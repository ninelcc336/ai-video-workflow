import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function loadPythonFfmpeg() {
  const pythonPath = path.join(rootDir, ".venv", "Scripts", "python.exe");

  try {
    return execFileSync(
      pythonPath,
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      {
        cwd: rootDir,
        encoding: "utf8"
      }
    ).trim();
  } catch {
    return null;
  }
}

async function loadBinary(moduleName, field = "path") {
  const mod = await import(moduleName);
  return mod.default?.[field] || mod[field] || mod.default;
}

const ffmpegPath = loadPythonFfmpeg() || await loadBinary("ffmpeg-static");
const ffprobePackage = await import("ffprobe-static");
const ffprobePath = ffprobePackage.default?.path || ffprobePackage.path;
const shimDir = path.join(rootDir, ".hf-bin");
const shimFfmpegPath = path.join(shimDir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
const shimFfprobePath = path.join(shimDir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe");

mkdirSync(shimDir, { recursive: true });
if (!existsSync(shimFfmpegPath)) {
  copyFileSync(ffmpegPath, shimFfmpegPath);
}
if (!existsSync(shimFfprobePath)) {
  copyFileSync(ffprobePath, shimFfprobePath);
}

const env = {
  ...process.env,
  FFMPEG_BIN: ffmpegPath,
  FFPROBE_BIN: ffprobePath,
  PATH: `${shimDir}${path.delimiter}${path.dirname(ffprobePath)}${path.delimiter}${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH || ""}`
};

const args = process.argv.slice(2);
const hyperframesCliPath = path.join(rootDir, "node_modules", "hyperframes", "dist", "cli.js");
const child = spawn(
  process.execPath,
  [hyperframesCliPath, ...args],
  {
    cwd: rootDir,
    env,
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
