import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getResponse, extractCookie, testChange } from "./helpers.js";
import { get } from "node:http";
import { exp } from "prelude-ls";

let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie;


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
            'file_fields': ['name', 'path'],
            'folder_fields': ['color', 'name', 'path']
        }, cookie);

        let data = await response.json();
        expect(data).toStrictEqual({
            status: 'success',
            message: 'Files found',
            files: { name: 'idk', path: null },
            folders: { color: 'pink', name: 'pookie', path: null }})

    })
})