import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey"
import { LAMPORTS_PER_SOL, Connection, PublicKey } from "@solana/web3.js"

export async function safeAirdrop(address: PublicKey, connection: Connection) {
  const acctInfo = await connection.getAccountInfo(address, "confirmed")

  if (acctInfo == null || acctInfo.lamports < LAMPORTS_PER_SOL) {
    let signature = await connection.requestAirdrop(address, LAMPORTS_PER_SOL)

    await connection.confirmTransaction(signature)
  }
}

export function getCharacterKey(auth: PublicKey, program: PublicKey) {
  return findProgramAddressSync([auth.toBuffer()], program)
}

export function getMetadataKey(
  auth: PublicKey,
  gameplayProgram: PublicKey,
  metadataProgram: PublicKey
) {
  const [characterKey] = getCharacterKey(auth, gameplayProgram)

  return findProgramAddressSync([characterKey.toBuffer()], metadataProgram)
}
