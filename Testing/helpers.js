import fs from "fs"
import path from "path"

import { expect } from "vitest"


export async function getResponse(endpoint, method, body = null, cookie = null, content_type = "application/json") {
    let isFormData = body instanceof FormData;

    let response = await fetch(`http://localhost:18080${endpoint}`, {
        method: method,
        headers: {
            ...(!isFormData && { 'Content-Type': content_type }),
            ...(cookie && { 'Cookie': cookie })
        },
        credentials: 'include',
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    });

    return response;
}


export function extractCookie(cookie) {
    return cookie.split(";")[0];
}

function getUserFolder(dirname) {
    let entries = fs.readdirSync(dirname);

    if (entries.length < 1)
        throw new Error("No entries found");

    let userFolder = path.join(dirname, entries[0]);

    return userFolder;
}

export function checkDirectory(dirname, expected_files) {
    try {
        var userFolder = getUserFolder(dirname);
    } catch (err) {
        return false;
    }

    for (let rel_path of expected_files) {
        let full_path = path.join(userFolder, rel_path);
        if (!fs.existsSync(full_path))
            return false;
    }

    return true;
}

export function checkFile(dirname, expected_name) {
    try {
        var userFolder = getUserFolder(dirname);
    } catch (err) {
        return false;
    }

    let full_path = path.join(userFolder, expected_name);

    return fs.existsSync(full_path);

}

export async function testChange(endpoint, body, cookie, expected) {

    let response = await getResponse(endpoint, 'PATCH', body, cookie);

    let data = await response.json();
    expect(data).toStrictEqual(expected);
}


export async function sendAndReceive(ws, obj) {
    
    return new Promise((resolve, reject) => {

        ws.once("message", (data) => {
            try {
                resolve(JSON.parse(data.toString()))
            } catch (err) {
                reject(err);
            }
        });

        ws.send(JSON.stringify(obj));
    })
}