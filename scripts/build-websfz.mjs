import { readFileSync, writeFileSync } from "fs";
import { parseSfz } from "./lib/parse-sfz.mjs";

main();

async function main() {
  buildPack("Plucked Idiophones", {
    "kalimba-kenya": {
      sfz: "Kalimba, Kenya",
      tags: "idiophones plucked kalimba kenya",
    },
    "kalimba-tanzania": {
      sfz: "Kalimba, Tanzania",
      tags: "idiophones plucked kalimba tanzania",
    },
    "kalimba-zimbabwe-low-b": {
      sfz: "Mbira dzaVadzimu Nyamaropa, Zimbabwe, Low B",
      tags: "idiophones plucked kalimba zimbabwe",
    },
    "kalimba-zimbabwe-low-g": {
      sfz: "Mbira Mavembe (Gandanga), Zimbabwe, Low G",
      tags: "idiophones plucked kalimba zimbabwe",
    },
    "nyuga-nyuga": {
      sfz: "Nyunga Nyunga, Mozambique, Low F",
      tags: "idiophones plucked nyuga mozambique",
    },
  });
}

async function buildPack(folder, instruments) {
  const baseUrl = `./audio/vcsl/${folder}`;
  const summaries = [];
  for (const fileName of Object.keys(instruments)) {
    const file = instruments[fileName];
    const sfzPath = `${baseUrl}/${file.sfz}.sfz`;
    const sfz = parseSfz(readFileSync(sfzPath).toString());
    sfz.meta.name ??= file.sfz;
    sfz.meta.tags ??= file.tags.split(" ");
    sfz.meta.formats = ["ogg", "m4a"];
    sfz.meta.baseUrl = `https://danigb.github.io/samples/vcsl/${folder}/${file.sfz}`;
    sfz.meta.websfzUrl = `https://danigb.github.io/samples/vcsl/${folder}/${fileName}.websfz.json`;
    sfz.meta.source = "https://github.com/sgossner/VCSL";
    sfz.meta.license = "Creative Commons 0";

    for (const group of sfz.groups) {
      for (const sample of group.regions) {
        sample.sample = sample.sample
          .replace(file.sfz + "/", "")
          .replace(".wav", "");
      }
    }

    const summary = {
      name: sfz.meta.name,
      websfzUrl: sfz.meta.websfzUrl,
      tags: sfz.meta.tags,
    };
    summaries.push(summary);

    console.log(fileName, sfz.meta);
    const outPath = `${baseUrl}/${fileName}.websfz.json`;
    writeFileSync(outPath, JSON.stringify(sfz));
  }

  console.log(JSON.stringify(summaries));
}
