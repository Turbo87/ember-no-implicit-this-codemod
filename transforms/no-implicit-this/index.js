const path = require('path');
const fs = require('fs');

const { parse: parseHbs, print: printHbs } = require('ember-template-recast');
const { determineThisUsage } = require('./helpers/determine-this-usage');
const { getOptions: getCLIOptions } = require('codemod-cli');
const DEFAULT_OPTIONS = {
  dontAssumeThis: false,
};

/**
 * Accepts the config path for custom helpers and returns the array of helpers
 * if the file path is resolved.
 * Context: This will allow the users to specify their custom list of helpers
 * along with the known helpers, this would give them more flexibility for handling
 * special usecases.
 * @param {string} configPath
 */
function _getCustomHelpersFromConfig(configPath) {
  let customHelpers = [];
  if (configPath) {
    let filePath = path.join(process.cwd(), configPath);
    let config = JSON.parse(fs.readFileSync(filePath));
    if (config.helpers) {
      customHelpers = config.helpers;
    }
  }
  return customHelpers;
}

/**
 * Returns custom options object to support the custom helpers config path passed
 * by the user.
 */
function getOptions() {
  let cliOptions = getCLIOptions();
  let options = {
    dontAssumeThis: cliOptions.dontAssumeThis,
    customHelpers: _getCustomHelpersFromConfig(cliOptions.config),
  };
  return options;
}

module.exports = function transformer(file /*, api */) {
  let extension = path.extname(file.path);
  let options = Object.assign({}, DEFAULT_OPTIONS, getOptions());

  if (!['.hbs'].includes(extension.toLowerCase())) {
    // do nothing on non-hbs files
    return;
  }

  let root = parseHbs(file.source);

  let replaced = determineThisUsage(root, file, options);

  if (replaced) {
    return printHbs(replaced);
  }

  return file.source;
};
