const { Web3 } = require('web3');
const abi = require('./abi.js');
const contractAddress = '0xAeC35921EDc95dEA5D881C6051BaF1EAA24640AA';
const distributorAddress = '0x61bF78dE3948Cabe342343919c895319871d004e';
const playCost = 4000000000000; // 4000 gwei
const gas = 300000;
const gasPrice = 50000000;

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
    && Number(playLock.playCost) === playCost
  );
};

const play = (tokenId, callback) => {
  const encodedPlay = contract.methods.play(tokenId, playCost, distributorAddress).encodeABI();
  web3.eth.sendTransaction({
    from: account,
    to: contractAddress,
    gas: gas,
    gasPrice: gasPrice,
    value: playCost,
    data: encodedPlay
  }).then(receipt => {
    console.log('!!! Play album:', tokenId);
    callback(null);
  }).catch(callback);
};

const pollPlayLock = (tokenId, callback, attemptsRemaining = 30) => {
  if (attemptsRemaining < 1) return callback(new Error('Timeout'));
  console.log('Polling playlock. Attempts remaining:', attemptsRemaining);
  getPlayLock(tokenId, (err, playLock) => {
    if (err) return callback(err);
    if (isValidPlayLock(playLock)) {
      authorizedTokenIds[tokenId] = Number(playLock.lockedUntil);
      return callback(null);
    }
    window.setTimeout(pollPlayLock, 1000, tokenId, callback, attemptsRemaining - 1);
  });
};

const getSalePrice = (tokenId, callback) => {
  contract.methods.getSalePrice(tokenId).call({ from: account }).then(receipt => {
    callback(null, Number(receipt));
  }).catch(callback);
};

const getMetadata = (tokenId, callback) => {
  contract.methods.getMetadata(tokenId).call({ from: account }).then(receipt => {
    callback(null, receipt);
  }).catch(callback);
};

const presentPurchaseModal = (salePrice, metadata, callback) => {
  const message = `\nYou do not own ${metadata.artist} - ${metadata.album}.\n\nWould you like to purchase it for ${salePrice / 1e9} gwei ($1.99)?\n`;
  callback(null, confirm(message));
};

const purchase = (tokenId, value, callback) => {
  const encodedPurchase = contract.methods.purchase(tokenId).encodeABI();
  web3.eth.sendTransaction({
    from: account,
    to: contractAddress,
    gas: gas,
    gasPrice: gasPrice,
    value: value,
    data: encodedPurchase
  }).then(receipt => {
    console.log('$$$ Purchased album:', tokenId);
    callback(null);
  }).catch(callback);
};

const presentSuccessModal = (salePrice, metadata) => {
  const message = `\nYou successfully purchased ${metadata.artist} - ${metadata.album}.\n\nYou can now play the album!\n`;
  alert(message);
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
        play(tokenId, err => {
          if (err) return callback(err);
          pollPlayLock(tokenId, callback);
        });
      });
    } else {
      getSalePrice(tokenId, (err, salePrice) => {
        if (err) return callback(err);
        if (salePrice === 0) return callback(new Error('Not for sale'));
        getMetadata(tokenId, (err, metadata) => {
          if (err) return callback(err);
          presentPurchaseModal(salePrice, metadata, (err, shouldPurchase) => {
            if (err) return callback(err);
            if (!shouldPurchase) return callback(new Error('Purchase declined'));
            purchase(tokenId, salePrice, err => {
              if (err) return callback(err);
              presentSuccessModal(salePrice, metadata);
            });
          });
        });
      });
    }
  });
}
