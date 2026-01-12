//    ╭─────────────────────  Private Key  ──────────────────────╮
//    │                                                          │
//    │   🔑 Private Key Export                                  │
//    │                                                          │
//    │   💰 Wallet: saadyagent                                  │
//    │   • Environment: sandbox                                 │
//    │   • Address: 1C6HcLAt7azWL43mMjtLwvrdExeKgdqXCh          │
//    │                                                          │
//    │   🔒 WIF Private Key:                                    │
//    │   L198NT9Wavm8KGRb5CYzfRmdy8AinvaAkjrWDXYMZoKvHpqK73aU   │
//    │                                                          │
//    │   ⚠️  KEEP THIS KEY SAFE!                                │
//    │   Never share it with anyone!

import Mnee, { type SdkConfig } from "@mnee/ts-sdk";

const config: SdkConfig = {
  environment: "sandbox", // or 'production'
  apiKey: "2f34b06c0a17aa40f2cce70ace9db3e6",
};

const mnee = new Mnee(config);
const res = await mnee.config();
console.log("MNEE Config:", res);

const address = "1C6HcLAt7azWL43mMjtLwvrdExeKgdqXCh";
const bal = await mnee.balance(address);
console.log("Balance for address", address, "is", bal);
