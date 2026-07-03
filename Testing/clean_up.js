import fs from "fs"


async function deleteDirectory(dir) {
    try {
        let stats = await fs.promises.stat(dir);

        if (!stats.isDirectory) {
            console.log("Wrong path");
            return;
        }

        await fs.promises.rm(dir, { recursive: true, force: true });

        console.log("Directory deleted successfuly");

    } catch (err) {
        if (err.code == 'ENOENT')
            console.log("Directory doesn't exist");
        else
            console.log("Error: ", err);
    }
}


await deleteDirectory("Server/FileSystem");
