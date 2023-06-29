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
    USDT: createContractInstance(config.tokens.USDT, provider),
    USDC: createContractInstance(config.tokens.USDC, provider),
    MATIC: createContractInstance(config.tokens.MATIC, provider),
    LINK: createContractInstance(config.tokens.LINK, provider),
    SAND: createContractInstance(config.tokens.SAND, provider),
    AXS: createContractInstance(config.tokens.AXS, provider),
    ONE_INCH: createContractInstance(config.tokens.ONE_INCH, provider),
    AAVE: createContractInstance(config.tokens.AAVE, provider),
    ALPHA: createContractInstance(config.tokens.ALPHA, provider),
    COMP: createContractInstance(config.tokens.COMP, provider),
    CRV: createContractInstance(config.tokens.CRV, provider),
    DAI: createContractInstance(config.tokens.DAI, provider),
    DYDX: createContractInstance(config.tokens.DYDX, provider),
    GALA: createContractInstance(config.tokens.GALA, provider),
    GRT: createContractInstance(config.tokens.GRT, provider),
    MKR: createContractInstance(config.tokens.MKR, provider),
    OMG: createContractInstance(config.tokens.OMG, provider),
    SNX: createContractInstance(config.tokens.SNX, provider),
    SUSHI: createContractInstance(config.tokens.SUSHI, provider),
    UNI: createContractInstance(config.tokens.UNI, provider),
    YFI: createContractInstance(config.tokens.YFI, provider),
    BAL: createContractInstance(config.tokens.BAL, provider),
    GF: createContractInstance(config.tokens.GF, provider)
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

      const csvData = ['address,USDT,USDC,ETH,MATIC,LINK,SAND,AXS,ONE_INCH,AAVE,ALPHA,COMP,CRV,DAI,DYDX,GALA,GRT,MKR,OMG,SNX,SUSHI,UNI,YFI,BAL,GF'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.USDT},${balances.USDC},${balances.ETH},${balances.MATIC},${balances.LINK},${balances.SAND},${balances.AXS},${balances.ONE_INCH},${balances.AAVE},${balances.ALPHA},${balances.COMP},${balances.CRV},${balances.DAI},${balances.DYDX},${balances.GALA},${balances.GRT},${balances.MKR},${balances.OMG},${balances.SNX},${balances.SUSHI},${balances.UNI},${balances.YFI},${balances.BAL},${balances.GF}`
        )
    );    

      fs.writeFileSync('data/ETH_Mainnet_Balances_v2_xx2.csv', csvData.join('\n'));
      console.log('The balances have been written to ETH_Mainnet_Balances_v2_xx2.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
