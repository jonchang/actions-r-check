import fs from "fs";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";

async function get_package_components() {
  const desc = fs.readFileSync("DESCRIPTION").toString();
  const re_version = /^Version:\s(\S+)/m;
  const re_package = /^Package:\s*(\S+)/m;

  const pkg_match = re_package.exec(desc);
  const ver_match = re_version.exec(desc);

  if (!pkg_match || !ver_match) {
    core.setFailed("Could not parse DESCRIPTION");
  }

  return [pkg_match![1], ver_match![1]];
}

async function run() {
  const [pkg, version] = await get_package_components();

  const install_deps = `
  install.packages("remotes")
  deps <- remotes::dev_package_deps(dependencies = NA);
  remotes::install_deps(dependencies = TRUE);
  if (!all(deps$package %in% installed.packages())) {
    message("missing: ", paste(setdiff(deps$package, installed.packages()), collapse=", "));
    q(status = 1, save = "no")
  }
  `;

  core.startGroup("Install package dependencies");
  try {
    await exec.exec("Rscript", ["-e", install_deps]);
  } catch (ee) {
    core.setFailed("Could not install dependencies: " + ee);
  }
  core.endGroup();

  try {
    await exec.exec("R", ["CMD", "build", "."]);
  } catch (ee) {
    core.setFailed("Could not build package: " + ee);
  }

  const tarball = `${pkg}_${version}.tar.gz`;
  core.setOutput('tarball', tarball);
  core.exportVariable('PKG_TARBALL', tarball);

  try {
    await exec.exec("R", ["CMD", "check", "--as-cran", "--no-manual", tarball]);
  } catch (ee) {
    core.setFailed("R check failed: " + ee);
  }
}


run();
