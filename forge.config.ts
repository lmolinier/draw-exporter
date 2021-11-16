import Plugin from "@electron-forge/plugin-base";
import { spawn, SpawnOptions } from 'child_process';

import { ElectronProcess, StartOptions } from '@electron-forge/shared-types'
import locateElectronExecutable from "@electron-forge/core/dist/util/electron-executable"
import { readMutatedPackageJson } from "@electron-forge/core/dist/util/read-package-json"
import { runHook } from "@electron-forge/core/dist/util/hook";
import { asyncOra } from '@electron-forge/async-ora';
import getForceConfig from "@electron-forge/core/dist/util/forge-config";


class XvFbPlugin extends Plugin<any> {
  name = "xvfb";
  async startLogic(_startOpts: StartOptions): Promise<ElectronProcess | string | string[] | false> {
    if(process.env.DISPLAY === undefined) {
      process.env.DISPLAY = ":99"
    }
    return XvFbPlugin.defaultStart(_startOpts);
  }

  static async defaultStart(_startOpts: StartOptions): Promise<ElectronProcess> {
    const forgeConfig = await getForceConfig(_startOpts.dir);
    const packageJSON = await readMutatedPackageJson(_startOpts.dir, forgeConfig);
    const electronExecPath = await locateElectronExecutable(_startOpts.dir, packageJSON);
    let args = _startOpts.args;

    const spawnOpts = {
      cwd: _startOpts.dir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(_startOpts.enableLogging
          ? {
              ELECTRON_ENABLE_LOGGING: 'true',
              ELECTRON_ENABLE_STACK_DUMPING: 'true',
            }
          : {}),
      } as NodeJS.ProcessEnv,
    };

    if (_startOpts.runAsNode) {
      spawnOpts.env.ELECTRON_RUN_AS_NODE = 'true';
    } else {
      delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
    }

    if (_startOpts.inspect) {
      args = ['--inspect' as string | number].concat(args);
    }

    let spawned!: ElectronProcess;
    await asyncOra('Launching Application', async () => {
      // Check if we are running on GNU/Linux, must prefer run in the xvfb
      const platform = process.env.npm_config_platform || process.platform;
      if(platform == "linux") {
        spawned = spawn(
          "xvfb-run",
          ["--auto-servernum", electronExecPath!, _startOpts.appPath].concat(args as string[]), // eslint-disable-line @typescript-eslint/no-non-null-assertion
          spawnOpts as SpawnOptions
        ) as ElectronProcess;
        return
      }

      // Normal spawn...
      spawned = spawn(
        electronExecPath!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        [_startOpts.appPath].concat(args as string[]),
        spawnOpts as SpawnOptions
      ) as ElectronProcess;
    });

    await runHook(forgeConfig, 'postStart', spawned);
    return spawned;
  }

}

module.exports = {
  makers: [
    {
        name: "@electron-forge/maker-squirrel",
        config: {
            "name": "draw_exporter"
        }
    },
    {
       name: "@electron-forge/maker-zip"
    },
    {
       name: "@electron-forge/maker-deb",
    },
    {
       name: "@electron-forge/maker-dmg",
       config: {
            "format": "ULFO"
        }
    }  
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        "repository": {
            "owner": "lmolinier",
            "name": "draw-exporter"
        },
        "prerelease": true
      }
    }
  ],
  plugins: [ new XvFbPlugin("") ]
}