require('dotenv').config();

const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('../config.json');
const { createContractInstance } = require('./contracts');
const { formatTokenBalance, formatEtherBalance } = require('./utils');
const getBlockNumber = require('./getBlocknumber');
const ProgressBar = require('progress');

// Function for sleep, pausing execution
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getTokenBalancesAtBlock(addresses, blockHeight, provider) {
  const bar = new ProgressBar('Processing [:bar] :percent :etas', {
    total: addresses.length,
    width: 30,
    complete: '=',
    incomplete: ' ',
    renderThrottle: 100,
  });

  const contracts = {
    BNT: createContractInstance(config.tokens.BNT, provider),
    REN: createContractInstance(config.tokens.REN, provider),
    BUSD: createContractInstance(config.tokens.BUSD, provider),
    LPT: createContractInstance(config.tokens.LPT, provider),
    GMT: createContractInstance(config.tokens.GMT, provider),
    USDP: createContractInstance(config.tokens.USDP, provider),
    SHIB: createContractInstance(config.tokens.SHIB, provider)
  };

  const tokenBalances = {};

  for (const address of addresses) {
    const balancePromises = [
      ...Object.entries(contracts).map(async ([token, contract]) => {
        let balance;
        while (true) {
          try {
            balance = await contract.balanceOf(address, { blockTag: blockHeight }).then((b) => b.toString());
            break;
          } catch (error) {
            console.log(`Error fetching ${token} balance for ${address} at block ${blockHeight}: ${error.message}`);
            console.log('Pausing for 5 seconds before retrying...');
            await sleep(5000);
          }
        }
        return { token, balance };
      }),
      (async () => {
        let balance;
        while (true) {
          try {
            balance = await provider.getBalance(address, blockHeight).then((b) => b.toString());
            break;
          } catch (error) {
            console.log(`Error fetching ETH balance for ${address} at block ${blockHeight}: ${error.message}`);
            console.log('Pausing for 5 seconds before retrying...');
            await sleep(5000);
          }
        }
        return balance;
      })()
    ];

    const balances = await Promise.all(balancePromises);

    tokenBalances[address] = balances.reduce((acc, curr, index) => {
      if (index < balances.length - 1) {
        const { token, balance } = curr;
        let decimals;
        if (token === 'USDT' || token === 'USDC') {
          decimals = 6;
        } else {
          decimals = 18;
        }
        acc[token] = formatTokenBalance(balance, decimals);
      } else {
        acc.ETH = formatEtherBalance(curr);
      }
      return acc;
    }, {});

    // Update the progress bar
    bar.tick();
  }

  return tokenBalances;
}

async function main() {
  const addresses = [];

  fs.createReadStream('data/addresses.csv')
    .pipe(csv())
    .on('data', (row) => {
      addresses.push(row.address.toLowerCase());
    })
    .on('end', async () => {
      console.log(`Retrieving balances for ${addresses.length} addresses...`);

      const provider = new ethers.providers.StaticJsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`);
      const blockInfo = await getBlockNumber();
      const blockNumber = blockInfo.block;

      const tokenBalances = await getTokenBalancesAtBlock(addresses, blockNumber, provider);

      const csvData = ['address,BNT,REN,BUSD,LPT,GMT,USDP,SHIB'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.BNT},${balances.REN},${balances.BUSD},${balances.LPT},${balances.GMT},${balances.USDP},${balances.SHIB}`
        )
    );    

      fs.writeFileSync('data/ETH_Mainnet_Balances_v3.csv', csvData.join('\n'));
      console.log('The balances have been written to ETH_Mainnet_Balances_v3.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
