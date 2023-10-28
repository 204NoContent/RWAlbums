const { Web3 } = require('web3');
const abi = require('./abi.js');
const contractAddress = '';
const distributorAddress = '';
const playCost = 4000000000000; // 4000 gwei
const gas = 300000;

let web3;
let account;
let contract;
let authorizedTokenIds = Object.create(null);

const isAuthorizedTokenId = (tokenId) => {
  return (authorizedTokenIds[tokenId] && authorizedTokenIds[tokenId] > Date.now() / 1000);
};

if (window.ethereum) {
  window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
    account = accounts[0];
    web3 = new Web3(window.ethereum);
    web3.eth.Contract.handleRevert = true;
    contract = new web3.eth.Contract(abi, contractAddress, { from: account });
  }).catch(err => {
    if (err.code === 4001) {
      // User rejected request
    }
    console.error(err);
  });
}

const ownerOf = (tokenId, callback) => {
  contract.methods.ownerOf(tokenId).call({ from: account }).then(receipt => {
    callback(null, receipt);
  }).catch(callback);
};

const getPlayLock = (tokenId, callback) => {
  contract.methods.getPlayLock(tokenId).call({ from: account }).then(receipt => {
    callback(null, receipt);
  }).catch(callback);
};

const isValidPlayLock = playLock => {
  return (
    playLock.owner.toLowerCase() === account.toLowerCase()
    && playLock.distributor.toLowerCase() === distributorAddress.toLowerCase()
    && playLock.lockedUntil > Date.now() / 1000
    && playLock.playCost === playCost
  );
};

module.exports.isAuthorized = (songs, indexSong, callback) => {
  let tokenId = songs[indexSong].tokenId;
  if (isAuthorizedTokenId(tokenId)) return callback(null);

  ownerOf(tokenId, (err, owner) => {
    if (err) return callback(err);
    if (owner.toLowerCase() === account.toLowerCase()) {
      getPlayLock(tokenId, (err, playLock) => {
        if (err) return callback(err);
        if (isValidPlayLock(playLock)) {
          authorizedTokenIds[tokenId] = Number(playLock.lockedUntil);
          return callback(null);
        }
        // call the play method
      });
    } else {
      // check if the album is available for purchase
    }
  });
}