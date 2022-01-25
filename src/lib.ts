import { readdir } from "fs/promises";
import { join } from "path";

const toArray = async (iter: string[]) => {
    let r = [];
    for await (const x of iter) r.push(x);
    return r;
};

async function* lsTargetLvGen(
    path: string,
    currDir: string,
    targetFolderLv: number,
    targetFolder = "",
    currLv = 0
): any {
    currLv++;
    if (currLv === targetFolderLv && !targetFolder) yield path;
    else if (currLv === targetFolderLv && currDir === targetFolder) yield path;

    if (currLv >= targetFolderLv) return;

    for (const dirent of await readdir(path, { withFileTypes: true })) {
        if (dirent.isDirectory()) {
            yield* lsTargetLvGen(
                join(path, dirent.name),
                dirent.name,
                targetFolderLv,
                targetFolder,
                currLv
            );
        } else if (currLv === targetFolderLv - 1 && !targetFolder) {
            yield join(path, dirent.name);
        }
    }
}

interface lsValues {
    path: string;
    currDir: string;
    targetFolderLv: number;
    targetFolder?: string;
    currLv?: number;
}

const lsTargetLv = async (lsParams: lsValues) => {
    return toArray(
        lsTargetLvGen(
            lsParams.path,
            lsParams.currDir,
            lsParams.targetFolderLv,
            lsParams.targetFolder,
            lsParams.currLv
        )
    );
};

const trimDirNames = (dirs: string[], prefix: string, suffix = ""): any[] => {
    return dirs
        .map((dir: string) => {
            if (dir.includes(prefix)) {
                let subStr = dir.substring(dir.indexOf(prefix) + prefix.length);
                if (suffix) {
                    subStr = subStr.substring(0, subStr.lastIndexOf(suffix));
                }
                return subStr;
            }
        })
        .filter(
            (dir: string | undefined, pos, self) => self.indexOf(dir) === pos
        );
};

const filterCommonDirsImgOnly = (
    commonDirs: string[],
    commonDirsLidar: string[]
): string[] => {
    return commonDirs.filter(
        (commonDir) => commonDirsLidar.indexOf(commonDir) == -1
    );
};

export default { lsTargetLv, trimDirNames, filterCommonDirsImgOnly };
