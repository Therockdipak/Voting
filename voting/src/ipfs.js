import { create } from 'ipfs-http-client';

const projectId = '9f327af0439946aea34da3b4aab131ff'; // Replace with your Infura Project ID
const projectSecret = 'your-infura-project-secret'; // Replace with your Infura Project Secret
const auth =
  'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

// Upload data to IPFS
export const uploadToIPFS = async (data) => {
  try {
    const added = await client.add(JSON.stringify(data));
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (err) {
    console.error('Error uploading to IPFS:', err);
    throw err;
  }
};

// Fetch data from IPFS
export const fetchFromIPFS = async (cid) => {
  try {
    const response = await fetch(`https://ipfs.infura.io/ipfs/${cid}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching from IPFS:', err);
    throw err;
  }
};
