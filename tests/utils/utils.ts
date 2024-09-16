import { PublicKey } from "@solana/web3.js";

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
