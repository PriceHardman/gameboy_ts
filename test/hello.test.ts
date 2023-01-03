import {hello} from "../src/hello"

describe("Basic Test", () => {
    test("hello('world') == 'Hello, world'", () => {
        expect(hello("world")).toBe("Hello, world")
    })
})