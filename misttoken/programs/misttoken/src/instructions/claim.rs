use anchor_lang::prelude::*;
use anchor_spl::token::{self, mint_to, Burn, Mint, MintTo, Token, TokenAccount};

use crate::{errors::MistTokenError, events::ClaimEvent, state::Global};

#[event_cpi]
#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,
    /// CHECK: Using seed to validate mint_authority account
    #[account(
        seeds=[b"mint-authority"],
        bump,
    )]
    pub mint_authority: AccountInfo<'info>,

    #[account()]
    global: Box<Account<'info, Global>>,

    #[account(
        mut,
        constraint = user_token_account.mint == mint.key(),
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimParams {
    pub amount: u64,
    pub is_burn: bool,
}

pub fn claim(ctx: Context<Claim>, params: &ClaimParams) -> Result<()> {
    msg!("Claim mist token");

    require!(
        ctx.accounts.global.initialized,
        MistTokenError::NotInitialized
    );

    require!(
        ctx.accounts.signer.to_account_info().key == &ctx.accounts.global.verifier,
        MistTokenError::InvalidAuthority
    );

    require!(params.amount > 0, MistTokenError::InvalidAmount);

    let seeds = &["mint-authority".as_bytes(), &[ctx.bumps.mint_authority]];
    let signer = [&seeds[..]];

    if !params.is_burn {
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint_authority.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            params.amount,
        )?;
        emit_cpi!(ClaimEvent {
            mint: *ctx.accounts.mint.to_account_info().key,
            user: *ctx.accounts.user_token_account.to_account_info().owner,
            amount: params.amount,
            is_burn: false,
        });
    } else {
        require!(
            ctx.accounts.user_token_account.amount >= params.amount,
            MistTokenError::NotEnoughBalance
        );
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    authority: ctx.accounts.user.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            params.amount,
        )?;
        emit_cpi!(ClaimEvent {
            mint: *ctx.accounts.mint.to_account_info().key,
            user: *ctx.accounts.user_token_account.to_account_info().owner,
            amount: params.amount,
            is_burn: true,
        });
    }
    Ok(())
}
