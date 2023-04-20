module.exports = function (w) {
  process.env.NO_WATCHMAN = true;

  return {
    runMode: "onsave",

    longExecutingWarningTimeout: 500,

    compilers: {
      "**/*.ts?(x)": w.compilers.typeScript({
        // This might make startup faster?
        isolatedModules: true,
      }),
    },

    env: {
      type: "node",
      runner: "/Users/peeja/.nvm/versions/node/v18.15.0/bin/node",
      params: {
        runner: "--experimental-vm-modules",
      },
    },
  };
};
