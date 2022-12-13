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
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMetadata<'info> {}

pub const MINT_AUTHORITY_SEED: &str = "mint-authority";