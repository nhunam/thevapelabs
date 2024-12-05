use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{Mint, Token},
};

use crate::{
    errors::MistTokenError,
    events::InitEvent,
    state::{Global, DEFAULT_DECIMALS},
};

#[event_cpi]
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = DEFAULT_DECIMALS,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority
    )]
    mint: Box<Account<'info, Mint>>,

    /// CHECK: Using seed to validate mint_authority account
    #[account(
        seeds=[b"mint-authority"],
        bump,
    )]
    mint_authority: AccountInfo<'info>,

    #[account(
        init,
        space = 8 + Global::LEN,
        seeds = [Global::SEED_PREFIX],
        bump,
        payer = authority,
    )]
    global: Box<Account<'info, Global>>,

    ///CHECK: Using seed to validate metadata account
    #[account(
        mut,
        seeds = [
            b"metadata", 
            token_metadata_program.key.as_ref(),
            mint.to_account_info().key.as_ref()
        ],
        seeds::program = token_metadata_program.key(),
        bump,
    )]
    metadata: AccountInfo<'info>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    token_metadata_program: Program<'info, Metadata>,
    rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitParams {
    pub verifier: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn initialize(ctx: Context<Initialize>, params: &InitParams) -> Result<()> {
    msg!("Initialize global params and create MIST token");

    let global = &mut ctx.accounts.global;

    require!(!global.initialized, MistTokenError::AlreadyInitialized);

    let seeds = &["mint-authority".as_bytes(), &[ctx.bumps.mint_authority]];
    let signer = [&seeds[..]];

    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.authority.to_account_info(),
                update_authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.mint_authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer,
        ),
        DataV2 {
            name: params.name.clone(),
            symbol: params.symbol.clone(),
            uri: params.uri.clone(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false,
        true,
        None,
    )?;

    global.authority = *ctx.accounts.authority.to_account_info().key;
    global.verifier = params.verifier.clone();
    global.initialized = true;

    emit_cpi!(InitEvent {
        mint: *ctx.accounts.mint.to_account_info().key,
        verifier: params.verifier,
        name: params.name.clone(),
        symbol: params.symbol.clone(),
        uri: params.uri.clone()
    });

    Ok(())
}
