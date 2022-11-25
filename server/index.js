const express = require("express");
const app = express();
const cors = require("cors");
const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const port = 3042;

app.use(cors());
app.use(express.json());

const wallets = {
  "04ad1c5e7adf4fb4f9fbdc2fab67d46db9fb5f07b723ce3d4901f6365528272e08c5c7641027006f2bea0c7c2c846f39d541ed4522cf2a71b20e2e5262dc654041":
    {
      balance: 100,
      nonce: 0,
      // for ease of testing, we'll just store the private key here
      privateKey:
        "275b448374505dc115949203d4eb54a11458911e3f0ad61dd3d2e08141720c19",
    },
  "04d0a74293340d3adbab8448284d2cedcc227cbea80c0295a7efe7bda14c8f750a692c1ad4f953f7bc78c699f211ec59534681940576782a92f8b29f0af3330449":
    {
      balance: 50,
      nonce: 1,
      privateKey:
        "ad3fe02aad681d447f4fe56ecfb935022096c3b9ec84d77f04cc0670f3d7dfc6",
    },
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const wallet = wallets[address];

  res.send({ balance: wallet?.balance ?? 0, nonce: wallet?.nonce ?? 0 });
});

app.post("/send", (req, res) => {
  const { tx, signature, recoveryBit } = req.body;
  const { sender, recipient, amount, nonce } = tx;

  const senderAddress = toHex(
    recoverPublicKey(JSON.stringify(tx), signature, recoveryBit)
  );

  if (senderAddress !== sender) {
    return res
      .status(400)
      .send({ message: "Invalid signature, sender address does not match" });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const senderWallet = wallets[sender];
  const recipientWallet = wallets[recipient];

  if (senderWallet.nonce !== nonce) {
    return res.status(400).send({ message: "Invalid nonce!" });
  }

  if (senderWallet.balance < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    senderWallet.balance -= amount;
    senderWallet.nonce += 1;
    recipientWallet.balance += amount;
    res.send({ balance: senderWallet.balance, nonce: senderWallet.nonce });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!wallets[address]) {
    wallets[address] = { balance: 0, nonce: 0 };
  }
}

function recoverPublicKey(message, signature, recoveryBit) {
  const messageHash = keccak256(utf8ToBytes(message));
  return secp.recoverPublicKey(messageHash, signature, recoveryBit);
}
