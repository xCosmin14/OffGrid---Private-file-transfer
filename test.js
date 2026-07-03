import { describe, it, expect, beforeAll } from "vitest"
import fs from 'fs'
import { getResponse, extractCookie } from "./helper_functions";
import { ECDH } from "crypto";
import { get } from "http";

let mail = `pookie${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `deea${crypto.randomUUID().slice(0, 8)}`;
let cookie;
let file_id;


describe("File Tests", () => {
    
    it('should upload profile pictures', async () => {
        let buffer = fs.readFileSync("Testing/dummies/hamster_test.png");
        let blob = new Blob([buffer], { type: 'image/png' });

        let formData = new FormData();
        formData.append('photo', blob, "hamster_test.png");

        let response = await getResponse("/upload_photo", "POST", formData, cookie);
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "file uploaded successfuly", "file_id": "" });

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


        let response = await getResponse("/upload_folder", "POST", formData, cookie);
        let data = await response.json();

        expect(data.status).toBe("success");
        expect(data.message).toBe("folder uploaded successfuly");
        expect(data.folder_id).toBeDefined();

    })

   it('should retrieve a file', async () => {

        let response = await getResponse(`/get_file?file_id=${file_id}`, 'GET', null, cookie);

        expect(response.status).toBe(200);

        let content = await response.arrayBuffer();
        let received = Buffer.from(content);
        let expected = fs.readFileSync("Testing/dummies/regular_file.txt");

        expect(received).toEqual(expected);
    })


   it('should retrieve metadata of a file', async() =>{

        let response = await getResponse(`/get_file_metadata?file_id=${file_id}`, "POST", {
            "fields":["name", "size"]
        }, cookie);

        console.log(await response.json());
    })

})