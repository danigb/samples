const { resolve } = require("path");
const { readdir } = require("fs").promises;

main();

function isHidden(path) {
  return path.includes("/.") || path.startsWith(".");
}

async function main() {
  console.log(`
<html>
    <head>
        <title>Samples</title>
    <body>
   `);
  for await (const path of getFiles("./audio")) {
    const fileName = path.slice(path.indexOf("/audio") + 7);
    if (!isHidden(fileName)) {
      console.log(
        `<a href="https://danigb.github.io/samples/${fileName}">${fileName}</a><br/>`
      );
    }
  }
  console.log(`
    </body>
</html>
   `);
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
