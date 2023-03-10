export function parseSfz(sfz, loadSfz = () => "") {
  const output = {
    meta: {},
    global: {},
    groups: [],
  };

  const lines = processMacros(prepareLines(sfz), loadSfz);

  let group = undefined;
  let region = undefined;
  let current = undefined;

  let control = undefined;

  lines.forEach((line, num) => {
    if (line.startsWith("//+")) {
      const [key, ...value] = line.split(":");
      output.meta[key.slice(3).trim().toLocaleLowerCase()] = value
        .join(":")
        .trim();
    } else if (line.startsWith("<global>")) {
      current = output.global;
      if (control) Object.assign(current, control);
      control = undefined;
    } else if (line.startsWith("<control>")) {
      control = {};
      current = control;
    } else if (line.startsWith("<group>")) {
      if (group) {
        output.groups.push(group);
        if (control) Object.assign(group, control);
        control = undefined;
      }
      group = {
        regions: [],
      };
      if (control && current === control) {
        group.control = control;
        control = undefined;
      }
      current = group;
    } else if (line.startsWith("<region>")) {
      if (region) {
        group.regions.push(region);
        if (control) Object.assign(group, control);
        control = undefined;
      }
      region = {};
      current = region;
    } else if (line.indexOf("=") !== -1) {
      if (current) {
        const items = line.split(" ");
        items.forEach((item) => {
          addItem(current, item, num + 1, line);
        });
      } else {
        console.log("no current! for props", num + 1, line);
      }
    } else if (line) {
      console.log(`Ignore "${line}"`);
    }
  });

  if (group) {
    output.groups.push(group);
  }

  return output;
}

function addItem(current, item, lineNum, line) {
  let [key, value] = item.split("=");
  if (key && value) {
    key = key.trim();
    if (key === "sample") {
      current.sample = value.trim();
    } else if (key === "default_path") {
      current["default_path"] = value.trim().replace(/\\/g, "/");
    } else {
      value = value.trim();
      const num = parseInt(value, 10);
      current[key] = isNaN(num) ? value : num;
    }
  } else {
    const secondTry = line.split("=");
    if (secondTry.length === 2) {
      current[secondTry[0].trim()] = secondTry[1].trim();
    } else {
      console.log("INVALID KEY VALUE", lineNum, item);
    }
  }
}

function processMacros(lines, loadSfz) {
  const variables = {};

  const result = [];

  lines.forEach((line) => {
    if (line.startsWith("#define")) {
      const data = line.slice(line.indexOf("$"));
      const varName = data.slice(0, data.indexOf(" "));
      const value = data.slice(varName.length);
      console.log("#DEFINE ", varName, value);
      variables[varName.trim()] = value.trim();
      return;
    } else if (line.startsWith("#include")) {
      const fileName = line.slice(line.indexOf('"')).replaceAll(/"/g, "");
      const lines = processMacros(prepareLines(loadSfz(fileName)), loadSfz);
      lines.forEach((line) => result.push(line));
      return;
    }

    if (line.indexOf("$")) {
      let modified = line;
      Object.keys(variables).forEach((varName) => {
        modified = modified.replace(varName, variables[varName]);
      });
      result.push(modified);
    } else {
      result.push(line);
    }
  });
  return result;
}

function prepareLines(sfz) {
  return sfz
    .toString()
    .replace(/>/g, ">\n")
    .split("\n")
    .map((line) => line.trim());
}
