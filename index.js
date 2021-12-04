import { Octokit } from "@octokit/rest";
import fs from "fs";
import tar from "tar";
import fetch from "node-fetch";

const octokit = new Octokit();

async function START() {
  let pulledRepositoriesCount = 0;

  // 1. Unpack config
  const configFilePath = process.argv[2];

  /**
   * @typedef {{name: string; branch: string; lastPulled: string;}} configRepo
   */

  /**
   * @typedef {{owner: string; repositories: configRepo[]; outputDir: string;}} config;
   */

  /**
   * @type {config}
   */
  const config = JSON.parse(
    fs.readFileSync(configFilePath, { encoding: "utf8" })
  );

  // 2. Fetch all repositories and write them to disk
  const repositories = await fetchRepositories(config.repositories);

  for (const { name, lastPulled, lastModified, archiveUrl } of repositories) {
    if (!lastPulled || new Date(lastPulled) < new Date(lastModified)) {
      const outputPath = `${config.outputDir}/${name}`;

      try {
        fs.mkdirSync(outputPath, { recursive: true });
      } catch (e) {
        if (e.code === "EEXIST") {
          console.log("Directory already exists, using existing");

          return;
        }

        throw e;
      }

      //can this be promise.All'd?
      const { body } = await fetch(archiveUrl, {
        method: "GET",
      });

      body.pipe(
        tar.x({
          C: outputPath,
          strip: 1,
        })
      );

      // 3. Update the lastPulled value of the repository at config.repositories so we don't fetch this repo again if it hasn't been modified
      const today = new Date().toISOString();

      config.repositories[
        config.repositories.findIndex((r) => r.name === name)
      ].lastPulled = today.substr(0, today.indexOf("T"));

      pulledRepositoriesCount++;
    }
  }

  // 4. Overwrite the config file with the potentially updated config
  fs.writeFileSync(configFilePath, JSON.stringify(config));

  console.log(
    `Pulled ${pulledRepositoriesCount} Repositories owned by ${config.owner}`
  );

  /**
   * @typedef {{
   *  name: string;
   *  lastPulled: string | null;
   *  lastModified: string;
   *  archiveUrl: string;
   * }[]} repos
   */

  /**
   *
   * @param {configRepo[]} repos
   *
   * @returns {Promise<repos>}
   */
  async function fetchRepositories(repos) {
    const response = await Promise.all(
      repos.map(({ name, branch }) => {
        return octokit.rest.repos.get({
          owner: config.owner,
          repo: name,
          ref: branch,
        });
      })
    );

    return response.map((r, index) => {
      const repo = repos[index];

      const archiveUrl = r.data["archive_url"]
        .replace("{archive_format}", "tarball/")
        .replace("{/ref}", repo.branch);

      const lastModifiedISOString = new Date(
        r.headers["last-modified"]
      ).toISOString();

      const lastModified = lastModifiedISOString.substr(
        0,
        lastModifiedISOString.indexOf("T")
      );

      return {
        ...repo,
        lastModified,
        archiveUrl,
      };
    });
  }
}

START();
