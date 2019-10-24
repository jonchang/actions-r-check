"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
function get_package_components() {
    return __awaiter(this, void 0, void 0, function* () {
        const desc = fs_1.default.readFileSync("DESCRIPTION").toString();
        const re_version = /^Version:\s(\S+)/m;
        const re_package = /^Package:\s*(\S+)/m;
        const pkg_match = re_package.exec(desc);
        const ver_match = re_version.exec(desc);
        if (!pkg_match || !ver_match) {
            core.setFailed("Could not parse DESCRIPTION");
        }
        return [pkg_match[1], ver_match[1]];
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const [pkg, version] = yield get_package_components();
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
            yield exec.exec("Rscript", ["-e", install_deps]);
        }
        catch (ee) {
            core.setFailed("Could not install dependencies: " + ee);
        }
        core.endGroup();
        try {
            yield exec.exec("R", ["CMD", "build", "."]);
        }
        catch (ee) {
            core.setFailed("Could not build package: " + ee);
        }
        const tarball = `${pkg}_${version}.tar.gz`;
        core.setOutput('tarball', tarball);
        core.exportVariable('PKG_TARBALL', tarball);
        try {
            yield exec.exec("R", ["CMD", "check", "--as-cran", "--no-manual", tarball]);
        }
        catch (ee) {
            core.setFailed("R check failed: " + ee);
        }
    });
}
run();
