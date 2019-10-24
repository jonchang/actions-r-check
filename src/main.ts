import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";


async function install(version: string = "latest") {
  if (process.platform == "darwin") {
    install_mac(version);
  } else if (process.platform == "linux") {
    install_linux(version);
  } else if (process.platform == "win32") {
    core.setFailed("Windows not supported yet");
    install_windows(version);
  } else {
    core.setFailed("Unsupported platform");
  }
}

async function install_windows(version: string) {
  let fn = "R-" + version + "-win.exe";
  let url = "https://cloud.r-project.org/bin/windows/base/" + fn;

  let download: string = "";
  try {
    download = await tc.downloadTool(url);
  } catch (ee) {
    core.setFailed("Could not download R: " + ee);
  }

  io.mv(download, fn);
  // exec.exec something here? what are arguments?
  core.setFailed("Windows not supported yet");
}

async function install_linux(version: string) {
  let verstr = "";
  if (version != "latest") {
    verstr = "=" + version + "*";
  }

  try {
    await exec.exec("sudo", ["bash", "-c", "source /etc/os-release; echo deb https://cloud.r-project.org/bin/linux/ubuntu ${UBUNTU_CODENAME}-cran35/ >> /etc/apt/sources.list.d/r.list"]);
    await exec.exec("sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9");
    await exec.exec("sudo apt-get update");
    await exec.exec("sudo", ["apt-get", "install", "-y", "r-base-dev" + verstr]);
  } catch (ee) {
    core.setFailed("Could not install R: " + ee);
  }
}


async function install_mac(version: string) {
  let fn = "R-" + version + ".pkg";
  let url = "https://cloud.r-project.org/bin/macosx/" + fn;

  let download: string = "";
  try {
    download = await tc.downloadTool(url);
  } catch (ee) {
    core.setFailed("Could not download R: " + ee);
  }

  io.mv(download, fn);

  try {
    await exec.exec("sudo", [
      "/usr/sbin/installer",
      "-pkg",
      fn,
      "-target",
      "/"
    ]);
  } catch (ee) {
    core.setFailed("Could not install R: " + ee);
  }

  io.rmRF(fn);

  await tc.cacheDir("/Library/Frameworks/R.framework", "R", version);
  core.addPath("/usr/local/bin");
}

async function run() {
  try {
    let version = core.getInput("r_version");
    await install(version);
  } catch (error) {
    core.setFailed(error.message);
  }
}


run();
