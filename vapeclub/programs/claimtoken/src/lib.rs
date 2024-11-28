use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use anchor_lang::solana_program::hash::{hash};

declare_id!("Gw23UJ9YJXmsxS1JziWQZB7vjSLZGyCXrziFgCsaco61");

#[program]
mod claimtoken {
    use super::*;

    pub fn claim_token(ctx: Context<ClaimToken>, note: Vec<u8>, bump: u8, quantity: u64) -> Result<()> {
        let note_hash = hash(&note).to_bytes();

        let stored_hash = &ctx.accounts.data_account.note_hash;
        require!(note_hash == *stored_hash, CustomError::InvalidNoteHash);

        let payer_key = ctx.accounts.payer.key();
        // let bump = ctx.accounts.data_account.bump;
        let seeds = &[b"vapeclub", payer_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            quantity,
        )?;

        msg!("Token successfully claimed.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(
        mut,
        seeds = [b"vapeclub", payer.key().as_ref()],
        bump = data_account.bump,
    )]
    pub data_account: Account<'info, NoteData>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NoteData {
    pub note_hash: [u8; 32],
    pub bump: u8,
    pub payer: Pubkey,
}

#[error_code]
pub enum CustomError {
    #[msg("Invalid note hash.")]
    InvalidNoteHash,
}


