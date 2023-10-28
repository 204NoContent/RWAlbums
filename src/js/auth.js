let authorizedTokenIds = Object.create(null);

const isAuthorizedTokenId = (tokenId) => {
  return (authorizedTokenIds[tokenId] && authorizedTokenIds[tokenId] > Date.now() / 1000);
};

module.exports.isAuthorized = (songs, indexSong, callback) => {
  let tokenId = songs[indexSong].tokenId;
  if (isAuthorizedTokenId(tokenId)) return callback(null);

  // placeholder
  return callback(null);
}