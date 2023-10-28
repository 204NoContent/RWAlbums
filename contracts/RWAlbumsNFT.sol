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

    modifier whenAdmin() {
        require(_isAdmin[msg.sender], "Unauthorized");
        _;
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

    function setAdminCut(uint adminCut) external whenAdmin {
        _adminCut = adminCut * 1 gwei;
    }

    function getAdminBalance() external view whenAdmin returns (uint) {
        return _adminBalance;
    }
}
