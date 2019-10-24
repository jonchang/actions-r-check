import fs from "fs";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";

async function get_package_components() {
  let desc = fs.readFileSync("DESCRIPTION").toString();
  const re_version = /^Version:\s(\S+)/;
  const re_package = /^Package:\s*(\S+)/;

  let pkg_match = re_package.exec(desc);
  let ver_match = re_version.exec(desc);

  if (pkg_match && ver_match) {
    return [pkg_match[1], ver_match[1]];
  }

  core.setFailed("Could not parse DESCRIPTION");
}

async function run() {
  let pkg, version = get_package_components();

  let install_deps = `
  install.packages("remotes")
  deps <- remotes::dev_package_deps(dependencies = NA);
  remotes::install_deps(dependencies = TRUE);
  if (!all(deps$package %in% installed.packages())) {
    message("missing: ", paste(setdiff(deps$package, installed.packages()), collapse=", "));
    q(status = 1, save = "no")
  }
  `;

  try {
    await exec.exec("Rscript", ["-e", install_deps]);
  } catch (ee) {
    core.setFailed("Could not install dependencies: " + ee);
  }

  try {
    await exec.exec("R", ["CMD", "build", "."]);
  } catch (ee) {
    core.setFailed("Could not build package: " + ee);
  }

  let tarball = `${pkg}_${version}.tar.gz`;
  core.setOutput('tarball', tarball);
  core.exportVariable('PKG_TARBALL', tarball);

  try {
    await exec.exec("R", ["CMD", "check", "--as-cran", tarball]);
  } catch (ee) {
    core.setFailed("R check failed: " + ee);
  }
}


run();
