# Github Repo Fetcher

Downloads a list of github repositories (defined in a config.json file) and unpacks their tarball file into a defined output directory.

## How to use

First create a config JSON file, this can be named anything:

  ```json
  {
    "owner": "pjaerr",
    "repositories": [
      {
        "name": "Svelte-Data-Vis-Premier-League",
        "branch": "gh-pages"
      },
      {
        "name": "Pub-Name-Generator",
        "branch": "master"
      }
    ],
    "outputDir": "dist"
  }
  ```

  `owner` - The github username that owns the repositories

  `repositories` - An array of objects, each object must have a `name` (the github repository name) and a `branch` (the branch you want to download)

  `outputDir` - The place all the repositories will be unpacked to, this is relative to where the script is ran. So in that example above we would have `./dist/Svelte-Data-Vis-Premier-League` and `./dist/Pub-Name-Generator` written to the disk.

This will eventually be an npm package but for now you can take the `index.js` file and run it with node: `node index <CONFIG_FILE_PATH>`

## Why
I wanted to pull all of my static site projects into the final build folder of my personal site without needing to make them a joint repository, this allows me to do that and makes sure I'm only fetching them if they've changed.
