import { join } from "path";
import {
    rmSync,
    rmdirSync,
    existsSync,
    renameSync,
    mkdirSync,
    readdirSync,
    unlinkSync,
    createWriteStream,
} from "fs";
import PromptSync from "prompt-sync";
import pino from "pino";
import lib from "./lib";

const prompt = PromptSync({ sigint: true });

const streams = [
    // { stream: process.stdout },
    {
        stream: createWriteStream(
            join("log", `3d-selector_${Date.now()}.log`),
            {
                flags: "a",
            }
        ),
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

const rootDir = "../Dataset"; // rootDir level is 1
const delimiter = "데이터_";
const lidarFolderName = "LiDAR";

const lsData = {
    path: rootDir,
    currDir: rootDir,
    targetFolderLv: 8,
};

const lsLidars = {
    path: rootDir,
    currDir: rootDir,
    targetFolderLv: 7,
    targetFolder: lidarFolderName,
};

const lsScenes = {
    path: rootDir,
    currDir: rootDir,
    targetFolderLv: 6,
};

const lsSplit = {
    path: rootDir,
    currDir: rootDir,
    targetFolderLv: 3,
};

const lsTopLv = {
    path: rootDir,
    currDir: rootDir,
    targetFolderLv: 2,
};

const filterLidarScenes = (lidars: string[], scenes: string[]) => {
    const commonDirsAll = lib.trimDirNames(scenes, delimiter);
    const commonDirsLidars = lib.trimDirNames(
        lidars,
        delimiter,
        `/${lidarFolderName}`
    );

    const commonDirsImgOnly = lib.filterCommonDirsImgOnly(
        commonDirsAll,
        commonDirsLidars
    );

    scenes.forEach((scene) => {
        commonDirsImgOnly.forEach((sceneImgOnly) => {
            if (scene.includes(sceneImgOnly)) {
                if (!dev) {
                    rmSync(scene, { recursive: true });
                    logger.info(`${scene} is deleted`);
                }
                console.log(`${scene} is deleted`);
            }
        });
    });
};

const makeFullDirs = (rootDir: string, no: number, cmDir: string) => {
    const fullDirsTmp: string[] = [];
    fullDirsTmp.push(
        join(rootDir, "1_원천데이터", `${no}_원천데이터_${cmDir}`, "Camera")
    );
    fullDirsTmp.push(
        join(rootDir, "1_원천데이터", `${no}_원천데이터_${cmDir}`, "LiDAR")
    );
    fullDirsTmp.push(
        join(rootDir, "2_라벨링데이터", `${no}_라벨링데이터_${cmDir}`, "label")
    );
    return fullDirsTmp;
};

const listUpScenes = (commonDirsAll: string[]) => {
    return commonDirsAll.map((cmDir) => {
        if (cmDir.includes("Training")) {
            return makeFullDirs(rootDir, 1, cmDir);
        } else if (cmDir.includes("Validation")) {
            return makeFullDirs(rootDir, 2, cmDir);
        } else if (cmDir.includes("Test")) {
            return makeFullDirs(rootDir, 3, cmDir);
        } else {
            console.log("Error");
            while (true) {
                const answer = prompt("Press y to finish...\n");
                if (answer === "y") break;
            }
            process.exit(1);
        }
    });
};

const genDiffFiles = (scenesList: string[][]) => {
    return scenesList.map((scene) => {
        const cams = readdirSync(scene[0]).map((f) =>
            f.replace(/\.[^/.]+$/, "")
        );
        const labels = readdirSync(scene[2]).map((f) =>
            f.replace(/\.[^/.]+$/, "")
        );

        const diffLabels = labels
            .filter((name) => !cams.includes(name))
            .concat(cams.filter((name) => !labels.includes(name)));

        const diffPath: string[] = [];

        diffLabels.forEach((file) => {
            const cam = join(scene[0], `${file}.jpg`);
            const lidar = join(scene[1], `${file}.pcd`);
            const label = join(scene[2], `${file}.json`);
            diffPath.push(cam, lidar, label);
        });

        if (existsSync(scene[1])) {
            const lidars = readdirSync(scene[1]).map((f) =>
                f.replace(/\.[^/.]+$/, "")
            );

            const diffCams = cams
                .filter((name) => !lidars.includes(name))
                .concat(lidars.filter((name) => !cams.includes(name)));

            diffCams.forEach((file) => {
                const cam = join(scene[0], `${file}.jpg`);
                if (diffPath.indexOf(cam) === -1) {
                    const lidar = join(scene[1], `${file}.pcd`);
                    const label = join(scene[2], `${file}.json`);
                    diffPath.push(cam, lidar, label);
                }
            });
        }

        return diffPath;
    });
};

const filterDiffFiles = (scenes: string[]) => {
    const commonDirsAll = lib.trimDirNames(scenes, delimiter);

    const scenesList = listUpScenes(commonDirsAll);

    const diffFiles = genDiffFiles(scenesList);

    diffFiles.forEach((scene) => {
        scene.forEach((path: any) => {
            if (existsSync(path)) {
                if (!dev) {
                    unlinkSync(path);
                    logger.info(`${path} is removed`);
                }
                console.log(`${path} is removed`);
            }
        });
    });
};

const restructureData = (dataSplitted: string[]) => {
    dataSplitted.forEach((data) => {
        const moved = data
            .replace("1_원천데이터/", "")
            .replace("2_라벨링데이터/", "");
        if (!dev) {
            renameSync(data, moved);
            logger.info(`${data} is moved to ${moved}`);
        }
        console.log(`${data} is moved to ${moved}`);
    });
};

const init = async () => {
    const logDir = join(__dirname, "..", "log");
    if (!existsSync(logDir)) mkdirSync(logDir);
    const allFiles = await lib.lsTargetLv(lsData);
    if (allFiles.length <= 0) {
        console.log("Dataset path is invalid");
        process.exit(1);
    } else {
        if (!dev) logger.info(allFiles);
    }
};

const runDataFilter = async (scenes: string[]) => {
    filterDiffFiles(scenes);
};

const runSceneFilter = async (scenes: string[]) => {
    const lidars = await lib.lsTargetLv(lsLidars);
    filterLidarScenes(lidars, scenes);
};

const runRestructure = async () => {
    const dataSplitted = await lib.lsTargetLv(lsSplit);
    restructureData(dataSplitted);

    const topLvFolders = (await lib.lsTargetLv(lsTopLv)).sort(
        (a, b) => a.length - b.length
    );
    if (!dev) {
        rmdirSync(topLvFolders[0]);
        rmdirSync(topLvFolders[1]);
        logger.info(`${topLvFolders[0]} and ${topLvFolders[1]} are removed `);
    }
    console.log(`${topLvFolders[0]} and ${topLvFolders[1]} are removed `);
};

const run = async () => {
    await init();

    const filterOnly = false;

    const scenes = await lib.lsTargetLv(lsScenes);
    await runDataFilter(scenes);
    logger.info("[Diff data removed]");
    console.log("[Diff data removed]");

    if (!filterOnly) {
        await runSceneFilter(scenes);
        logger.info("[2D only scenes removed]");
        console.log("[2D only scenes removed]");

        await runRestructure();
        logger.info("[Dataset restructured]");
        console.log("[Dataset restructured]");
    }
};

run();
