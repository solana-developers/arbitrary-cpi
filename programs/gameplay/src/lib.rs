use anchor_lang::prelude::*;
use character_metadata::{
    cpi::accounts::CreateMetadata, cpi::create_metadata, program::CharacterMetadata,
};

declare_id!("2m6gP4uHMbZ4RmQVyQ6ndQ1LCGMpzHSfvzU6ZwgUDMtE");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod gameplay {
    use anchor_lang::solana_program::{instruction::Instruction, program::invoke};

    use super::*;

    pub fn create_character_insecure(ctx: Context<CreateCharacterInsecure>) -> Result<()> {
        let character = &mut ctx.accounts.character;
        character.metadata = ctx.accounts.metadata_account.key();
        character.authority = ctx.accounts.authority.key();
        character.wins = 0;

        let cpi_context = CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadata {
                character: ctx.accounts.character.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_owned(),
                authority: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );

        let create_metadata_instruction = Instruction {
            program_id: cpi_context.program.key(),
            accounts: vec![
                AccountMeta::new_readonly(ctx.accounts.character.key(), false),
                AccountMeta::new(ctx.accounts.metadata_account.key(), false),
                AccountMeta::new(ctx.accounts.authority.key(), true),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ],
            data: anchor_sighash("create_metadata").into(),
        };

        invoke(
            &create_metadata_instruction,
            &cpi_context.accounts.to_account_infos(),
        )?;

        Ok(())
    }

    pub fn create_character_secure(ctx: Context<CreateCharacterSecure>) -> Result<()> {
        // Initialize character data
        let character = &mut ctx.accounts.character;
        character.metadata = ctx.accounts.metadata_account.key();
        character.authority = ctx.accounts.authority.key();
        character.wins = 0;

        // Prepare CPI context
        let cpi_context = CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadata {
                character: ctx.accounts.character.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_owned(),
                authority: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );

        // Perform CPI to create metadata
        create_metadata(cpi_context)?;

        Ok(())
    }

    pub fn battle_insecure(ctx: Context<BattleInsecure>) -> Result<()> {
        let player_one_metadata =
            Metadata::try_from_slice(&ctx.accounts.player_one_metadata.try_borrow_data()?)?;
        let player_two_metadata =
            Metadata::try_from_slice(&ctx.accounts.player_two_metadata.try_borrow_data()?)?;

        let player_one_health = player_one_metadata
            .health
            .saturating_sub(player_two_metadata.power);
        let player_two_health = player_two_metadata
            .health
            .saturating_sub(player_one_metadata.power);

        if player_one_health > player_two_health {
            ctx.accounts.player_one.wins += 1;
        } else {
            ctx.accounts.player_two.wins += 1;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateCharacterInsecure<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR_SIZE + Character::INIT_SPACE,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,
    #[account(
        mut,
        seeds = [character.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
    )]
    /// CHECK: This account will not be checked by anchor
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: This account will not be checked by anchor
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCharacterSecure<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR_SIZE + Character::INIT_SPACE,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,
    #[account(
        mut,
        seeds = [character.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
    )]
    /// CHECK: This account will not be checked by anchor
    pub metadata_account: AccountInfo<'info>,
    pub metadata_program: Program<'info, CharacterMetadata>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BattleInsecure<'info> {
    pub player_one: Account<'info, Character>,
    pub player_two: Account<'info, Character>,
    /// CHECK: This account will not be checked by anchor
    pub player_one_metadata: UncheckedAccount<'info>,
    /// CHECK: This account will not be checked by anchor
    pub player_two_metadata: UncheckedAccount<'info>,
    /// CHECK: This account will not be checked by anchor
    pub metadata_program: UncheckedAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Character {
    pub authority: Pubkey,
    pub metadata: Pubkey,
    pub wins: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Metadata {
    pub character: Pubkey,
    pub health: u8,
    pub power: u8,
}

fn anchor_sighash(name: &str) -> [u8; 8] {
    let namespace = "global";
    let preimage = format!("{}:{}", namespace, name);
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()[..8],
    );
    sighash
}
