const DATA = require("./out.json");

const layers = DATA.groups
  .map((group) => ({
    name: group.group_label,
    vel_range: [group.lovel, group.hivel],
    cutoff: group.cutoff,
    samples: group.regions
      .map((region) => [
        region.pitch_keycenter,
        region.sample,
        region.lokey,
        region.hikey,
      ])
      .sort((a, b) => a[0] - b[0]),
  }))
  .filter((group) => group.name);
console.log(
  JSON.stringify(
    {
      baseUrl: "https://danigb.github.io/samples/audio/splendid-grand-piano",
      formats: ["ogg", "m4a"],
      layers,
    },
    null,
    2
  )
);
