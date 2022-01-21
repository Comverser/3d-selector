import { readdir } from "fs/promises";
import { readdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const rootDir = "./input";

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

const dirsAll = toArray(lsAll()).then((dirs) => {
    return dirs
        .map((dir) => {
            if (dir.includes("1_원천데이터/")) {
                const pre = "1_원천데이터/";
                const subStr = dir.substr(dir.indexOf(pre) + pre.length);
                return subStr;
            }
        })
        .filter((data) => data);
});

const filterData = async () => {
    const dirs = await dirsAll;

    const dirTargets = dirs.map((dir) => {
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
                unlinkSync(path);
                console.log(`${path} is removed`);
            }
        });
    });
};

filterData();
