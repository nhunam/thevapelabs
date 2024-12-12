use anchor_lang::prelude::*;

#[event]
pub struct InitEvent {
    pub mint: Pubkey,
    pub verifier: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[event]
pub struct ClaimEvent {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}
