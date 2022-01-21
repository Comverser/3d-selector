import { readdir } from "fs/promises";
import { readdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { rm } from "fs";

const dev = true;

const rootDir = "./Dataset"; // rootDir level is 1
const sceneLv = 6;
const lidarFolderName = "LiDAR";
const dataFolder = "1_원천데이터";
const labelFolder = "2_라벨링데이터";

const toArray = async (iter: string[]) => {
    let r = [];
    for await (const x of iter) r.push(x);
    return r;
};

async function* lsTargetLvFolders(
    targetFolderLv: number,
    targetFolder = "",
    path = rootDir,
    currDir = rootDir,
    currLv = 0
): any {
    currLv++;
    if (!targetFolder && currLv === targetFolderLv) yield path;
    if (currLv === targetFolderLv && currDir === targetFolder) yield path;
    else if (currLv > targetFolderLv) return;

    for (const dirent of await readdir(path, { withFileTypes: true })) {
        if (dirent.isDirectory()) {
            yield* lsTargetLvFolders(
                targetFolderLv,
                targetFolder,
                join(path, dirent.name),
                dirent.name,
                currLv
            );
        }
    }
}

const trimDirNames = (
    dirs: string[],
    prefix: string,
    suffix = ""
): string[] => {
    return dirs.map((dir: string) => {
        const prefix_ = `${prefix}/`;
        if (dir.includes(prefix_)) {
            let subStr = dir.substring(dir.indexOf(prefix_) + prefix_.length);
            if (suffix) {
                const suffix_ = `/${suffix}`;
                subStr = subStr.substring(0, subStr.lastIndexOf(suffix_));
            }
            return subStr;
        }
        return "";
    });
};

const filterCommonDirsImgOnly = (
    commonDirs: string[],
    commonDirsLidar: string[]
): string[] => {
    return commonDirs.filter(
        (commonDir) => commonDirsLidar.indexOf(commonDir) == -1
    );
};

const filterLidarScenes = (
    lidars: string[],
    scenes: string[],
    commonDirsAll: string[]
) => {
    const commonDirsLidars = trimDirNames(lidars, dataFolder, lidarFolderName);

    const commonDirsImgOnly = filterCommonDirsImgOnly(
        commonDirsAll,
        commonDirsLidars
    );

    scenes.forEach((scene) => {
        commonDirsImgOnly.forEach((sceneImgOnly) => {
            if (scene.includes(sceneImgOnly)) {
                if (!dev) {
                    rm(scene, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                }
                console.log(`${scene} is deleted`);
            }
        });
    });
};

const filterLidarPcds = (commonDirsAll: string[]) => {
    const dirTargets = commonDirsAll.map((dir) => {
        const targets = [];
        targets.push(join(rootDir, "1_원천데이터", dir, "Camera"));
        targets.push(join(rootDir, "1_원천데이터", dir, "LiDAR"));
        targets.push(join(rootDir, "2_라벨링데이터", dir, "label"));
        return targets;
    });

    const rmTargets = dirTargets.map((scene, idx) => {
        const cams = readdirSync(scene[0]).map((f) =>
            f.replace(/\.[^/.]+$/, "")
        );
        const lidars = readdirSync(scene[1]).map((f) =>
            f.replace(/\.[^/.]+$/, "")
        );
        const labels = readdirSync(scene[2]).map((f) =>
            f.replace(/\.[^/.]+$/, "")
        );
        const diff = cams
            .filter((name) => !lidars.includes(name))
            .concat(lidars.filter((name) => !cams.includes(name)));

        const diffPath: any = [];

        diff.forEach((file) => {
            const cam = join(scene[0], `${file}.jpg`);
            const lidar = join(scene[1], `${file}.pcd`);
            const label = join(scene[2], `${file}.json`);
            diffPath.push(cam, lidar, label);
        });

        return diffPath;
    });

    rmTargets.forEach((scene) => {
        scene.forEach((path: any) => {
            if (existsSync(path)) {
                if (!dev) {
                    unlinkSync(path);
                }
                console.log(`${path} is removed`);
            }
        });
    });
};

const run = async () => {
    const lidars = await toArray(lsTargetLvFolders(sceneLv, lidarFolderName));
    const scenes = await toArray(lsTargetLvFolders(sceneLv - 1));
    const commonDirsAll = trimDirNames(scenes, dataFolder);

    filterLidarScenes(lidars, scenes, commonDirsAll);
    // filterLidarPcds(commonDirsAll);
};

run();
