let allSelectorsWithStyles = [];
let commonStyles = '';
let classToSelectorMapping = null;
let parsedModules = [];

exports.add = add;

exports.getMatchingStyles = function (HTML) {
  return wrapStylesIntoTag(matchStyles(HTML));
};

exports.getAllStyles = function () {
  return wrapStylesIntoTag(allSelectorsWithStyles.reduce((acc, style) => acc + style, ''));
};

function wrapStylesIntoTag(styles) {
  return `<style class="server-style-loader-element">${styles}</style>`;
}

function inactiveAdd() {}

function add(list) {
  let hasNewModules = false;

  list.forEach(([ moduleId, stylesString ]) => {
    if (!parsedModules.includes(moduleId)) {
      parsedModules.push(moduleId);
      const styles = extract(stylesString);

      allSelectorsWithStyles = [...allSelectorsWithStyles, ...styles];
      hasNewModules = true;
    }
  });

  if (hasNewModules) {
    generateMapping();
  }
}

function generateMapping() {
  classToSelectorMapping = allSelectorsWithStyles.reduce((mapping, item, index) => {
    const [selector, style] = item.split('{');
    const [...selectors] = selector.split(',');
    const hasNonClassSelectors = selectors.some(selector => !selector.match(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g));

    if (hasNonClassSelectors) {
      commonStyles += item;
    } else {
      const classes = item.match(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g);

      classes.map(c => c.slice(1)).forEach(function (cssClass) {
        const currentMap = mapping[cssClass];
        if (currentMap) {
          currentMap.push(index);
        } else {
          mapping[cssClass] = [index];
        }
      });
    }

    return mapping
  }, {});
}

function matchStyles(HTML) {
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
