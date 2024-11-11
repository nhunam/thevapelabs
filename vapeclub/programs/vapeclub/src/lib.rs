use anchor_spl::token::Token;

use anchor_lang::prelude::*;

mod errors;
mod util;
declare_id!("qSSQdrgbWD7cXNE4S25Gbadkr6Yd878c4vJ7bWApxyD");

#[program]
pub mod vapeclub {
    use super::*;

    pub fn init_vape_account(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        let vape = &mut ctx.accounts.vape_data;
        vape.authority = ctx.accounts.signer.key();
        vape.puff_count = 0;
        vape.time_consume   = 0.0;
        vape.reward = 0;
        vape.is_validated = false;
        // vape.bump = vape.authority;
        vape.estimate_nicotin_consume = 0.0;
        vape.time_submit = 0.0;
        Ok(())
    }
    pub fn update_data(ctx: Context<UpdateData>, new_data: VapeData) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);

        let vape = &mut ctx.accounts.vape_data;
        vape.puff_count += 1;
        vape.reward += new_data.reward;
        Ok(())
    }
    pub fn claim_reward(_ctx: Context<ClaimReward>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 32 + 8 + 8 + 8 + 8 + 8 + 1)]
    pub vape_data: Account<'info, VapeData>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(init, payer = signer, space = 8)]
    pub reward_data: Account<'info, Reward>,

    #[account(mut)]
   pub signer: Signer<'info>,

   pub token_program: Program<'info, Token>,
   pub system_program: Program<'info, System>,
}
#[account]
pub struct VapeData {
    pub authority: Pubkey,
    pub puff_count: i64,
    pub time_consume: f64,
    pub time_submit: f64, 
    pub estimate_nicotin_consume: f64,
    pub is_validated: bool,
    pub reward: u64,
    pub bump: u8,
}
#[derive(Accounts)]
pub struct UpdateData<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut, seeds=[ b"vapeclub", signer.key().as_ref()], bump=vape_data.bump)]
    pub vape_data: Account<'info, VapeData>,
}


#[account]
pub struct Reward {
    pub authority: Pubkey,
    pub reward: u64,
}