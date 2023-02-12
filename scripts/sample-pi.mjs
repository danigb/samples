import { readdir } from "fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "path";

main();

async function main() {
  const files = [];
  for await (const path of getFiles("./audio/sample-pi")) {
    if (path.endsWith(".flac")) {
      const file = path.replace(".flac", "");
      const cmdOgg = `ffmpeg -n -i "${file}.flac" -c:a libopus -b:a 64k "${file}.ogg"`;
      await runCommand(".", cmdOgg);
      const cmdM4a = `ffmpeg -n -i "${file}.flac" -c:a aac -b:a 128k "${file}.m4a"`;
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

function runCommand(cwd, cmd, cold) {
  console.log(cmd);
  if (cold) return;

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
