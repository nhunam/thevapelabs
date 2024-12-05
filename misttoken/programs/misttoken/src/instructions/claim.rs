use anchor_lang::prelude::*;

use crate::state::Global;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        init,
        space = 8 + Global::LEN,
        seeds = [Global::SEED_PREFIX],
        bump,
        payer = authority,
    )]
    global: Box<Account<'info, Global>>,

    system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimParams {}

pub fn claim(_ctx: Context<Claim>, _params: &ClaimParams) -> Result<()> {
    msg!("Claim mist token");

    Ok(())
}
