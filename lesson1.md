# Lesson 1: Các khái niệm cơ bản trong Solana và cách tạo một project sử dụng anchor

![](https://solana-developer-content.vercel.app/assets/docs/core/transactions/sol-transfer.svg)

# Các thuật ngữ quan trọng trong solana
https://solana.com/docs/core/transactions#instruction

- `Account`: Dữ liệu trong solana được lưu trữ trong thuật ngữ `account` này. Có thể hiểu rằng nó là cấu trúc dữ liệu gồm 2 fields: `key` và `value`
![](https://solana-developer-content.vercel.app/assets/docs/core/accounts/accounts.svg)
- `Instructions`: Tập lệnh nằm trong một transaction
![](https://solana-developer-content.vercel.app/assets/docs/core/transactions/compact_array_of_ixs.png)
-  `Transaction`: thể hiện một 
- `PDA`: Là một địa chỉ kế thừa từ một địa chỉ khác. Nó có 2 mục đích: 
+ Kế thừa từ một địa chỉ khác 
+ Cho phép một chương trình có thể ký 
![](https://solana-developer-content.vercel.app/assets/docs/core/pda/pda.svg)
- `Cross Program Invocation` (CPI): Một chương gọi `instructions` của chương trình khác. 
![](https://solana-developer-content.vercel.app/assets/docs/core/cpi/cpi.svg)

- Program: Cũng là 1 loại account trong solana
Nó có các loại như : System Program, Custom Program
Chúng ta có một số các Program đã có sẵn của Solana, System Program, Token Program 
# Thực hành

- Cách để sử dụng CPI. Sử dụng hàm
```rust
pub fn invoke_signed(
    instruction: &Instruction,
    account_infos: &[AccountInfo<'_>],
    signers_seeds: &[&[&[u8]]]
) -> Result<(), ProgramError>
```
Các thông tin cần có:
- Thông tin tập lệnh 
- Thông tin các `AccountInfo` mà liên quan
- signers_seeds: Mảng của các chuỗi seeds mà để phần biệt duy nhất với . Ví dụ: Địa chỉ chương trình X + "thevapeclub" có thể đủ để tạo ra


# Tạo project sử dụng anchor

Anchor can help us to build smart-contract faster

## Cài đặt 

## High-level Overview

```rust
// use this import to gain access to common anchor features
use anchor_lang::prelude::*;
// declare an id for your program
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
mod hello_anchor {
    use super::*;
    pub fn set_data(ctx: Context<SetData>, data: u64) -> Result<()> {
        ctx.accounts.my_account.data = data;
        Ok(())
    }
}


#[account]
#[derive(Default)]
pub struct MyAccount {
    data: u64
}


#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>

```

Giải thích:
- `declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");` mô tả địa chỉ của smart contract. Nếu đều `111.....11` thì khi deploy nó sẽ thay thế
- Tên chương trình cần macro `#[program]
- Nền tảng là các `Account` nên chúng ta khai báo các account 

```rust
#[derive(Accounts)]
pub struct Initialize {}
```
`#[derive(Accounts)]` này sẽ chưa thông tin của các ngữ cảnh, bên cạnh địa chỉ của dữ liệu chúng ta ghi, ví dụ như người ký là ai, nó có sử dụng một số chương trình đặc biệt của SOLANA không(Eg: Token Program là một chương trình của Solana để tạo token. Chúng ta muốn tạo token thì cần sử dụng Token Program này để tạo, chứ không thể tự tạo)
- Ngoài ra trong cấu trúc này chứa các ràng buộc logic chúng ta. Ví dụ, người `mint` của dữ liệu `MyAccount` cần phải là người `mint` trong khi tạo ra Token này...
```rust
#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
    #[account(
        constraint = my_account.mint == token_account.mint,
        has_one = owner
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub owner: Signer<'info>
}
```
## Cách để tạo contraints trong khi khai báo account 
Tham khảo https://www.anchor-lang.com/docs/account-constraints
- Khi khai bao struct `Account` có một biến quan trong lưu trữ dữ liệu chúng ta cần lưu

```rust
   #[account(
        init,
        payer = user,
        space = 8 + 2 + 4 + 200 + 1, seeds = [b"user-stats", user.key().as_ref()], bump
    )]
    pub user_stats: Account<'info, UserStats>,
```
Đoan code `#[account(
        init,
        payer = user,
        space = 8 + 2 + 4 + 200 + 1, seeds = [b"user-stats", user.key().as_ref()], bump
    )]`
Sẽ cần khai báo ràng buộc để có thể xác định không gian địa chỉ chúng ta muốn lưu trữ trên Solana. Bởi vì chúng ta phải lưu và thuê không gian trên Solana.


## Cách gọi CPI trong anchor
```rust
use anchor_lang::prelude::*;
use puppet::cpi::accounts::SetData;
use puppet::program::Puppet;
use puppet::{self, Data};


declare_id!("HmbTLCmaGvZhKnn1Zfa1JVnp7vkMV4DYVxPLWBVoN65L");


#[program]
mod puppet_master {
    use super::*;
    pub fn pull_strings(ctx: Context<PullStrings>, data: u64) -> Result<()> {
        let cpi_program = ctx.accounts.puppet_program.to_account_info();
        let cpi_accounts = SetData {
            puppet: ctx.accounts.puppet.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        puppet::cpi::set_data(cpi_ctx, data)
    }
}


#[derive(Accounts)]
pub struct PullStrings<'info> {
    #[account(mut)]
    pub puppet: Account<'info, Data>,
    pub puppet_program: Program<'info, Puppet>,
}
```

- Khai báo chương trình khác trong `Accounts` của chúng ta `pub puppet_program: Program<'info, Puppet>,`
- Trong logic thân hàm chúng ta gọi ` let cpi_program = ctx.accounts.puppet_program.to_account_info();` để lấy địa chỉ của chương trình 
- Gọi hàm `CpiContext::new(cpi_program, cpi_accounts)` để sinh ra chỉ thị lệnh = `cpi_context`. Trong hàm này có 2 biến
+ `cpi_program`: Địa chỉ từ bước thứ 2
+ `cpi_accounts`: Dữ liệu của hàm chúng ta muốn gọi
- Sử dụng tên hàm <program_name>::cpi::<function_of_program_name>(cpi_context, data) 