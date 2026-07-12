import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getResponse, extractCookie, testChange } from "./helpers.js";
import dotenv from "dotenv"
import { spawn } from "child_process";
import fs from "fs"

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

    it('should give corresponding error messages when login fails', async () => {
        let response = await getResponse("/log_in", "POST", {
            password: 'idk'
        });

        let data = await response.json();
        expect(data).toStrictEqual({ "status": "error", "message": "email not provided" });

        response = await getResponse("/log_in", "POST", {
            email: mail
        });

        data = await response.json();
        expect(data).toStrictEqual({ "status": "error", "message": "password not provided" });


    })

    it('should change its username', async () => {

        await testChange("/change_username", {}, cookie, { "status": "error", "message": "missing username" });

        await testChange("/change_username", {
            username: 'newPookie',
            password: 'idk'
        }, cookie, { "status": "success", "message": "username changed successfuly" });
    })

    it('should change its password', async () => {

        await testChange("/change_password", {}, cookie, { "status": "error", "message": "missing current password" });

        await testChange("/change_password", {
            current_password: 'current_pass'
        }, cookie, { "status": "error", "message": "missing new password" })

        await testChange("/change_password", {
            current_password: 'wrong pass',
            new_password: 'new'
        }, cookie, { "status": "error", "message": "incorrect password" })

        await testChange("/change_password", {
            current_password: 'idk',
            new_password: 'new'
        }, cookie, { "status": "success", "message": "password changed successfuly" });
    })

    it('should remove the user', async () => {

        let response = await getResponse("/delete_account", "POST", null, cookie);

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user removed" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

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
});