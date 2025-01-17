// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    address public electionCommission;
    uint256 public voterCount;
    uint256 public candidateCount;

    struct Voter {
        address voterAddress;
        string name;
        uint256 age;
        bool hasVoted;
    }

    struct Candidate {
        address candidateAddress;
        string name;
        uint256 age;
        uint256 voteCount;
    }

    modifier onlyOwner() {
        require(msg.sender == electionCommission, "Only election commission can call");
        _;
    }

    modifier onlyVoter() {
        require(voters[msg.sender].voterAddress != address(0), "Not a registered voter");
        _;
    }

    mapping(address => Voter) public voters;
    Candidate[] public candidates;

    event VoterRegistered(address voterAddress, string name, uint256 age);
    event CandidateRegistered(address candidateAddress, string name, uint256 age);
    event Voted(uint256 candidateId, address voter);
    event CandidateRemoved(uint256 candidateId, address candidateAddress);

    constructor() {
        electionCommission = msg.sender;
    }

    function registerVoter(address voterAddress, string memory name_, uint256 age_) public onlyOwner {
        require(age_ >= 18, "Age must be 18 or more");
        require(voters[voterAddress].voterAddress == address(0), "Voter already registered");

        voters[voterAddress] = Voter(voterAddress, name_, age_, false);
        voterCount++;

        emit VoterRegistered(voterAddress, name_, age_);
    }

    function registerCandidate(address candidateAddress, string memory name_, uint256 age_) public onlyOwner {
        require(age_ >= 18, "Age must be 18 or more");
        for (uint256 i = 0; i < candidates.length; i++) {
            require(candidates[i].candidateAddress != candidateAddress, "Candidate already registered");
        }

        candidates.push(Candidate(candidateAddress, name_, age_, 0));
        candidateCount++;

        emit CandidateRegistered(candidateAddress, name_, age_);
    }

    function vote(uint256 candidateId) public onlyVoter {
        require(candidateId < candidates.length, "Invalid candidate ID");
        require(!voters[msg.sender].hasVoted, "Already voted");

        candidates[candidateId].voteCount++;
        voters[msg.sender].hasVoted = true;

        emit Voted(candidateId, msg.sender);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getWinner() public view returns (address winner, string memory name, uint256 votes) {
         uint256 maxVotes = 0;
        uint256 winnerIndex = 0;

       // Ensure there are candidates
       require(candidates.length > 0, "No candidates available");

         for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
               maxVotes = candidates[i].voteCount;
               winnerIndex = i;
             }
         }

         Candidate memory winningCandidate = candidates[winnerIndex];
         return (winningCandidate.candidateAddress, winningCandidate.name, winningCandidate.voteCount);
    }


    function removeCandidate(uint256 candidateId) public onlyOwner {
        require(candidateId < candidates.length, "Invalid candidate ID");
        require(candidates[candidateId].candidateAddress != address(0), "Candidate does not exist");

        // Remove the candidate by setting their address to a zero address
         candidates[candidateId].candidateAddress = address(0);
         candidates[candidateId].name = "";
         candidates[candidateId].age = 0;
         candidates[candidateId].voteCount = 0;

       emit CandidateRemoved(candidateId, candidates[candidateId].candidateAddress);
    }

}
