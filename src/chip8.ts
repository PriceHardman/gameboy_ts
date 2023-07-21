// Before tackling the GameBoy, we'll emulate the simpler Chip8 system.
// https://en.wikipedia.org/wiki/CHIP-8
// Reference: https://web.archive.org/web/20180509021749/http://www.codeslinger.co.uk/pages/projects/chip8.html

export class Chip8CPU {

    // The Chip8 CPU has: 

    // - 4096 bytes (4kB) of memory, 0x000 - 0xFFF
    memory: number[]

    // - 16 8-bit data registers, labeled V0 - VF. VF doubles as the carry flag register.
    registers: number[]

    // - A 16-bit address register, I, is generally used to store memory addresses, 
    //     so only the lowest (rightmost) 12 bits are usually used.
    addressRegisterI: number

    // - A 16-bit program counter, for storing the currently executing address
    programCounter: number

    // - A stack of 16 bit elements, to store the address that the interpreter shoud return to when finished with a subroutine
    stack: number[]

    // Graphics that work by drawing sprites at specific (X,Y) positions on the screen (with the top left as the origin).
    // Every sprite has a width of 8 pixels and a variable height. Sprite data is stored in game memory at the address pointed to
    // by the I register (our addressRegisterI variable). Each byte of this memory represents 1 line of sprite to draw, and since
    // sprites are always 8 pixels wide, each bit in the byte corresponds to one pixel in the line. A bit being 0 means keep that
    // pixel in its current state, and 1 means toggle the state of the pixel. If a pixel's state gets toggled from on (1) to off (0),
    // then the carry flag register VF gets set to 1, otherwise it will be set to 0. This represents collisions in sprites.
    // CPU opcode DXYN is responsible for graphic drawings. The resolution of the display is 64x32 and will be represented as a 2d array.
    screenData: number[][]

    constructor() {

        // Initialize memory, registers, counter, and stack
        this.memory = Array<number>(0xFFF)
        this.registers = Array<number>(16)
        this.addressRegisterI = 0x0
        this.programCounter = 0x0
        this.stack = Array<number>()

        // The chip8 graphics works by drawing sprites at specific x-y coordinates on the screen.
        // The origin (0,0) is the top-leftmost pixel. The resolution of the display is 64 width x 32 height
        // Sprite data is stored in game memory at the address pointed to by the I register.
        // 
        let arr = []
        for (let row = 0; row < 32; row++) {
            arr[row] = new Array<number>(64)
        }
        this.screenData = arr
    }

    reset(): void {
        // Reset the CPU by:

        // 1. Setting the address counter to 0
        this.addressRegisterI = 0

        // 2. Set the program counter to 0x200 (0x000 - 0x1ff) are reserved for the interpreter
        this.programCounter = 0x200

        // 3. Set all the registers to 0
        this.registers.fill(0)
    }

    readMemory(address: number): number {
        // Retrieve the 1B (8bits) data at a given memory address
        return this.memory[(address & 0xFFF)]
    }

    writeMemory(address: number, data: number): void {
        // Write 1B of data to a given memory address
        this.memory[(address & 0xFFF)] = (data & 0xFFF)
    }

    loadGame(gameData: number[]): void {
        // Given an array containing binary game data
        // e.g. [0x22, 0xf6, 0x6b, ...]
        // Load the data into memory starting at 0x200

        for (let i = 0; i < gameData.length; i++) {
            this.writeMemory(0x200 + i, gameData[i])
        }
    }

    getNextOpcode(): number {
        // Opcodes are the instructions that the CPU executes.
        // We get them from memory (starting with address 0x200, where the program
        // counter will be initialized). Opcodes are 16 bits (2 bytes) wide, whereas
        // each element in our memory array denotes a single byte. So we'll have to concatenate
        // adjacent bytes in memory to get each full opcode. e.g. if the memory layout is
        // [0xAB, 0xCD, ...], those first two bytes would encode the opcode 0xABCD.
        // This method will fetch the current memory byte pointed to by the program counter,
        // along with the next one too, concatenate them together into a single 16-bit value,
        // increment the program counter twice (so that the next byte retrieved is the first byte of
        // the next opcode), and return the retrieved opcode.
        let firstByte = this.readMemory(this.programCounter)
        let secondByte = this.readMemory(this.programCounter + 1)
        let opcode = (firstByte << 8) + secondByte
        this.programCounter += 2 // increment twice, because we read 2 memory positions
        return opcode
    }

