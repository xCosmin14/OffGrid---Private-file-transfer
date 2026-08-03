import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { sendAndReceive, getResponse, extractCookie, collectMessages } from "./helpers.js";
import WebSocket from 'ws';

import { spawn, execSync, exec } from "child_process";
import dotenv from 'dotenv';
import fs from "fs"
import { send } from "process";
import { addAbortListener } from "events";

const LENGTH = 3;

let emails = [], usernames = [], cookies = [], sockets = [];
let file_id;

for (let i = 0; i < LENGTH; i++) {
    emails.push(`test${crypto.randomUUID().slice(0, 8)}@gmail.com`);
    usernames.push(`test${crypto.randomUUID().slice(0, 8)}`);
}


describe("Concurrent editing test", async () => {

    async function connect(cookie) {
        const socket = new WebSocket('ws://localhost:18080', {
            headers: { Cookie: cookie }
        });
        await new Promise((resolve, reject) => {
            socket.on('open', resolve);
            socket.on('error', reject);
        });
        return socket;
    }

    beforeAll(async () => {

        for (let i = 0; i < LENGTH; i++) {
            let response = await getResponse('/register', 'POST', {
                email: emails[i],
                password: "idk",
                username: usernames[i]
            });


            cookies[i] = extractCookie(response.headers.get("set-cookie"));
        }

        let response = await getResponse("/create_file", "POST", {
            name: "idk"
        }, cookies[0])

        let json = await response.json();
        file_id = json.file_id;

        for (let i = 0; i < LENGTH; i++)
            sockets[i] = await connect(cookies[i])
    })


    it('should grand file access to other users', async () => {

        for (let i = 1; i < LENGTH; i++) {
            let access_type = (i % 2 == 0) ? 'edit' : 'view';

            let response = await getResponse("/grand_access", "POST", {
                username: uesrnames[i],
                file_id: file_id,
                type: access_type,
                resource: 'file'
            }, cookies[0]);

            let json = await response.json();
            expect(json).toStrictEqual({ status: 'success', message: 'access granted successfuly' });
        }

    })

    it('users should be receiving notifications about files', async () => {

        let response = await getResponse("/create_folder", "POST", { name: 'folder_parent' }, cookies[0]);
        let json = await response.json();

        const notifPromise = new Promise((resolve) => {
            sockets[1].once('message', (data) => resolve(JSON.parse(data.toString())));
        });

        response = await getResponse("/grand_access", "POST", {
            username: usernames[1],
            folder_id: json.folder_id,
            type: 'edit',
            resource: 'folder'
        }, cookies[0])


        console.log(await notifPromise);

        await getResponse("/create_file", "POST", {
            name: "idk", folder_id: json.folder_id
        }, cookies[0]);


    });

    it('users can watch the same file', async () => {
        for (let i = 0; i < LENGTH; i++) {
            let res = await sendAndReceive(sockets[i], {
                type: 'watch', file_id
            })
            expect(res).toStrictEqual({ status: "success", message: 'viewer added to the file' });
        }
    })


    it("only users with 'edit' access type are able to edit the file", async () => {
        let res = await sendAndReceive(sockets[1], {
            type: "modify",
            file_id: file_id,
            position: 12,
            operation: "delete",
            length: 2,
            on_version: 0
        });

        expect(res).toStrictEqual({ status: 'error', message: "this user doesn't have edit rights to this file" });
    })

    it('users can edit the file at the same time', async () => {
        let editSockets = [];

        for (let i = 0; i < LENGTH; i += 2)
            editSockets.push(sockets[i]);


        let promises = editSockets.map(socket => collectMessages(socket, editSockets.length));


        for (let socket of editSockets)
            socket.send(JSON.stringify({
                type: "modify",
                file_id: file_id,
                position: 12,
                operation: "delete",
                length: 2,
                on_version: 0
            }))

        const results = await Promise.all(promises);

        for (let res of results) {
            const confirmation = res.find(m => m.status !== undefined);
            expect(confirmation.status).toBe('success');

            const broadcasts = res.filter(m => m.type === 'file_changed');
            expect(broadcasts.length).toBe(editSockets.length - 1);
        }

    })


    it('users can unwatch the file', async () => {
        for (let i = 0; i < LENGTH; i++) {
            let res = await sendAndReceive(sockets[i], {
                type: 'unwatch', file_id
            })

            expect(res).toStrictEqual({ status: "success", message: "viewer removed from the watch list" });
        }
    })

    afterAll(async () => {

        dotenv.config({ path: 'Testing/db_pass.env' });

        execSync("node Testing/clean_up.js", { stdio: 'inherit' });


        await new Promise((resolve, reject) => {
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

        await Promise.all(sockets.map(ws => {
            new Promise((resolve) => { ws.on('close', resolve); ws.close(); })
        }))
    });
})