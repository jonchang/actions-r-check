"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
function install(version = "latest") {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform == "darwin") {
            install_mac(version);
        }
        else if (process.platform == "linux") {
            install_linux(version);
        }
        else if (process.platform == "win32") {
            core.setFailed("Windows not supported yet");
            install_windows(version);
        }
        else {
            core.setFailed("Unsupported platform");
        }
    });
}
function install_windows(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let fn = "R-" + version + "-win.exe";
        let url = "https://cloud.r-project.org/bin/windows/base/" + fn;
        let download = "";
        try {
            download = yield tc.downloadTool(url);
        }
        catch (ee) {
            core.setFailed("Could not download R: " + ee);
        }
        io.mv(download, fn);
        // exec.exec something here? what are arguments?
        core.setFailed("Windows not supported yet");
    });
}
function install_linux(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let verstr = "";
        if (version != "latest") {
            verstr = "=" + version + "*";
        }
        try {
            yield exec.exec("sudo", ["bash", "-c", "source /etc/os-release; echo deb https://cloud.r-project.org/bin/linux/ubuntu ${UBUNTU_CODENAME}-cran35/ >> /etc/apt/sources.list.d/r.list"]);
            yield exec.exec("sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9");
            yield exec.exec("sudo apt-get update");
            yield exec.exec("sudo", ["apt-get", "install", "-y", "r-base-dev" + verstr]);
        }
        catch (ee) {
            core.setFailed("Could not install R: " + ee);
        }
    });
}
function install_mac(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let fn = "R-" + version + ".pkg";
        let url = "https://cloud.r-project.org/bin/macosx/" + fn;
        let download = "";
        try {
            download = yield tc.downloadTool(url);
        }
        catch (ee) {
            core.setFailed("Could not download R: " + ee);
        }
        io.mv(download, fn);
        try {
            yield exec.exec("sudo", [
                "/usr/sbin/installer",
                "-pkg",
                fn,
                "-target",
                "/"
            ]);
        }
        catch (ee) {
            core.setFailed("Could not install R: " + ee);
        }
        io.rmRF(fn);
        yield tc.cacheDir("/Library/Frameworks/R.framework", "R", version);
        core.addPath("/usr/local/bin");
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let version = core.getInput("r_version");
            yield install(version);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
