# Arbitrary CPI Project

This project demonstrates an insecure Cross-Program Invocation (CPI) vulnerability in Solana programs using Anchor. Example code from the arbitrary CPI lesson from the Solana Program Security course.

## Prerequisites

- Rust and Cargo
- Solana CLI tools
- Anchor CLI
- Node.js and Yarn

## Setup

1. Clone the repository

```bash
   git clone <repository-url>
   cd <project-directory>
```

2. Install dependencies:

```bash
   yarn install
```

3. Build the Anchor project

```bash
   anchor build
```

4. Sync the program ID:

```bash
  anchor keys sync
```

## Running Tests

```bash
anchor test
```

This will execute the test suite, including the "arbitrary-cpi" test that demonstrates how an attacker can exploit insecure instructions to win every time.

## Test Structure

The main test file is located at `tests/arbitrary-cpi.ts`. It includes:

- Setup of gameplay, metadata, and fake metadata programs
- Creation of player and attacker accounts
- Demonstration of how an attacker can use a fake metadata program to gain an unfair advantage

Utility functions are in `tests/utils/utils.ts`, including functions for getting PDAs.

## Notes

- Ensure your Solana validator is running locally before running tests.
- The test uses the `@solana-developers/helpers` package for airdropping SOL to test accounts.
- If you encounter any issues, make sure your Anchor.toml and Cargo.toml files are correctly configured for your project.
