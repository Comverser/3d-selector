import { join } from "path";
import { copyFileSync, existsSync, mkdirSync, createWriteStream } from "fs";
import PromptSync from "prompt-sync";
import pino from "pino";
import lib from "../lib";

const prompt = PromptSync({ sigint: true });

const streams = [
    // { stream: process.stdout },
    {
        stream: createWriteStream(join("log", `restruct-${Date.now()}.log`), {
            flags: "a",
        }),
    },
];
const logger = pino(
    {
        prettyPrint: {
            translateTime: "yyyy-mm-dd, hh:mm:ss",
            ignore: "hostname,pid",
        },
    },
    pino.multistream(streams)
);

const dev = false;

const dataInDir = "../Dataset"; // level is 1
const dataOutFolder = "restruct";

const lsData = {
    path: dataInDir,
    currDir: dataInDir,
    targetFolderLv: 1,
};

const init = async () => {
    const logDir = join(__dirname, "..", "log");

    if (!existsSync(logDir)) {
        mkdirSync(logDir);
        logger.info(`${logDir} created`);
    }
};

const run = async () => {
    await init();
    console.log("Finished");
};

run();