    processOpcode(opcode: number): void {
        // The CHIP-8 has 35 opcodes, each of which is 2-bytes big-endian.
        // Given a numeric opcode input representing one of these opcodes,
        // this function figures out what the opcode is and delegates to the
        // appropriate function to execute the opcode.
        //
        // Reference: https://en.wikipedia.org/wiki/CHIP-8#Opcode_table

        // We'll use the following symbols:
        //  - NNN: Address 0xNNN (remember that the address space of the chip8 is only 0x000-0xFFF)
        //  - NN: 8 bit constant
        //  - N: 4 bit constant
        //  - X and Y: 4 bit register identifier
        //  - PC: Program counter
        //  - I: 16 bit memory address register I
        //  - VN: One of the 16 registers (variables).

        // We'll delegate to one of 16 functions, based on the first octet (4 bits) of the opcode:
        switch (opcode & 0xF000) {
            case 0x0000:
                this.opcode0(opcode)
                break
            case 0x1000:
                this.opcode1(opcode)
                break
            case 0x2000:
                this.opcode2(opcode)
                break
            case 0x3000:
                this.opcode3(opcode)
                break
            case 0x4000:
                this.opcode4(opcode)
                break
            case 0x5000:
                this.opcode5(opcode)
                break
            case 0x6000:
                this.opcode6(opcode)
                break
            case 0x7000:
                this.opcode7(opcode)
                break
            case 0x8000:
                this.opcode8(opcode)
                break
            case 0x9000:
                this.opcode9(opcode)
                break
            case 0xA000:
                this.opcodeA(opcode)
                break
            case 0xB000:
                this.opcodeB(opcode)
                break
            case 0xC000:
                this.opcodeC(opcode)
                break
            case 0xD000:
                this.opcodeD(opcode)
                break
            case 0xE000:
                this.opcodeE(opcode)
                break
            case 0xF000:
                this.opcodeF(opcode)
                break
        }
    }

    opcode0(opcode: number): void {
        // 3 possible instructions:
        
        switch(opcode) {
            case 0x00E0: // clears the screen
                this.screenData.forEach(row => row.fill(0))
                break
            case 0x00EE: // returns from a subroutine
                // To return from a subroutine, we pop the last address
                // off the stack and set the program counter to it.
                // This returns us to where we were before the subroutine ran.
                // This is the inverse operation of 0x2NNN.
                let returnAddress = this.stack.pop()
                if(returnAddress !== undefined){
                    this.programCounter = returnAddress
                }
                break
            default:
                // 0x0NNN is a legacy opcode that typically is left unimplemented on emulators.
                console.log("ERROR: Encountered legacy unimplemented opcode 0x0NNN")   
        }
    }

    opcode1(opcode: number): void {
        // Only one possible instruction: 0x1NNN jumps to address 0xNNN
        // This is equivalent to setting the program counter to 0xNNN
        this.programCounter = opcode & 0x0FFF
    }

    opcode2(opcode: number): void {
        // 0x2NNN: Call subroutine at 0xNNN
        // Calls a function inside the game code at address 0xNNN and once
        // its done returns to where it previously was. To do this, we 
        // push the current program counter onto the stack (so that
        // we know where to return to later when 0x00EE returns from the subroutine)
        // and set the program counter to 0xNNN
        this.stack.push(this.programCounter)
        this.programCounter = opcode & 0x0FFF
    }

    opcode3(opcode: number): void {
        // 0x3XNN: Skips the next instruction if register VX equals NN
        let register = (opcode >> 8) & 0x0F // extract X from 0x3XNN
        let value = opcode & 0x00FF // extract NN
        if(this.registers[register] == value) {
            this.programCounter += 2 // skip next instruction
        }
    }

    opcode4(opcode: number): void {
        // 0x4XNN: Skips the next instruction if VX does not equal NN
        let register = (opcode >> 8) & 0x0F // extract X from 0x4XNN
        let value = opcode & 0x00FF // extract NN
        if(this.registers[register] !== value) {
            this.programCounter += 2 // skip next instruction
        }
    }

    opcode5(opcode: number): void {
        // 0x5XY0: Skips the next instruction if VX == VY
        let VX = (opcode >> 8) & 0x0F  // Extract X: 0x5XY0 -> 0x5X -> 0x0X
        let VY = (opcode >> 4) & 0x00F // Extract Y: 0x5XY0 -> 0x5XY -> 0x00Y
        if(this.registers[VX] == this.registers[VY]){
            this.programCounter += 2
        }
    }

    opcode6(opcode: number): void {
        // 0x6XNN: Set register VX to NN
        this.registers[(opcode >> 8) & 0x0F] = (opcode & 0x00FF) & 0xFFFF
    }

    opcode7(opcode: number): void {
        // 0x7XNN: Adds NN to VX (carry flag is not changed)
        this.registers[(opcode >> 8) & 0x0F] += (opcode & 0x00FF) & 0xFFFF
    }

    opcode8(opcode: number): void {
        // 9 different opcodes of the form 0x8XYN, each with a
        // a different operation depending on the last octet N

        let VX = (opcode >> 8) & 0x0F  // Extract X: 0x8XYN -> 0x8X -> 0x0X
        let VY = (opcode >> 4) & 0x00F // Extract Y: 0x8XYN -> 0x8XY -> 0x00Y
        let N = opcode & 0x000F

        switch(N) {
            case 0x0:
                this.registers[VX] = this.registers[VY] // Set VX equal to VY
                break
            case 0x1:
                // Set VX equal to (VX | VY)
                break
            case 0x2:
                break
            case 0x3:
                break
            case 0x4:
                break
            case 0x5:
                break
            case 0x6:
                break
            case 0x7:
                break
            case 0xE:
                break
            default:
                console.log(`ERROR: Encountered an invalid opcode 0x${opcode.toString(16).toUpperCase()}`)
        }
    }

    opcode9(opcode: number): void {
        
    }

    opcodeA(opcode: number): void {
        
    }

    opcodeB(opcode: number): void {
        
    }

    opcodeC(opcode: number): void {
        
    }

    opcodeD(opcode: number): void {
        
    }

    opcodeE(opcode: number): void {
        
    }

    opcodeF(opcode: number): void {
        
    }
}