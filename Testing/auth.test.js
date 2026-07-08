import { describe, it, expect } from "vitest"

import { getResponse, extractCookie } from "./helpers.js";

let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie;

describe("Auth Test", () => {

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

    it('should log the user out', async () => {

        let response = await getResponse("/log_out", "POST", null, cookie);
        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user logged out" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

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

    it('should remove the user', async () => {

        let response = await getResponse("/delete_account", "POST", null, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user removed" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    })
});