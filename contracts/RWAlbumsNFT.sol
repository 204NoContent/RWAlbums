// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from "./ERC721/ERC721.sol";

contract RWAlbumsNFT is ERC721("RWAlbums", "RWAS") {
    uint private _tokenCounter;
    address[] private _admins;
    mapping(address => bool) private _isAdmin;
    uint private _adminCut;
    uint private _adminBalance;

    constructor() {
        _admins.push(msg.sender);
        _isAdmin[msg.sender] = true;
        _adminCut = 2000 gwei;
    }

    struct Metadata {
        string artist;
        string album;
        uint duration;
        string[] songs;
    }

    struct PlayLock {
        address distributor;
        uint lockedUntil;
        uint playCost;
        string nonce;
    }

    mapping(uint => Metadata) private _metadata;
    mapping(uint => PlayLock) private _playLock;
    mapping(address => uint) private _balance;
    mapping(uint => uint) private _salePrice;

    event Mint(address indexed owner, uint indexed tokenId, Metadata metadata);
    event Play(address indexed owner, uint indexed tokenId, address indexed distributor, uint lockedUntil, uint playCost, string nonce);
    event ForSale(address indexed owner, uint indexed tokenId);

    modifier whenAdmin() {
        require(_isAdmin[msg.sender], "Unauthorized");
        _;
    }

    modifier whenOwned(uint tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    modifier whenNotOwned(uint tokenId) {
        require(ownerOf(tokenId) != msg.sender, "Already owned");
        _;
    }

    modifier whenNotPlayLocked(uint tokenId) {
        require(!_isPlayLocked(tokenId), "The token is locked");
        _;
    }

    modifier whenForSale(uint tokenId) {
        require(_isForSale(tokenId), "Not for sale");
        _;
    }

    function _isPlayLocked(uint tokenId) internal view returns (bool) {
        return block.timestamp < _playLock[tokenId].lockedUntil;
    }

    function _isForSale(uint tokenId) internal view returns (bool) {
        return _salePrice[tokenId] > 0;
    }

    function addAdmin(address newAdmin) external whenAdmin {
        _admins.push(newAdmin);
        _isAdmin[newAdmin] = true;
    }

    function removeAdmin(address admin) external whenAdmin {
        require(_admins.length > 1, "Contract must have at least one admin.");
        delete _isAdmin[admin];
        for (uint i = 0; i < _admins.length; i++) {
            if (_admins[i] == admin) {
                _admins[i] = _admins[_admins.length - 1];
                _admins.pop();
                break;
            }
        }
    }

    function getAdminCut() external view whenAdmin returns (uint) {
        return _adminCut;
    }

    function getAdminBalance() external view whenAdmin returns (uint) {
        return _adminBalance;
    }

    function getBalance() external view returns (uint) {
        return _balance[msg.sender];
    }

    function getMetadata(uint tokenId) external view returns (Metadata memory) {
        return _metadata[tokenId];
    }

    function getPlayLock(uint tokenId) external view returns (PlayLock memory) {
        return _playLock[tokenId];
    }

    function isPlayLocked(uint tokenId) external view returns (bool) {
        return _isPlayLocked(tokenId);
    }

    function getSalePrice(uint tokenId) external view returns (uint) {
        return _salePrice[tokenId];
    }

    function isForSale(uint tokenId) external view returns (bool) {
        return _isForSale(tokenId);
    }

    function setAdminCut(uint adminCut) external whenAdmin {
        _adminCut = adminCut * 1 gwei;
    }

    function listForSale(uint tokenId, uint price) external whenOwned(tokenId) {
        _salePrice[tokenId] = price;
        emit ForSale(msg.sender, tokenId);
    }

    function removeFromSale(uint tokenId) external whenOwned(tokenId) {
        delete _salePrice[tokenId];
    }

    function play(uint tokenId, uint playCost, address distributor, string calldata nonce) external payable whenOwned(tokenId) whenNotPlayLocked(tokenId) {
        require(playCost >= _adminCut, "PlayCost is too low");
        require(msg.value >= playCost, "Insufficient payment");
        _adminBalance += _adminCut;
        _balance[distributor] += playCost - _adminCut;
        if (msg.value > playCost) _balance[msg.sender] += msg.value - playCost;
        uint lockedUntil = block.timestamp + _metadata[tokenId].duration;
        _playLock[tokenId] = PlayLock({
            distributor: distributor,
            lockedUntil: lockedUntil,
            playCost: playCost,
            nonce: nonce
        });
        emit Play(msg.sender, tokenId, distributor, lockedUntil, playCost, nonce);
    }

    function purchase(uint tokenId) external payable whenForSale(tokenId) whenNotOwned(tokenId) {
        uint salePrice = _salePrice[tokenId];
        require(msg.value >= salePrice, "Insufficient payment");
        address owner = ownerOf(tokenId);
        _balance[owner] += msg.value;
        if (msg.value > salePrice) _balance[msg.sender] += msg.value - salePrice;
        delete _salePrice[tokenId];
        _safeTransfer(owner, msg.sender, tokenId);
    }

    function mint(address to, Metadata calldata metadata) external returns (uint tokenId) {
        tokenId = _tokenCounter + 1;
        _tokenCounter = tokenId;
        _metadata[tokenId] = metadata;
        _safeMint(to, tokenId);
        emit Mint(to, tokenId, metadata);
    }

}
