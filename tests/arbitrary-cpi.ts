import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Gameplay } from "../target/types/gameplay";
import { FakeMetadata } from "../target/types/fake_metadata";
import { CharacterMetadata } from "../target/types/character_metadata";
import { Keypair } from "@solana/web3.js";
import { getMetadataKey } from "./utils/utils";
import { airdropIfRequired } from "@solana-developers/helpers";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("Arbitrary CPI", () => {
  let gameplayProgram: Program<Gameplay>;
  let metadataProgram: Program<CharacterMetadata>;
  let fakeMetadataProgram: Program<FakeMetadata>;
  let provider: anchor.AnchorProvider;
  let connection: anchor.web3.Connection;
  let playerOne: Keypair;
  let attacker: Keypair;

  before(async () => {
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

    await airdropIfRequired(
      connection,
      playerOne.publicKey,
      1 * LAMPORTS_PER_SOL,
      1 * LAMPORTS_PER_SOL
    );
    await airdropIfRequired(
      connection,
      attacker.publicKey,
      1 * LAMPORTS_PER_SOL,
      1 * LAMPORTS_PER_SOL
    );
  });

  it("Insecure instructions allow attacker to win every time successfully", async () => {
    try {
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
      // Fetch both player's metadata accounts
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

      // The regular player should have health and power between 0 and 20
      expect(playerOneMetadata.health).to.be.lessThan(20);
      expect(playerOneMetadata.power).to.be.lessThan(20);

      // The attacker will have health and power of 255
      expect(attackerMetadata.health).to.equal(255);
      expect(attackerMetadata.power).to.equal(255);
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  });

  it("prevents secure character creation with fake program", async () => {
    try {
      await gameplayProgram.methods
        .createCharacterSecure()
        .accounts({
          metadataProgram: fakeMetadataProgram.programId,
          authority: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();

      throw new Error("Expected createCharacterSecure to throw an error");
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      console.log(error);
    }
  });
});
