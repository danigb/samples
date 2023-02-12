import { readdir } from "fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "path";

const COLD_RUN = false;
main();

async function main() {
  for await (const path of getFiles("./audio/drum-machines")) {
    if (
      path.endsWith(".flac") ||
      path.endsWith(".wav") ||
      path.endsWith("mp3")
    ) {
      const output = path
        .replace(".flac", "")
        .replace(".wav", "")
        .replace(".mp3", "");
      const cmdOgg = `ffmpeg -n -i "${path}" -c:a libopus -b:a 64k "${output}.ogg"`;
      await runCommand(".", cmdOgg);
      const cmdM4a = `ffmpeg -n -i "${path}" -c:a aac -b:a 128k "${output}.m4a"`;
      await runCommand(".", cmdM4a);
    }
  }
}

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

function runCommand(cwd, cmd) {
  console.log(cmd);
  if (COLD_RUN) return;

  function onExit(eventEmitter) {
    return new Promise((resolve, reject) => {
      eventEmitter.once("exit", (exitCode, signalCode) => {
        resolve({ exitCode, signalCode });
      });
      eventEmitter.once("error", (err) => {
        // (C)
        reject(err);
      });
    });
  }
  const childProcess = spawn(cmd, {
    shell: true,
    stdio: "inherit",
    cwd,
  });
  return onExit(childProcess);
}
