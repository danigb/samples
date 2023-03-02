import { existsSync, writeFileSync } from "fs";
import { readdir } from "fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "path";

const COLD_RUN = false;
main();

function getAudioFileName(path) {
  if (path.endsWith(".flac") || path.endsWith(".wav") || path.endsWith("mp3")) {
    return path.replace(".flac", "").replace(".wav", "").replace(".mp3", "");
  }
}

async function main() {
  const data = {};
  for await (const path of getFiles("./audio/drum-machines")) {
    let audioFileName = getAudioFileName(path);
    if (audioFileName) {
      const relativePath = audioFileName
        .split("drum-machines")[1]
        .split("/")
        .slice(2)
        .join("/");
      const rootPath = audioFileName.split("drum-machines")[1].split("/")[1];
      data[rootPath] ??= [];
      data[rootPath].push(relativePath);
      const oggOut = audioFileName + ".ogg";
      if (!existsSync(oggOut)) {
        const cmdOgg = `ffmpeg -n -i "${path}" -c:a libopus -b:a 64k "${oggOut}"`;
        await runCommand(".", cmdOgg);
      }
      const m4aOut = audioFileName + ".m4a";
      if (!existsSync(m4aOut)) {
        const cmdM4a = `ffmpeg -n -i "${path}" -c:a aac -b:a 128k "${m4aOut}"`;
        await runCommand(".", cmdM4a);
      }
    }
  }
  Object.keys(data).forEach((key) => {
    const samples = data[key];
    const formats = ["ogg", "m4a"];
    const baseUrl = `https://danigb.github.io/samples/drum-machines/${key}/`;
    const json = JSON.stringify({ baseUrl, name: key, samples, formats });
    writeFileSync(`./audio/drum-machines/${key}/dm.json`, json);
  });
}

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res.toLowerCase();
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
