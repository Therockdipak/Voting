import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './contract/Voting.json';
import './App.css';

const contractAddress = '0xD55748f4f841D0594bf227fb2c5056D0C82737e8';
const contractABI = abi.abi;

function App() {
  const [candidates, setCandidates] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [candidateData, setCandidateData] = useState({ address: '', name: '', age: '' });
  const [voterData, setVoterData] = useState({ address: '', name: '', age: '' });
  const [winner, setWinner] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('No crypto wallet found');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.error(err.message);
      alert('Please install a crypto wallet like MetaMask');
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  };

  const fetchCandidates = async () => {
    try {
      const contract = await getContract();
      const candidateCount = await contract.candidateCount();
      const candidatesList = [];
      for (let i = 0; i < candidateCount; i++) {
        const candidate = await contract.candidates(i);
        if (candidate.candidateAddress !== '0x0000000000000000000000000000000000000000') {
          candidatesList.push({
            id: i,
            address: candidate.candidateAddress,
            name: candidate.name,
            age: candidate.age,
            votes: candidate.voteCount.toString(),
          });
        }
      }
      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const checkWinner = async () => {
    try {
      const contract = await getContract();
      const winnerData = await contract.getWinner();
      setWinner({
        address: winnerData[0],
        name: winnerData[1],
        votes: parseInt(winnerData[2] || 0),
      });
      alert('Winner fetched successfully!');
    } catch (error) {
      console.error('Error fetching winner:', error);
      alert('Failed to fetch winner.');
    }
  };

  const handleInputChange = (e, setter, field) => {
    setter((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addCandidate = async () => {
    const { address, name, age } = candidateData;
    if (!address || !name || !age) {
      alert('Please fill in all fields for the candidate.');
      return;
    }
    try {
      const contract = await getContract();
      const tx = await contract.registerCandidate(address, name, parseInt(age));
      await tx.wait();
      fetchCandidates();
      alert('Candidate added successfully!');
      setCandidateData({ address: '', name: '', age: '' });
    } catch (err) {
      console.error('Error adding candidate:', err.message);
    }
  };

  const registerVoter = async () => {
    const { address, name, age } = voterData;
    if (!address || !age || !name) {
      alert('Please fill in all fields.');
      return;
    }
    try {
      const contract = await getContract();
      const tx = await contract.registerVoter(address, name, parseInt(age));
      await tx.wait();
      alert('Voter registered successfully!');
      setVoterData({ address: '', name: '', age: '' });
    } catch (err) {
      console.error('Error registering voter:', err.message);
    }
  };

  const vote = async (candidateId) => {
    if (!currentAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      const contract = await getContract();
      setLoading(true);
      const tx = await contract.vote(candidateId);
      await tx.wait();
      alert('Vote successfully cast!');
      setLoading(false);
      fetchCandidates();
    } catch (err) {
      console.error('Error casting vote:', err.message);
      alert('Failed to cast vote. Please try again.');
      setLoading(false);
    }
  };

  const removeCandidate = async (candidateId) => {
    try {
      const contract = await getContract();
      setLoading(true);
      const tx = await contract.removeCandidate(candidateId);
      await tx.wait();
      alert('Candidate removed successfully!');
      setLoading(false);
      fetchCandidates();
    } catch (err) {
      console.error('Error removing candidate:', err.message);
      alert('Failed to remove candidate. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAccount) fetchCandidates();
  }, [currentAccount]);

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-lg">
          Decentralized Voting System
        </h1>
        {!currentAccount ? (
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full">
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Register Voter</h2>
              <input
                type="text"
                placeholder="Voter Name"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.name}
                onChange={(e) => handleInputChange(e, setVoterData, 'name')}
              />
              <input
                type="text"
                placeholder="Voter Address"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.address}
                onChange={(e) => handleInputChange(e, setVoterData, 'address')}
              />
              <input
                type="number"
                placeholder="Age"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.age}
                onChange={(e) => handleInputChange(e, setVoterData, 'age')}
              />
              <button
                onClick={registerVoter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full">
                Register Voter
              </button>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Add Candidate</h2>
              <input
                type="text"
                placeholder="Candidate Name"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.name}
                onChange={(e) => handleInputChange(e, setCandidateData, 'name')}
              />
              <input
                type="text"
                placeholder="Candidate Address"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.address}
                onChange={(e) => handleInputChange(e, setCandidateData, 'address')}
              />
              <input
                type="number"
                placeholder="Age"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.age}
                onChange={(e) => handleInputChange(e, setCandidateData, 'age')}
              />
              <button
                onClick={addCandidate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full">
                Add Candidate
              </button>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Vote</h2>
              <ul>
                {candidates.map((candidate) => (
                  <li key={candidate.id} className="mb-2">
                    <div>
                      <strong>{candidate.name}</strong> (Votes: {candidate.votes})
                    </div>
                    <button
                      onClick={() => vote(candidate.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Vote
                    </button>
                    <button
                      onClick={() => removeCandidate(candidate.id)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Winner</h2>
              {winner ? (
                <div>
                  <strong>Name:</strong> {winner.name} <br />
                  <strong>Votes:</strong> {winner.votes}
                </div>
              ) : (
                <button
                  onClick={checkWinner}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 w-full">
                  Check Winner
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;