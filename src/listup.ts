import { join } from "path";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import PromptSync from "prompt-sync";
import pino from "pino";
import lib from "./lib";

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

const dataInDir = "../Dataset2d-restructured"; // level is 1

const lsData = {
    path: dataInDir,
    currDir: dataInDir,
    targetFolderLv: 7,
};

const init = async () => {
    const logDir = join(__dirname, "..", "log");
    if (!existsSync(logDir)) {
        mkdirSync(logDir);
        logger.info(`${logDir} created`);
    }
};

const listup = async () => {
    const data = await lib.lsTargetLv(lsData);

    data.forEach((oldFile) => {
        const fileInfo = oldFile.split("/");
        const fileInfoScene = fileInfo[5].split("_");
        const fileInfoData = fileInfo[7].split(".");
        const setType =
            fileInfoScene[2] == "Training" ? "Train" : fileInfoScene[2];
        const environment = fileInfo[3];
        const place = fileInfoScene[0].substring(2);
        const sceneNo = fileInfoScene[1];
        const fileNo = fileInfoData[0];
        const fileType = fileInfoData[1];

        let dataType = "원천데이터";
        if (fileType === "json") {
            dataType = "라벨링데이터";
        } else if (fileType === "jpg" || fileType === "pcd") {
            dataType = "원천데이터";
        } else {
            console.log("Error");
            while (true) {
                const answer = prompt("Press y to finish...\n");
                if (answer === "y") break;
            }
            process.exit(1);
        }

        const newFileName = `${environment}_${place}_${sceneNo}_${fileNo}.${fileType}`;
        const newFile = join(setType, dataType, newFileName);

        logger.info(`${oldFile} or ${newFile}`);
    });
};

const run = async () => {
    await init();
    await listup();
    console.log("Finished");
};

run();
