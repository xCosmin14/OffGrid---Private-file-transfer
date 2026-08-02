import { describe, it, expect, beforeAll, afterAll } from "vitest"
import fs, { fdatasync } from 'fs'
import { getResponse, extractCookie, checkDirectory, checkFile } from "./helpers.js";
import { spawn, execSync, exec } from "child_process";
import dotenv from 'dotenv';


let mail = `pookie${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `deea${crypto.randomUUID().slice(0, 8)}`;
let cookie;
let file_id, folder_id;

describe("File Tests", () => {

    beforeAll(async () => {

        let response = await getResponse('/register', 'POST', {
            email: mail,
            password: "idk",
            username: name
        });

        cookie = extractCookie(response.headers.get("set-cookie"));

    })

    it('should upload profile pictures', async () => {
        let buffer = fs.readFileSync("Testing/dummies/hamster_test.png");
        let blob = new Blob([buffer], { type: 'image/png' });

        let formData = new FormData();
        formData.append('photo', blob, "hamster_test.png");

        let response = await getResponse("/upload_photo", "POST", formData, cookie);
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "file uploaded successfuly", "file_id": "" });

    })

    it('should retrieve profile photos', async () => {
        let response = await getResponse(`/get_profile_photo`, 'GET', null, cookie);

        expect(response.status).toBe(200);

        let content = await response.arrayBuffer();
        let received = Buffer.from(content);
        let expected = fs.readFileSync("Testing/dummies/hamster_test.png");

        expect(received).toEqual(expected);


    })

    it('should upload regular files', async () => {
        let buffer = fs.readFileSync("Testing/dummies/regular_file.txt");
        let blob = new Blob([buffer], { type: 'text/plain' });

        let formData = new FormData();

        formData.append('photo', blob, "regular_file.txt");

        let response = await getResponse("/upload_file", "POST", formData, cookie);
        let data = await response.json();

        expect(data.status).toBe("success");
        expect(data.message).toBe("file uploaded successfuly");
        expect(data.file_id).toBeDefined();
        file_id = data.file_id;

        expect(checkFile("Server/FileSystem/files", "regular_file.txt")).toBeTruthy();
    })


    it('should retrieve a file', async () => {

        let response = await getResponse(`/get_file?file_id=${file_id}`, 'GET', null, cookie);

        expect(response.status).toBe(200);

        let content = await response.arrayBuffer();

        let received = Buffer.from(content);
        let expected = fs.readFileSync("Testing/dummies/regular_file.txt");

        expect(received).toEqual(expected);
    })


    it('should retrieve metadata of a file', async () => {

        let response = await getResponse(`/get_file_metadata?file_id=${file_id}`, "POST", {
            "fields": ["name", "size"]
        }, cookie);

        let json = await response.json();

        let expected = {
            status: 'success',
            message: 'file found',
            name: 'regular_file.txt',
            size: 1161
        }

        expect(json).toStrictEqual(expected);
    })


    it('should cancel folder upload', async () => {
        let response = await getResponse("/upload_folder", "POST", {
            'fields': ["folder_test/idk.txt", "folder_test/numai_bile.txt"]
        }, cookie);

        let json = await response.json();

        let buffer = fs.readFileSync("Testing/dummies/folder_test/idk.txt");
        let blob = new Blob([buffer], { type: 'text/plain' });

        let formData = new FormData();
        formData.append('file', blob, 'idk.txt');

        response = await getResponse(`/upload_file?transaction_id=${json.transaction_id}`, "POST", formData, cookie);

        response = await getResponse(`/cancel_upload?transaction_id=${json.transaction_id}`, "DELETE", null, cookie);

        json = await response.json();
        expect(json).toStrictEqual({ status: 'success', message: 'Upload cancelled successfuly' });
    })

    it('should upload folders', async () => {
        let formData = new FormData();

        let file_paths = [];
        for (let i = 0; i < 1000; i++)
            file_paths.push(`folder_test/file${i}.txt`);

        let response = await getResponse("/upload_folder", "POST", {
            'fields': file_paths
        }, cookie);

        let json = await response.json();

        expect(json.status).toBe("success");
        expect(json.message).toBe("ready to receive files");
        expect(json.transaction_id).toBeDefined();
        expect(json.folder_id).toBeDefined();

        folder_id = json.folder_id;

        let buffer = fs.readFileSync("Testing/dummies/folder_test/idk.txt");

        for (let i = 0; i < 10; i++) {
            let blob = new Blob([buffer], { type: 'text/plain' });

            let formData = new FormData();
            formData.append('file', blob, `file${i}`);

            response = await getResponse(`/upload_file?transaction_id=${json.transaction_id}`, "POST", formData, cookie);
        }

        expect(checkDirectory("Server/FileSystem/files", file_paths)).toBeTruthy();

    })

    it('should delete a file', async () => {
        let response = await getResponse(`/delete_file?${file_id}`, "DELETE", null, cookie);
        let data = await response.json();
        expect(data).toStrictEqual({ "status": "success", "message": "file deleted successfuly" });
    })


    it('should create a folder', async () => {
        let response = await getResponse("/create_folder", "POST", { 'color': 'blue', 'parent_folder_id': folder_id, "name": "idk" }, cookie);

        let data = await response.json();
        expect(data.status).toBe("success");
        expect(data.message).toBe("folder created successfuly");
        expect(data.folder_id).toBeDefined();

        folder_id = data.folder_id;
    })

    it('should delete a folder', async () => {
        let response = await getResponse(`/delete_folder?${folder_id}`, "DELETE", null, cookie);
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "folder deleted successfuly" });
    })

    afterAll(() => {
        console.log("Cleaning up");

        dotenv.config({ path: 'Testing/db_pass.env' });

      //  execSync("node Testing/clean_up.js", { stdio: 'inherit' });

        /* new Promise((resolve, reject) => {
            const proc = spawn(process.env.MYSQL_PATH || 'mysql', [
                "-u", "offgrid_test",
                `-p${process.env.DB_PASS}`,
                "offgrid_db"
            ], { stdio: ['pipe', 'inherit'] });

            proc.stdin.write(fs.readFileSync("Testing/clean_db.sql", "utf-8"));
            proc.stdin.end();
            proc.on('close', resolve);
            proc.on('error', reject);
        }) */


    })

})


