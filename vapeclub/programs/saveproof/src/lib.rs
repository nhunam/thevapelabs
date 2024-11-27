use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

declare_id!("4jr2thpc2ogDAgra58QhnyvXaXZGZzbEpCWxPf3TsuGA");

#[program]
mod submit_note {
    use super::*;

    pub fn submit_note(ctx: Context<SubmitNote>, note: Vec<u8>, bump: u8) -> Result<()> {
        // hash
        let note_hash = hash(&note).to_bytes();

        // save hash
        let data_account = &mut ctx.accounts.data_account;
        data_account.note_hash = note_hash;
        data_account.bump = bump;

        msg!("Note hash successfully stored.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SubmitNote<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"thevapeclub", payer.key().as_ref()],
        bump,
        space = 8 + 32 + 1 // 8 bytes for discriminator, 32 bytes for hash, 1 byte for bump
    )]
    pub data_account: Account<'info, NoteData>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NoteData {
    pub note_hash: [u8; 32],
    pub bump: u8,           
}
