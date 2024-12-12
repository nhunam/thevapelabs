use anchor_lang::error_code;

#[error_code]
pub enum MistTokenError {
    #[msg("Global Already Initialized")]
    AlreadyInitialized,
    #[msg("Global Not Initialized")]
    NotInitialized,
    #[msg("Invalid Authority")]
    InvalidAuthority,
    #[msg("Invalid Amount")]
    InvalidAmount,
}
