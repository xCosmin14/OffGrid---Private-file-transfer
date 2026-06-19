import { describe, it, expect } from "vitest"

let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie;

function extractCookie(cookie) {
    return cookie.split(";")[0];
}

describe("server", () => {

    it('should successfully register an user', async () => {


        let response = await fetch("http://localhost:18080/register", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: mail,
                password: "idk",
                username: name
            })
        });

        let data = await response.json();
        cookie = extractCookie(response.headers.get("set-cookie"));

        expect(data).toStrictEqual({ "status": "success", "message": "user registered" });
        expect(response.headers.get("set-cookie")).toContain("session_id=");
    })

    it('should log an user in', async () => {

        let response = await fetch("http://localhost:18080/log_in", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: mail,
                password: "idk"
            })
        });

        let data = await response.json();
        cookie = extractCookie(response.headers.get("set-cookie"));

        expect(data).toStrictEqual({ "status": "success", "message": "user logged in" });
        expect(response.headers.get("set-cookie")).toContain("session_id=");

    })

    it('should log the user out', async () => {

        mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
        name = `testname_${crypto.randomUUID().slice(0, 8)}`;


        let response = await fetch("http://localhost:18080/log_out", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            credentials: 'include'
        })


        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user logged out" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    })

    it('should remove the user', async () => {

        let response = await fetch("http://localhost:18080/register", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: mail,
                password: "idk",
                username: name
            })
        });

        cookie = extractCookie(response.headers.get("set-cookie"));

        response = await fetch("http://localhost:18080/delete_account", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            credentials: 'include'
        })

        let data = await response.json();

        expect(data).toStrictEqual({ "status": "success", "message": "user removed" });
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    })
})