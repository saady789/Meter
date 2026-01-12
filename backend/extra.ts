import Mnee, { type SdkConfig } from "@mnee/ts-sdk";

const config: SdkConfig = {
  environment: "sandbox", // or 'production'
  apiKey: "2f34b06c0a17aa40f2cce70ace9db3e6",
};

const mnee = new Mnee(config);
const res = await mnee.config();
//console.log("MNEE Configuration:", res);
const address = "13dX5yfZfi2kWjGS8VeGApjuWWENJhkTUp";
const balance = await mnee.balance(address);
console.log(`Balance for ${address}:`, balance);

// const status = await mnee.getTxStatus("a7c8b75f-f2d8-4414-b073-9d606ce4ba6b");
// console.log("status is ", status);

// const parsed = await mnee.parseTxFromRawTx(
//   "010000000393d4cc54f81d8065da7f22c5a0ad339a81a0ecddf65273af3885c034df79622500000000b4483045022100d3fcfe0bd28d7994576316d38939b303cbd9ec6072453e9ac1c88f724319acf902205ed6526ca2581fd9fca00a8815f2e3e58a28c22e403392206f440df3e9da8f44c1483045022100974991bf18a5acb272ab23e1a110788ee54cb0cdefca4c96fe5a1f5f4c2205c202204dbbaf3b0e1ef77d1bc843bf96b867027d7620d7b028a9c658dca316848feb05c12103b3e9189f2cf57cf559d29621dd22d8b7d62b32f17cf45c7c320163898d3fc6e6ffffffffee120d765a8b28704f1cf84718d4c1f92400e490f837651d25d838a5ddfcb142500000006a47304402204098a72ca01184a00b5f847fe2be980bc2a8bd855e1a174bd6f5d2a29e91de74022033c998b6bb92eb64a6dac85e758c89460428d1895cdb9d3b42834f7e714f09b041210255811f4cee0f4432fbd4e5f5339d932dfcc3ddc638652e9236328e7b8ff96e66ffffffffee120d765a8b28704f1cf84718d4c1f92400e490f837651d25d838a5ddfcb142510000006a473044022055c693baa6b1e00b07dc61e4440ece29ba3712256d5e0dc0a6d607c02c4f837502200ddea6f26c941051a8bdfc7dc36e439d4c8b8faf77aadd5fa7876f08ced88bc141210255811f4cee0f4432fbd4e5f5339d932dfcc3ddc638652e9236328e7b8ff96e66ffffffff030100000000000000d10063036f726451126170706c69636174696f6e2f6273762d3230004c777b2270223a226273762d3230222c226f70223a227472616e73666572222c226964223a22383333613737323039363661326134333564623238643936373338356538616137323834623631353065626233393438326363353232386237336531373033665f30222c22616d74223a22353030303030227d6876a91479a953faf6e57df7ddb86a63e779559487fb0e8c88ad2102bed35e894cc41cc9879b4002ad03d33533b615c1b476068c8dd6822a09f93f6cac0100000000000000ce0063036f726451126170706c69636174696f6e2f6273762d3230004c747b2270223a226273762d3230222c226f70223a227472616e73666572222c226964223a22383333613737323039363661326134333564623238643936373338356538616137323834623631353065626233393438326363353232386237336531373033665f30222c22616d74223a22313030227d6876a914b132fb8440e2d45b60d50ce8680aa9d0d316ab7288ad2102bed35e894cc41cc9879b4002ad03d33533b615c1b476068c8dd6822a09f93f6cac0100000000000000d10063036f726451126170706c69636174696f6e2f6273762d3230004c777b2270223a226273762d3230222c226f70223a227472616e73666572222c226964223a22383333613737323039363661326134333564623238643936373338356538616137323834623631353065626233393438326363353232386237336531373033665f30222c22616d74223a22343939393030227d6876a9141cd8572f0873de99f671341d02d8a3776d6d19d688ad2102bed35e894cc41cc9879b4002ad03d33533b615c1b476068c8dd6822a09f93f6cac00000000"
// );
// console.log("Parsed transaction:", parsed);

// ╭─────────────────────  Private Key  ──────────────────────╮
//    │                                                          │
//    │   🔑 Private Key Export                                  │
//    │                                                          │
//    │   💰 Wallet: saad                                        │
//    │   • Environment: sandbox                                 │
//    │   • Address: 13dX5yfZfi2kWjGS8VeGApjuWWENJhkTUp          │
//    │                                                          │
//    │   🔒 WIF Private Key:                                    │
//    │   L5ayPQkkdP33KuZbsSz5zvquHGUit6zhJANbD8XaGBbvmvmKWmzY   │
//    │                                                          │
//    │   ⚠️  KEEP THIS KEY SAFE!                                │
//    │   Never share it with anyone!                            │
//    │                                                          │
//    ╰──────────────────────────────────────────────────────────╯
