use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("E7xcfMx5u8fGum2gobLLz5YqrVDQypmAyr3gCzx12c4P");

#[program]
pub mod misttoken {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitParams) -> Result<()> {
        initialize::initialize(ctx, &params)
    }

    pub fn claim(ctx: Context<Claim>, params: ClaimParams) -> Result<()> {
        claim::claim(ctx, &params)
    }
}
