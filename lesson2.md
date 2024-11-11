# L2: SPL và Tạo token trong Solana

# Phân tích

- Một token khi tạo ra thường sẽ có 2 bước
+ Khởi tạo: Thông tin về account sẽ chứa nó: Tên Token là gì, số lượng cung, ai được thao tấc với nó
+ Mint tới một ví một lần, hay mint nhiều lần, ai được quyền mint
+ Có thể burn nó nếu cần

Để tạo token như vậy chúng ta cần tạo ra một `program` (cũng là một account) và sau đó CPI tới token program của Solana để nó tạo ra data trên blockchain là chúng ta sẽ có một token

# Practice


# Hàm khởi tạo 
- Tưởng tượng chúng ta có một cấu trúc như sau

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}
```

Sử dụng thông tin này để gọi sang `CPI Token Program` để khởi tạo một token 

- Hàm khởi tạo
Note: 
+ Khi khởi tạo chúng ta mất chút tiền cho người ký. Nên cần có `payer` ở đây.
+ Định nghĩa ai là người `minter`. Thường là người `payer`
+ Thông tin về: Số lượng, symbol, url

```rust

 pub fn init_token(ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
        let seeds = &["vapeclub".as_bytes(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        let token_data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer
        );

        create_metadata_accounts_v3(
            metadata_ctx,
            token_data,
            false,
            true,
            None,
        )?;

        msg!("Token mint created successfully.");

        Ok(())
    }
```
