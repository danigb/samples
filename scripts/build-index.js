const { resolve } = require("path");
const { readdir, writeFile } = require("fs").promises;

main();

function isHidden(path) {
  return path.includes("/.") || path.startsWith(".");
}

function isAudio(path) {
  return (
    path.endsWith(".mp3") ||
    path.endsWith(".m4a") ||
    path.endsWith(".ogg") ||
    path.endsWith(".wav")
  );
}

function Document(body) {
  return `
<html>
    <head>
        <title>Samples</title>
    <body>
      ${body.join("\n")}
    </body>
</html>
  `;
}

function AudioTag(src) {
  return `
  <audio
        controls
        src="${src}">
            <a href="${src}">
                Download audio
            </a>
    </audio>
  `
    .replaceAll(/\s+/g, " ")
    .trim();
}

function Link(fileName) {
  return `<div>
      <pre>https://danigb.github.io/samples/${fileName}</pre>
  ${
    false && isAudio(fileName)
      ? AudioTag(fileName)
      : `<a href="https://danigb.github.io/samples/${fileName}">${fileName}</a>`
  }
  </div>`;
}

async function main() {
  const paths = (await getFilesArray("./audio")).map((path) =>
    path.slice(path.indexOf("/audio") + 7)
  );

  const json = paths
    .filter((path) => path.endsWith(".json"))
    .map((path) => Link(path));
  const audio = paths
    .filter((path) => path.endsWith(".ogg") || path.endsWith(".m4a"))
    .map((path) => Link(path));
  const sfz = paths
    .filter((path) => path.endsWith(".sfz"))
    .map((path) => Link(path));

  await writeFile("./audio/index.html", Document([...json, ...sfz, ...audio]));
}

async function getFilesArray(dir) {
  const paths = [];
  for await (const path of getFiles(dir)) {
    if (!isHidden(path)) paths.push(path);
  }
  return paths.sort();
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
