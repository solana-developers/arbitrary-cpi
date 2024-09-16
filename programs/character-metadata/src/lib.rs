use anchor_lang::prelude::*;

declare_id!("4FgVd2dgsFnXbSHz8fj9twNbfx8KWcBJkHa6APicU6KS");

pub const DISCRIMINATOR_SIZE: usize = 8;
pub const MAX_STAT_VALUE: u8 = 20;

#[program]
pub mod character_metadata {
    use super::*;

    pub fn create_metadata(ctx: Context<CreateMetadata>) -> Result<()> {
        let metadata = &mut ctx.accounts.metadata;
        let clock = Clock::get()?;

        metadata.character = ctx.accounts.character.key();
        metadata.health = pseudo_random(&clock, MAX_STAT_VALUE);
        metadata.power = pseudo_random(&clock, MAX_STAT_VALUE);

        msg!("Metadata created: Health: {}, Power: {}", metadata.health, metadata.power);
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
#[derive(Default, InitSpace)]
pub struct Metadata {
    pub character: Pubkey,
    pub health: u8,
    pub power: u8,
}

fn pseudo_random(clock: &Clock, limit: u8) -> u8 {
    let random = clock.unix_timestamp
        .checked_rem(limit as i64)
        .unwrap_or(0);

    random as u8
}