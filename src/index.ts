
import { Chip8CPU } from "./chip8"
import * as fs from 'fs'

const cpu = new Chip8CPU()
const gameData: number[] = [...fs.readFileSync("./pong.ch8")]

cpu.reset()
cpu.loadGame(gameData)
console.log(`Loaded game. Program counter is at 0x${cpu.programCounter.toString(16)}`)
console.log(`First opcode is 0x${cpu.getNextOpcode().toString(16)}. Program counter is now at 0x${cpu.programCounter.toString(16)}`)
console.log(`Second opcode is 0x${cpu.getNextOpcode().toString(16)}. Program counter is now at 0x${cpu.programCounter.toString(16)}`)
console.log(`Third opcode is 0x${cpu.getNextOpcode().toString(16)}. Program counter is now at 0x${cpu.programCounter.toString(16)}`)