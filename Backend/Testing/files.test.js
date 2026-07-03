import { describe, it, expect, beforeAll } from "vitest"
import fs from 'fs'
import { getResponse, extractCookie } from "./helper_functions";

let mail = `pookie${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `deea${crypto.randomUUID().slice(0, 8)}`;
let cookie;


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

        let response = await getResponse("/upload_photo", "POST", formData, cookie, "image/png");
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "file uploaded successfuly" });

    })

    it('should upload regular files', async () => {
        let buffer = fs.readFileSync("Testing/dummies/regular_file.txt");
        let blob = new Blob([buffer], { type: 'text/plain' });

        let formData = new FormData();
        
        formData.append('photo', blob, "regular_file.txt");

        let response = await getResponse("/upload_file", "POST", formData, cookie, 'text/plain');
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "file uploaded successfuly" });

    })

    it('should upload folders', async () => {
        let formData = new FormData();
        let folderFiles = [
            {
                name: 'idk.txt', path: 'folder_test/idk.txt'
            },
            {
                name: 'numai_bile.txt', path: 'folder_test/numai_bile.txt'
            }
        ];

        for (let file of folderFiles) {
            let buffer = fs.readFileSync(`Testing/dummies/folder_test/${file.name}`);
            let blob = new Blob([buffer], { type: 'text/plain' });
            formData.append('files', blob, file.path);
        }


        let response = await getResponse("/upload_folder", "POST", formData, cookie, 'text/plain');
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "folder uploaded successfuly" });

    })

})