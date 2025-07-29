// test/ethers-test.js
const { ethers } = require("hardhat");

describe("Ethers sanity check", function () {
  it("parseEther works", function () {
    const val = ethers.parseEther("1");
    console.log(val.toString());
  });
});
