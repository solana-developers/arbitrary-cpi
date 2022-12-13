import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { ArbitraryCpi } from "../target/types/arbitrary_cpi"
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { safeAirdrop } from "./utils/utils"
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { expect } from 'chai'

describe("arbitrary-cpi", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.ArbitraryCpi as Program<ArbitraryCpi>
  const provider = anchor.AnchorProvider.env()
  const connection = provider.connection

  const authority = Keypair.generate()
  const tokenMint = Keypair.generate()

  const [programMintAuthority, authBump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("mint-authority")],
    program.programId
  )
  const [metadataAddress, metadataBump] = await PublicKey.findProgramAddress(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), tokenMint.publicKey.toBuffer()],
    METADATA_PROGRAM_ID
  )

  // test expected to fail
  it("Pass in incorrect token program", async () => {
    await safeAirdrop(authority.publicKey, connection)
    try {
      await program.methods.initializeMetadata()
      .accounts({
        authority: authority.publicKey,
        tokenMint: tokenMint.publicKey,
        programMintAuthority: programMintAuthority,
        metadataAccount: metadataAddress,
        metadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([authority, tokenMint])
      .rpc()
    } catch (e) {
      console.log(e.message)
    }
  })

  // test expected to fail
  it("Pass in incorrect metadata program", async () => {
    try {
      await program.methods.initializeMetadata()
      .accounts({
        authority: authority.publicKey,
        tokenMint: tokenMint.publicKey,
        programMintAuthority: programMintAuthority,
        metadataAccount: metadataAddress,
        metadataProgram: TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([authority, tokenMint])
      .rpc()
    } catch (e) {
      console.log(e.message)
      expect(e.message).to.eq("AnchorError caused by account: metadata_program. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated.")
    }
  })

  it("Initialize SFT Metadata", async () => {
    const tx = await program.methods.initializeMetadata()
      .accounts({
        authority: authority.publicKey,
        tokenMint: tokenMint.publicKey,
        programMintAuthority: programMintAuthority,
        metadataAccount: metadataAddress,
        metadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([authority, tokenMint])
      .rpc()

      await connection.confirmTransaction(tx)
      console.log("Tx ID:", tx)
  })
})