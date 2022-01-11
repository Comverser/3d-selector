import { readdir } from "fs/promises";
import { join } from "path";
import { writeFile, rm } from "fs";

const rootDir = "./input_";

async function* lsLidar(
    path = rootDir,
    currDir = rootDir,
    currLv = 0,
    maxLv = 6
): any {
    currLv++;
    if (currLv === maxLv && currDir === "LiDAR") yield path;
    else if (currLv > maxLv) return;

    for (const dirent of await readdir(path, { withFileTypes: true })) {
        if (dirent.isDirectory()) {
            yield* lsLidar(join(path, dirent.name), dirent.name, currLv);
        }
    }
}

async function* lsAll(path = rootDir, currLv = 0, maxLv = 5): any {
    currLv++;
    if (currLv === maxLv) yield path;
    else if (currLv > maxLv) return;

    for (const dirent of await readdir(path, { withFileTypes: true })) {
        if (dirent.isDirectory()) {
            yield* lsAll(join(path, dirent.name), currLv);
        }
    }
}

const toArray = async (iter: any) => {
    let r = [];
    for await (const x of iter) r.push(x);
    return r;
};

const dirs3d = toArray(lsLidar()).then((dirs) => {
    return dirs.map((dir) => {
        if (dir.includes("1_원천데이터/")) {
            const pre = "1_원천데이터/";
            const end = "/LiDAR";
            const subStr = dir.substr(dir.indexOf(pre) + pre.length);
            const subSubStr = subStr.substr(0, subStr.lastIndexOf(end));
            return subSubStr;
        }
    });
});

const dirsAll = toArray(lsAll()).then((dirs) => {
    return dirs.map((dir) => {
        if (dir.includes("1_원천데이터/")) {
            const pre = "1_원천데이터/";
            const subStr = dir.substr(dir.indexOf(pre) + pre.length);
            return subStr;
        }
    });
});

const dirsAllFull = toArray(lsAll()).then((dirs) => dirs);

const rmdirTargets = dirsAll.then(async (all) => {
    const dirs3dArr = await dirs3d;
    return all.filter((dir) => dirs3dArr.indexOf(dir) == -1);
});

dirsAllFull.then(async (dirsAll) => {
    const rmdirTargetArr = await rmdirTargets;
    dirsAll.forEach((path) => {
        rmdirTargetArr.forEach((dir) => {
            if (path.includes(dir)) {
                rm(path, { recursive: true }, (err) => {
                    if (err) throw err;
                });
                console.log(`${path} is deleted`);
            }
        });
    });
});
