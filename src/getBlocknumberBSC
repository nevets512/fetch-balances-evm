require('dotenv').config();
const EthDater = require('ethereum-block-by-date');
const { ethers } = require('ethers');

const provider = new ethers.providers.StaticJsonRpcProvider(`https://rpc.ankr.com/bsc/${process.env.ANKR_API_KEY}/`);

const dater = new EthDater(provider);

const getBlockNumberBSC = async () => {
    let block = await dater.getDate('2022-12-31T16:59:59Z');
    return block;
  };
  
  module.exports = getBlockNumberBSC;

// Uncomment this section if this script will be run as a standalone function  
// const main = async () => {
//   let block = await dater.getDate('2022-12-31T16:59:59Z');
//   console.log(block);
// };

// main();
