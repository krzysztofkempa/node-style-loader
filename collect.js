let allSelectorsWithStyles = [];
let commonStyles = '';
let classToSelectorMapping = null;

exports.add = add;

exports.getMatchingStyles = function (HTML) {
  exports.add = inactiveAdd;
  return matchStyles(HTML);
};

function inactiveAdd() {}

function add(list) {
  addStylesToStack(list);
}

function addStylesToStack(list) {
  const styles = listToStyles(list);
  allSelectorsWithStyles = [...allSelectorsWithStyles, ...styles];
}

function generateMapping() {
  classToSelectorMapping = allSelectorsWithStyles.reduce((mapping, item, index) => {
    const classes = item.match(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g);

    if (classes) {
      classes.map(c => c.slice(1)).forEach(function (cssClass) {
        const currentMap = mapping[cssClass];
        if (currentMap) {
          currentMap.push(index);
        } else {
          mapping[cssClass] = [index];
        }
      });
    } else {
      commonStyles += item;
    }

    return mapping
  }, {});
}

function matchStyles(HTML) {
  if (!classToSelectorMapping) {
    generateMapping();
  }

  const regex = /class=\"(.*?)\"/g;
  const existingClasses = HTML.match(regex).reduce((acc, el) => {
    const classesString = el.split('"')[1];
    const classes = classesString && classesString.split(' ');
    if (classes) {
      return [...acc, ...classes];
    }
    return acc;
  }, []);

  const mapping = existingClasses.reduce((acc, classname) => {
    const map = classToSelectorMapping[classname];
    map && map.forEach(key => acc[key] = 1);
    return acc;
  }, {});

  const indexes = Object.keys(mapping).sort();
  const styles = commonStyles + indexes.reduce((css, index) => css + allSelectorsWithStyles[index], '');

  return `<style class="server-style-loader-element">${styles}</style>`;
}

function listToStyles(list) {
  let styles = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = item[0];
    var css = item[1];
    if (css) {
      const selectorsWithStyles = extract(css);
      styles = [...styles, ...selectorsWithStyles];
    }
  }

  return styles;
}

function extract(css) {
  const result = [];
  let currentStyle = '';
  let openedBracketsCount = 0;
  for (let c of css) {
    currentStyle += c;
    switch (c) {
      case '{':
        openedBracketsCount++;
        break;
      case '}':
        openedBracketsCount--;
        if (openedBracketsCount <= 0) {
          result.push(currentStyle);
          currentStyle = ''
        }
        break;
    }
  }
  return result;
}
