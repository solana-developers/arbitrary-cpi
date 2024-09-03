import { LAMPORTS_PER_SOL, Connection, PublicKey } from "@solana/web3.js";

export async function safeAirdrop(address: PublicKey, connection: Connection) {
  const acctInfo = await connection.getAccountInfo(address, "confirmed");

  if (acctInfo == null || acctInfo.lamports < LAMPORTS_PER_SOL) {
    const airdropSignature = await connection.requestAirdrop(
      address,
      LAMPORTS_PER_SOL
    );

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      },
      "confirmed"
    );
  }
}

export function getCharacterKey(auth: PublicKey, program: PublicKey) {
  return PublicKey.findProgramAddressSync([auth.toBuffer()], program);
}

export function getMetadataKey(
  auth: PublicKey,
  gameplayProgram: PublicKey,
  metadataProgram: PublicKey
) {
  const [characterKey] = getCharacterKey(auth, gameplayProgram);

  return PublicKey.findProgramAddressSync(
    [characterKey.toBuffer()],
    metadataProgram
  );
}
