require('dotenv').config();

const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('../config.json');
const { createContractInstance } = require('./contracts');
const { formatTokenBalance, formatEtherBalance } = require('./utils');
const getBlockNumberFTM = require('./getBlocknumberFTM');
const ProgressBar = require('progress');

async function getTokenBalancesAtBlock(addresses, blockHeight, provider) {

  const bar = new ProgressBar('Processing [:bar] :percent :etas', {
    total: addresses.length,
    width: 30,
    complete: '=',
    incomplete: ' ',
    renderThrottle: 100,
  });

  const contracts = {
    USDT: createContractInstance(config.tokensFTM.USDT, provider),
    USDC: createContractInstance(config.tokensFTM.USDC, provider),
  };

  const tokenBalances = {};

  for (const address of addresses) {
    const balancePromises = [
      ...Object.entries(contracts).map(async ([token, contract]) => {
        const balance = await contract.balanceOf(address, { blockTag: blockHeight }).then((b) => b.toString());
        return { token, balance };
      }),
      provider.getBalance(address, blockHeight).then((b) => b.toString()),
    ];

    const balances = await Promise.all(balancePromises);

    tokenBalances[address] = balances.reduce((acc, curr, index) => {
      if (index < balances.length - 1) {
        const { token, balance } = curr;
        let decimals;
        if (token === 'USDC' || token === 'POWR' || token === 'AXL') {
          decimals = 6;
        } else if (token === 'GALA' || token === 'CVC' || token === 'CRO') {
          decimals = 8;
        } else if (token === 'EVX') {
          decimals = 4;
        } else {
          decimals = 18;
        }
        acc[token] = formatTokenBalance(balance, decimals);
      } else {
        acc.FTM = formatEtherBalance(curr);
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

      const provider = new ethers.providers.StaticJsonRpcProvider(`https://rpc.ankr.com/fantom/${process.env.ANKR_API_KEY}/`);
      const blockInfo = await getBlockNumberFTM();
      const blockNumber = blockInfo.block;      
            
      const tokenBalances = await getTokenBalancesAtBlock(addresses, blockNumber, provider);

      const csvData = ['address,USDT,FTM,USDC'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.USDT},${balances.FTM},${balances.USDC}`)
      );

      fs.writeFileSync('data/FTM_Mainnet_Balances.csv', csvData.join('\n'));
      console.log('The balances have been written to FTM_Mainnet_Balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
