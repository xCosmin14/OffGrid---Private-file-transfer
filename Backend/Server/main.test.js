import { describe, it, expect } from "vitest"
import fs from 'fs'


let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie;

async function getResponse(endpoint, method, body = null, cookie = null, content_type = "application/json") {
    let isFormData = body instanceof FormData;

    let response = await fetch(`http://localhost:18080${endpoint}`, {
        method: method,
        headers: {
            ...(!isFormData && { 'Content-Type': content_type }),
            ...(cookie && { 'Cookie': cookie })
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined
    });

    return response;
}

function extractCookie(cookie) {
    return cookie.split(";")[0];
}

describe("server", () => {

    it('should successfully register an user', async () => {


        let response = await getResponse('/register', 'POST', {
            email: mail,
            password: "idk",
            username: name
        });

        let data = await response.json();
        cookie = extractCookie(response.headers.get("set-cookie"));

        expect(data).toStrictEqual({ "status": "success", "message": "user registered" });
        expect(response.headers.get("set-cookie")).toContain("session_id=");
    })

    it('should give the duplicate key messages correctly', async () => {

        let response = await getResponse("/register", "POST", {
            email: mail,
            password: "idk",
            username: "unique_username"
        });

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "error", "message": "duplicate email" });

        response = await getResponse("/register", "POST", {
            email: "unique_email",
            password: "idk",
            username: name
        });

        data = await response.json();

        expect(data).toStrictEqual({ "status": "error", "message": "duplicate username" });

    })

    it('should log an user in', async () => {

        let response = await getResponse("/log_in", "POST", {
            email: mail,
            password: "idk"
        });

        let data = await response.json();
        cookie = extractCookie(response.headers.get("set-cookie"));

        expect(data).toStrictEqual({ "status": "success", "message": "user logged in" });
        expect(response.headers.get("set-cookie")).toContain("session_id=");

    })


    it('should upload profile pictures', async () => {
        let buffer = fs.readFileSync("../Testing/hamster_test.png");
        let blob = new Blob([buffer], { type: 'image/png' });

        let formData = new FormData();
        formData.append('photo', blob, "hamster_test.png");

        let response = await getResponse("/upload_photo", "POST", formData, cookie, "image/png");
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "photo uploaded successfuly" });

    })

    it('should log the user out', async () => {

        mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
        name = `testname_${crypto.randomUUID().slice(0, 8)}`;


        let response = await getResponse("/log_out", "POST", null, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user logged out" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    })

    it('should remove the user', async () => {

        let response = await getResponse('/register', 'POST', {
            email: mail,
            password: "idk",
            username: name
        })

        cookie = extractCookie(response.headers.get("set-cookie"));

        response = await getResponse("/delete_account", "POST", null, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user removed" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    })
})