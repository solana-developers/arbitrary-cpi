use anchor_lang::prelude::*;

declare_id!("HQqG7PxftCD5BB9WUWcYksrjDLUwCmbV8Smh1W8CEgQm");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod fake_metadata {
    use super::*;

    pub fn create_metadata(ctx: Context<CreateMetadata>) -> Result<()> {
        let metadata = &mut ctx.accounts.metadata;

        metadata.health = u8::MAX;
        metadata.power = u8::MAX;

        msg!("Fake metadata created with max stats");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    /// CHECK: This account will not be checked by anchor
    pub character: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR_SIZE + Metadata::INIT_SPACE,
        seeds = [character.key().as_ref()],
        bump
    )]
    pub metadata: Account<'info, Metadata>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Metadata {
    pub character: Pubkey,
    pub health: u8,
    pub power: u8,
}