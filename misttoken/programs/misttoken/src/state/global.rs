use anchor_lang::prelude::*;

pub const DEFAULT_DECIMALS: u8 = 6;

#[account]
#[derive(Default, Debug)]
pub struct Global {
    pub authority: Pubkey,
    pub initialized: bool,
    pub verifier: Pubkey,
    pub token_address: Pubkey,
}

impl Global {
    pub const LEN: usize = 8 + std::mem::size_of::<Global>();
    pub const SEED_PREFIX: &'static [u8; 6] = b"global";
}
