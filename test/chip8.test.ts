import {Chip8CPU} from '../src/chip8'

describe("Chip8CPU", () => {
    test("Instantiation", () => {
        const cpu = new Chip8CPU()
        expect(cpu.memory.length).toEqual(4096)
    })

    test("Reset()", () => {
        const cpu = new Chip8CPU()
        cpu.reset()
        expect(cpu.addressRegisterI).toEqual(0)
        expect(cpu.programCounter).toEqual(0x200)
        expect(cpu.registers).toEqual(Array(16).fill(0))
    })

    test("Reading and Writing Memory", () => {
        const cpu = new Chip8CPU()
        
        cpu.writeMemory(0x246,0xAB)

        expect(cpu.memory[0x246]).toEqual(0xAB)

        expect(cpu.readMemory(0x246)).toEqual(0xAB)
    })

    test("Loading a game into memory", () => {
        const cpu = new Chip8CPU()
        cpu.reset()
        const gameData: number[] = [1,2,3]

        cpu.loadGame(gameData)

        expect(cpu.readMemory(0x200)).toEqual(1)
        expect(cpu.readMemory(0x201)).toEqual(2)
        expect(cpu.readMemory(0x202)).toEqual(3)
    })
})