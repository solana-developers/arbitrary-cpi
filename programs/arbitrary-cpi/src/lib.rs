use {
    anchor_lang::{prelude::*, solana_program},
    anchor_spl::{
        token::{Mint, Token},
    },
    mpl_token_metadata::{
        ID as METADATA_PROGRAM_ID,
        instruction::{create_metadata_accounts_v3}
    }
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod arbitrary_cpi {
    use super::*;

    pub fn initialize_metadata(ctx: Context<InitializeMetadata>) -> Result<()> {
         // create metadata account
        let ix = create_metadata_accounts_v3(
            ctx.accounts.metadata_program.key(),
            ctx.accounts.metadata_account.key(),
            ctx.accounts.token_mint.key(),
            ctx.accounts.program_mint_authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.program_mint_authority.key(),
            // pass these in as arguments
            "test token".to_string(),
            "TEST".to_string(),
            "test_uri".to_string(), 
            None,
            0,
            false,
            false,
            None,
            None,
            None
        );

        // program signer seeds
        let auth_bump = *ctx.bumps.get("program_mint_authority").unwrap();
        let auth_seeds = &[MINT_AUTHORITY_SEED.as_bytes(), &[auth_bump]];
        let signer = &[&auth_seeds[..]];

        // create metadata account for SFT
        solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.metadata_program.to_account_info(),
                ctx.accounts.metadata_account.to_account_info(),
                ctx.accounts.token_mint.to_account_info(),
                ctx.accounts.program_mint_authority.to_account_info(),
                ctx.accounts.authority.to_account_info()
            ],
            signer
        )?;

        msg!("Semi fungible token created!");

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    // mint for the Semi-Fungible Token
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = program_mint_authority,
    )]
    pub token_mint: Account<'info, Mint>,
    ///CHECK: program mint authority
    #[account(
        seeds = [MINT_AUTHORITY_SEED.as_bytes()],
        bump
    )]
    pub program_mint_authority: AccountInfo<'info>,
    ///CHECK: safe metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,
    ///CHECK: safe because we verify this is the metadata program
    #[account(constraint = metadata_program.key() == METADATA_PROGRAM_ID)]
    pub metadata_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub const MINT_AUTHORITY_SEED: &str = "mint-authority";