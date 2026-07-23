import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getResponse, extractCookie, testChange } from "./helpers.js";
import dotenv from "dotenv"
import { spawn } from "child_process";
import fs from "fs"

let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie;

let file_id, folder_id;

describe("General test", async () => {
    beforeAll(async () => {

        let response = await getResponse('/register', 'POST', {
            email: mail,
            password: "idk",
            username: name
        });

        cookie = extractCookie(response.headers.get("set-cookie"));

        response = await getResponse("/create_file", "POST", { 'name': 'idk' }, cookie);
        response = await getResponse("/create_folder", "POST", { "name": "pookie", color: "pink" }, cookie);

    })

    it('should retrieve general user data', async () => {
        let response = await getResponse("/user_data", "POST", { 'fields': ['username', 'email', 'preferences'] }, cookie);
        let data = await response.json();
        expect(data).toStrictEqual({
            status: 'success',
            message: 'User found',
            username: name,
            email: mail,
            preferences: '{}'
        })

    })

    it('should retrieve file and folder data', async () => {
        let response = await getResponse("/user_files", "POST", {
            'file_fields': ['name', 'path', 'created', 'modified'],
            'folder_fields': ['color', 'name', 'path', 'created', 'modified']
        }, cookie);

        let data = await response.json();

        expect(data.status).toBe("success");
        expect(data.message).toBe("Files found");
        expect(data.files[0].name).toBe('idk');
        expect(data.files[0].path).toBe('idk');
        expect(data.files[0].file_id).toBeDefined();
        expect(data.files[0].created).toBeDefined();
        expect(data.files[0].modified).toBeDefined();

        file_id = data.files[0].file_id;

        expect(data.folders[0].color).toBe("pink");
        expect(data.folders[0].name).toBe("pookie");
        expect(data.folders[0].path).toBe('pookie');
        expect(data.folders[0].folder_id).toBeDefined();
        expect(data.folders[0].created).toBeDefined();
        expect(data.folders[0].modified).toBeDefined();

    })

    it('should change user preferences', async () => {
        let response = await getResponse("/change_data", "PATCH", {
            'preferences': '{"color":"blue"}'
        }, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({
            "message": "Updated successfuly",
            "status": "success",
        })
    })

   it('should change other entities', async () => {
        let response = await getResponse(`/change_data/file/${file_id}`, "PATCH", {
            'favourite':1
        }, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({
            "message": "Updated successfuly",
            "status": "success",
        })
    }) 

    afterAll(() => {
        console.log("Cleaning up");

        dotenv.config({ path: 'Testing/db_pass.env' });

        new Promise((resolve, reject) => {
            const proc = spawn(process.env.MYSQL_PATH || 'mysql', [
                "-u", "offgrid_test",
                `-p${process.env.DB_PASS}`,
                "offgrid_db"
            ], { stdio: ['pipe', 'inherit', 'inherit'] });

            proc.stdin.write(fs.readFileSync("Testing/clean_db.sql", "utf-8"));
            proc.stdin.end();
            proc.on('close', resolve);
            proc.on('error', reject);
        }) 


    })
})