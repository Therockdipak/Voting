import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion'; // Import Framer Motion
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
      <motion.div
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-lg">
          Decentralized Voting System
        </h1>
        {!currentAccount ? (
          <motion.button
            onClick={connectWallet}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            Connect Wallet
          </motion.button>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Register Voter</h2>
              <motion.input
                type="text"
                placeholder="Voter Name"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.name}
                onChange={(e) => handleInputChange(e, setVoterData, 'name')}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <motion.input
                type="text"
                placeholder="Voter Address"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.address}
                onChange={(e) => handleInputChange(e, setVoterData, 'address')}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <motion.input
                type="number"
                placeholder="Age"
                className="border rounded-lg p-2 w-full mb-2"
                value={voterData.age}
                onChange={(e) => handleInputChange(e, setVoterData, 'age')}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <motion.button
                onClick={registerVoter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                whileTap={{ scale: 0.95 }}
              >
                Register Voter
              </motion.button>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold">Add Candidate</h2>
              <motion.input
                type="text"
                placeholder="Candidate Name"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.name}
                onChange={(e) => handleInputChange(e, setCandidateData, 'name')}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <motion.input
                type="text"
                placeholder="Candidate Address"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.address}
                onChange={(e) => handleInputChange(e, setCandidateData, 'address')}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <motion.input
                type="number"
                placeholder="Age"
                className="border rounded-lg p-2 w-full mb-2"
                value={candidateData.age}
                onChange={(e) => handleInputChange(e, setCandidateData, 'age')}
                whileFocus={{ scale: 1.05 }}
              />
              <motion.button
                onClick={addCandidate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
                whileTap={{ scale: 0.95 }}
              >
                Add Candidate
              </motion.button>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold">Candidates List</h2>
              {candidates.length > 0 ? (
                <motion.ul
                  className="list-none space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {candidates.map((candidate) => (
                    <motion.li
                      key={candidate.id}
                      className="p-4 bg-white rounded-lg shadow-md"
                      
                    >
                      <p><strong>Name:</strong> {candidate.name}</p>
                      <p><strong>Age:</strong> {candidate.age}</p>
                      <p><strong>Votes:</strong> {candidate.votes}</p>
                      <motion.button
                        onClick={() => vote(candidate.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}

                      >
                        Vote
                      </motion.button>
                      <motion.button
                        onClick={() => removeCandidate(candidate.id)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2"
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove Candidate
                      </motion.button>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <p>No candidates available</p>
              )}
            </div>

            <div className="mb-4">
              <motion.button
                onClick={checkWinner}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 w-full"
                whileHover={{ scale: 1.1 }}
              >
                Check Winner
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default App;
