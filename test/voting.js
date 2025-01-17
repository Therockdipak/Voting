const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", () => {
  let voting;
  let owner, voter1, voter2, candidate1, candidate2;

  beforeEach(async () => {
    [owner, voter1, voter2, candidate1, candidate2] = await ethers.getSigners();
    voting = await ethers.deployContract("Voting",[]);
    console.log("contract address is", voting.getAddress());
  });

  describe("Deployment", () => {
    it("Should set the deployer as the election commission", async () => {
      expect(await voting.electionCommission()).to.equal(owner.address);
    });
  });

  describe("Voter Registration", () => {
    it("Should register a voter", async () => {
      await voting.registerVoter(voter1.address, "Alice", 25);
      const voter = await voting.voters(voter1.address);
      expect(voter.voterAddress).to.equal(voter1.address);
      expect(voter.name).to.equal("Alice");
      expect(voter.age).to.equal(25);
      expect(voter.hasVoted).to.be.false;
    });

    it("Should not allow non-owners to register voters", async () => {
      await expect(
        voting.connect(voter1).registerVoter(voter2.address, "Bob", 22)
      ).to.be.revertedWith("Only election commission can call");
    });

    it("Should not allow duplicate voter registration", async () => {
      await voting.registerVoter(voter1.address, "Alice", 25);
      await expect(
        voting.registerVoter(voter1.address, "Alice", 25)
      ).to.be.revertedWith("Voter already registered");
    });

    it("Should not register voters under 18", async () => {
      await expect(
        voting.registerVoter(voter1.address, "Alice", 17)
      ).to.be.revertedWith("Age must be 18 or more");
    });
  });

  describe("Candidate Registration", () => {
    it("Should register a candidate", async () => {
      await voting.registerCandidate(candidate1.address, "John", 30);
      const candidate = await voting.candidates(0);
      expect(candidate.candidateAddress).to.equal(candidate1.address);
      expect(candidate.name).to.equal("John");
      expect(candidate.age).to.equal(30);
      expect(candidate.voteCount).to.equal(0);
    });

    it("Should not allow duplicate candidate registration", async () => {
      await voting.registerCandidate(candidate1.address, "John", 30);
      await expect(
        voting.registerCandidate(candidate1.address, "John", 30)
      ).to.be.revertedWith("Candidate already registered");
    });

    it("Should not register candidates under 18", async () => {
      await expect(
        voting.registerCandidate(candidate1.address, "John", 17)
      ).to.be.revertedWith("Age must be 18 or more");
    });
  });

  describe("Voting", () => {
    beforeEach(async () => {
      await voting.registerVoter(voter1.address, "Alice", 25);
      await voting.registerCandidate(candidate1.address, "John", 30);
    });

    it("Should allow a voter to vote for a candidate", async () => {
      await voting.connect(voter1).vote(0);
      const candidate = await voting.candidates(0);
      expect(candidate.voteCount).to.equal(1);
      const voter = await voting.voters(voter1.address);
      expect(voter.hasVoted).to.be.true;
    });

    it("Should not allow a voter to vote twice", async () => {
      await voting.connect(voter1).vote(0);
      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Already voted");
    });

    it("Should not allow unregistered voters to vote", async () => {
      await expect(voting.connect(voter2).vote(0)).to.be.revertedWith("Not a registered voter");
    });

    it("Should not allow voting for non-existent candidates", async () => {
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith("Invalid candidate ID");
    });
  });

  describe("Get Winner", () => {
    beforeEach(async () => {
      await voting.registerCandidate(candidate1.address, "John", 30);
      await voting.registerCandidate(candidate2.address, "Doe", 40);
      await voting.registerVoter(voter1.address, "Alice", 25);
      await voting.registerVoter(voter2.address, "Bob", 28);
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);
    });

    it("Should return the winner details", async () => {
      const [winner, name, votes] = await voting.getWinner();
      expect(winner).to.equal(candidate1.address);
      expect(name).to.equal("John");
      expect(votes).to.equal(1); // Ensure votes are correctly compared
    });
    
  });

  describe("Remove Candidate", () => {
    beforeEach(async () => {
      await voting.registerCandidate(candidate1.address, "John", 30);
    });

    it("Should remove a candidate", async () => {
      await voting.removeCandidate(0);
      const candidate = await voting.candidates(0);
      expect(candidate.candidateAddress).to.equal("0x0000000000000000000000000000000000000000");
    });    

    it("Should not allow non-owners to remove candidates", async () => {
      await expect(voting.connect(voter1).removeCandidate(0)).to.be.revertedWith(
        "Only election commission can call"
      );
    });

    it("Should not remove non-existent candidates", async () => {
      await voting.removeCandidate(0);
      await expect(voting.removeCandidate(0)).to.be.revertedWith("Candidate does not exist");
    });
  });
});
