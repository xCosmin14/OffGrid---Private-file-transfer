import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { sendAndReceive, getResponse, extractCookie } from "./helpers.js";
import WebSocket from 'ws';
import { send } from "process";


let mail = `test_${crypto.randomUUID().slice(0, 8)}@gmail.com`;
let name = `testname_${crypto.randomUUID().slice(0, 8)}`;
let cookie, file_id;

let ws;

describe("Ws connection test", async () => {

    let response = await getResponse('/register', 'POST', {
        email: mail,
        password: "idk",
        username: name
    });

    cookie = extractCookie(response.headers.get("set-cookie"));

    response = await getResponse("/create_file", "POST", {
        name: "idk"
    }, cookie)

    let json = await response.json();
    file_id = json.file_id;


    let ws;

    beforeAll(async () => {
        ws = new WebSocket('ws://localhost:18080', {
            headers: {
                Cookie: cookie
            }
        });

        await new Promise((resolve, reject) => {
            ws.on('open', () => {
                console.log("socket ready");
                resolve();
            });

            ws.on('error', reject);
        });
    });


    it('should reject a message with no type', async () => {
        const res = await sendAndReceive(ws, { message: "idk" });
        expect(res).toStrictEqual({ status: "error", message: "missing field: type" });
    });

    it('should reject a watch message with no file_id', async () => {
        const res = await sendAndReceive(ws, { type: "watch" });
        expect(res).toStrictEqual({ status: "error", message: "missing field: file_id" });
    });


    it('should rejct a message with no valid file_id', async () => {
        const res = await sendAndReceive(ws, { type: "watch", "file_id": "invalid_file_id" });
        expect(res).toStrictEqual({ status: 'error', message: 'file access denied' });

    })

    it('should update the viewers map', async () => {
        const res = await sendAndReceive(ws, { type: "watch", file_id: file_id });
        expect(res).toStrictEqual({ status: 'success', message: 'viewer added to the file' });
    })

    it('should remove users from the map', async () => {
        const res = await sendAndReceive(ws, { type: "unwatch", file_id: file_id });
        expect(res).toStrictEqual({ status: 'success', message: 'viewer removed from the watch list' });
    })

    it('should respect the modify structure', async () => {
        const res = await sendAndReceive(ws, {
            type: "modify",
            file_id: file_id,
            operation: "delete",
            length: 2
        });

        expect(res).toStrictEqual({ status: 'error', message: 'missing field: position' });

    })


    it('should update files', async () => {
        const res = await sendAndReceive(ws, {
            type: "modify",
            file_id: file_id,
            position: 12,
            operation: "delete",
            length: 2,
            on_version: 0
        });

        expect(res).toStrictEqual({ status: "success", message: "update successful" });

    })



    afterAll(() => {
        return new Promise((resolve) => {
            ws.on('close', resolve);
            ws.close();
        });
    });
})