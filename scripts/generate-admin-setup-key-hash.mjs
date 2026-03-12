import bcrypt from "bcryptjs"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

function parseRounds(argv) {
  const roundsArg = argv.find((arg) => arg.startsWith("--rounds="))
  if (!roundsArg) return 10

  const parsed = Number(roundsArg.split("=")[1])
  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
    throw new Error("--rounds must be an integer between 4 and 15")
  }

  return parsed
}

async function main() {
  const rounds = parseRounds(process.argv.slice(2))
  const rl = readline.createInterface({ input, output })

  try {
    const key = (await rl.question("Enter setup key to hash: ")).trim()

    if (!key) {
      throw new Error("Setup key cannot be empty")
    }

    const hash = await bcrypt.hash(key, rounds)

    console.log("\nCopy this into .env:")
    console.log(`ADMIN_SETUP_KEY_HASH=\"${hash}\"`)
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
