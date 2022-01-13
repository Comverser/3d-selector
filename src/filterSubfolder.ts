import { readdir } from "fs/promises";
import { join } from "path";
import { rm } from "fs";

const rootDir = "./input";

async function* lsAll(path = rootDir, currLv = 0, maxLv = 7): any {
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

const dirsAllFull = toArray(lsAll()).then((dirs) => dirs);

dirsAllFull.then((subfolders) => {
    if (subfolders) {
        console.log("Ok");
    }
    subfolders.forEach((subfolder) => {
        // rm(subfolder, { recursive: true }, (err) => {
        //     if (err) throw err;
        // });
        console.log(`${subfolder} is removed`);
    });
});
