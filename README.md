# Ethereum Token Balances Retriever

This is a Node.js script that uses the ethers.js library to interact with the Ethereum blockchain. It retrieves token balances for a list of Ethereum addresses for a list of specified tokens and writes these balances to a CSV file. This script is particularly useful for anyone needing to track balances for multiple addresses and tokens on the Ethereum blockchain.

## Prerequisites

Before running this script, ensure that you have Node.js installed in your environment. You will also need the following Node.js packages:

- `ethers`: Ethereum blockchain interaction
- `dotenv`: Environment variable handler
- `csv-parser`: CSV parsing
- `fs`: File system interaction
- `progress`: Progress bar creation

Install these packages using npm:

```
npm install ethers dotenv csv-parser fs progress
```

You will also need an Alchemy API key, which is used to interact with the Ethereum blockchain. Sign up for an account on [Alchemy's website](https://www.alchemy.com/) to get your key.

## Configuration

This script requires a `config.json` file in the root directory that should contain contract addresses for the tokens you're interested in. Here is an example format:

```json
{
  "tokens": {
    "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ...
  }
}
```

Additionally, the script uses a `.env` file to load the Alchemy API key. The `.env` file should look like this:

```env
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

## Input

The input for this script is a CSV file named `addresses.csv` located in a `data` directory. Each line in the file should be a valid Ethereum address.

Example:

```
address
0xBc5809a7D398512b8bE44C439e05C5B3259aeC8B
...
```

## Output

This script writes the output to a CSV file named `ETH_Mainnet_Balances.csv` in the `data` directory. The file contains balances for all the tokens and addresses specified.

Example:

```
address,USDT,USDC,ETH,...
0xBc5809a7D398512b8bE44C439e05C5B3259aeC8B,100,200,0.01,...
...
```

## Running the Script

To run the script, use the following command:

```
node your_script_name.js
```

Replace `your_script_name.js` with the filename of this script.

## Errors

If any errors occur while running the script, they will be printed to the console and the script will exit with a status code of 1.

## Future Improvements

This script could be extended to support different blockchains, additional tokens, or more input/output options.