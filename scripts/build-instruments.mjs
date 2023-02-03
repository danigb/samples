import { readdir, readFile, writeFile } from "fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "path";
import { parseSfz } from "./lib/parse-sfz.mjs";

const ALL = [];
const BASE = "https://danigb.github.io/samples/gs-e-pianos";
const SUMMARIES = [];

const sourceFiles = new Set();
const oggFiles = new Set();
const m4aFiles = new Set();

main();

async function main() {
  const packs = [
    {
      instFolder: "gs-e-pianos",
      source: "https://github.com/sfzinstruments/GregSullivan.E-Pianos",
      license: "Creative Commons Attribution 3.0 Unported License",
    },
    {
      instFolder: "dsmolken",
      source: "https://github.com/sfzinstruments/dsmolken.double-bass",
      license: "Creative Commons Zero v1.0 Universal",
    },
    {
      instFolder: "karoyfer",
      source: "https://github.com/sfzinstruments",
      license: "Creative Commons Zero v1.0 Universal",
    },
  ];

  for (const pack of packs) {
    await processPack(pack);
  }
}

async function processPack(pack) {
  for await (const path of getFiles("./audio/" + pack.instFolder)) {
    if (path.endsWith(".sfz")) await processSfz(path, pack);
    if (path.endsWith(".wav") || path.endsWith(".flac")) sourceFiles.add(path);
    if (path.endsWith(".ogg")) oggFiles.add(path.replace(".ogg", ""));
    if (path.endsWith(".m4a")) m4aFiles.add(path.replace(".m4a", ""));
  }

  for (const data of ALL) {
    await convertSfz(data);
  }

  for (const fileWithExtension of sourceFiles) {
    const file = fileWithExtension.slice(0, fileWithExtension.lastIndexOf("."));
    const folder = file.slice(0, file.lastIndexOf("/"));
    if (!oggFiles.has(file)) {
      const cmd = `ffmpeg -n -i "${fileWithExtension}" -c:a libopus -b:a 64k "${file}.ogg"`;
      console.log(">>> OGG", cmd);
      await runCommand(folder, cmd);
    }

    if (!m4aFiles.has(file)) {
      const cmd = `ffmpeg -n -i "${fileWithExtension}" -c:a aac -b:a 128k "${file}.m4a"`;
      console.log(">>> m4a", cmd);
      await runCommand(folder, cmd);
    }
  }

  const result = SUMMARIES.sort((a, b) => a.name.localeCompare(b.name));

  await writeFile(
    "./audio/" + pack.instFolder + "/instruments.json",
    JSON.stringify(result)
  );
}

async function processSfz(fullPath, pack) {
  const path = fullPath.split(`/audio/${pack.instFolder}/`)[1];
  console.log(">>>", fullPath, path);
  const [folder, sfz] = path.split("/");
  const name = sfz.replace(".sfz", "");
  const websfz = slugify(name) + ".websfz.json";
  const websfzUrl = BASE + "/" + folder + "/" + websfz;

  ALL.push({ fullPath, path, folder, name, websfz, websfzUrl, pack });
}

async function convertSfz({ fullPath, name, websfz, pack, folder }) {
  const data = await readFile(fullPath);
  const sfz = parseSfz(data.toString());
  sfz.meta.name ??= name;
  sfz.meta.formats = ["ogg", "m4a"];
  sfz.meta.baseUrl = `https://danigb.github.io/samples/${pack.instFolder}/${folder}/`;
  sfz.meta.websfzUrl = `https://danigb.github.io/samples/${pack.instFolder}/${folder}/${websfz}`;
  sfz.meta.source = pack.source;
  sfz.meta.license = pack.license;

  for (const group of sfz.groups) {
    for (const sample of group.regions) {
      sample.sample = sample.sample.replace(".flac", "");
    }
  }
  const dest = fullPath.split(pack.instFolder)[0] + pack.instFolder;
  const outFile = `${dest}/${folder}/${websfz}`;

  await writeFile(outFile, JSON.stringify(sfz));

  SUMMARIES.push({
    name: sfz.meta.name,
    websfzUrl: sfz.meta.websfzUrl,
  });
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

const slugify = (text, separator = "-") =>
  text
    .toString()
    .normalize("NFD") // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator);

function runCommand(cwd, cmd) {
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
