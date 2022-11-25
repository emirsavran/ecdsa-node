import { useState } from "react";
import { keccak256 } from "ethereum-cryptography/keccak";
import * as secp from "ethereum-cryptography/secp256k1";
import { utf8ToBytes } from "ethereum-cryptography/utils";
import { toHex } from "ethereum-cryptography/utils";
import server from "./server";

function Transfer({ address, setBalance, privateKey, nonce, setNonce }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const tx = {
      sender: address,
      amount: parseInt(sendAmount),
      recipient,
      nonce,
    };
    const signResult = await secp.sign(
      keccak256(utf8ToBytes(JSON.stringify(tx))),
      privateKey,
      {
        recovered: true,
      }
    );
    console.log(signResult);

    try {
      const {
        data: { balance, nonce },
      } = await server.post(`send`, {
        tx,
        signature: toHex(signResult[0]),
        recoveryBit: signResult[1],
      });
      setBalance(balance);
      setNonce(nonce);
    } catch (ex) {
      if (ex?.response?.data?.message) {
        alert(ex.response.data.message);
      }
      console.error(ex);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
