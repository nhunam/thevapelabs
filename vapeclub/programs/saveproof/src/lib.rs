use anchor_lang::prelude::*;
use light_sdk::proof::CompressedProof;
use light_hasher::sha256::Sha256;
use light_hasher::Hasher;

declare_id!("PaBmvNkxYiNJRu5QDFVoRGRCfp4BNE5vfaFDSipSZQY");

#[program]
mod submit_note {
    use super::*;

    pub fn submit_proof(ctx: Context<SubmitProof>, proof: Vec<u8>, account_id: Pubkey) -> Result<()> {
        // hash
        let mut a = [0u8; 32];
        let mut b = [0u8; 64];
        let mut c = [0u8; 32];

        a.copy_from_slice(&proof[0..32]);
        b.copy_from_slice(&proof[32..96]);
        c.copy_from_slice(&proof[96..128]);
        let compressed_proof = CompressedProof{a, b, c};
        let proof_hash = Sha256::hashv(&[&compressed_proof.a, &compressed_proof.b, &compressed_proof.c])
            .map_err(|_| error!(ErrorCode::HashingFailed))?;

        // let (proof_hash, error) = match result {
        //     Ok(proof_hash) => (Some(proof_hash), None),
        //     Err(err) => (None, Some(err))
        // };

        // save hashs
        let proof_data = &mut ctx.accounts.proof_data;
        proof_data.proof_hash = proof_hash;
        proof_data.account_id = account_id;
        proof_data.timestamp = Clock::get()?.unix_timestamp;

        msg!("Proof submitted!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"vapeclub", payer.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 8 // 8 bytes for discriminator, 32 bytes for hash, 1 byte for bump
    )]
    pub proof_data: Account<'info, ProofData>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProofData {
    pub proof_hash: [u8; 32],
    pub timestamp: i64,
    pub account_id: Pubkey,           
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid account ID")]
    InvalidAccount,
    #[msg("Hashing failed")]
    HashingFailed
}
