// use crate::errors::ErrorCode;
// use anchor_lang::prelude::*;
// use anchor_split::token::{self, Transfer};
// use solana_program::program::invoke_signed;
// use spl_token::instruction::{burn_checked, close_account, mint_to, set_authority, AuthorityType};

// pub fn transfer_from_owner_to_user<'info>(
//     authority: &Signer<'info>,
//     token_program: &Program<'info, Token>,
//     token_owner_account: &AccountInfo<'info, TokenAccount>,
//     token_user_account: &AccountInfo<'info, TokenAccount>,
//     amount: u64,
// ) -> Result<()> {
//     token::transfer(
//         CpiContext::new(
//             token_program.to_account_info(),
//             Transfer {
//                 from: token_owner_account.to_account_info(),
//                 to: token_user_account.to_account_info(),
//                 authority: authority.to_account_info(),
//             },
//         ),
//         amount,
//     )
// }