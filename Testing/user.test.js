import { describe, it, expect, beforeAll } from "vitest"

import { getResponse, extractCookie } from "./helper_functions";
import { beforeEach } from "node:test";

let mail = `deea_test@gmail.com`;
let name = `deea`;
let cookie;



describe('User test', () => {
    beforeAll(async () => {
        let response = await getResponse("/register", "POST",{ username: name, email: mail, password: 'idk' });
    })
})